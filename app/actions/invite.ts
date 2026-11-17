"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn } from "@/auth";
import { hashToken } from "@/lib/tokens";

/**
 * Public (unauthenticated) invite flow. The opaque token is the only input —
 * email, household and role are resolved server-side from the Invitation row.
 * The DB stores only a sha256 of the token.
 */

function validInviteWhere(token: string) {
  return {
    tokenHash: hashToken(token),
    acceptedAt: null,
    expiresAt: { gt: new Date() },
  };
}

export async function getInvitation(token: string) {
  if (!token || typeof token !== "string") return null;
  const invitation = await prisma.invitation.findFirst({
    where: validInviteWhere(token),
    select: {
      email: true,
      role: true,
      household: { select: { name: true } },
    },
  });
  if (!invitation) return null;
  // The invited email must still be free (user may have registered meanwhile).
  const existing = await prisma.user.findUnique({
    where: { email: invitation.email },
    select: { id: true },
  });
  if (existing) return null;
  return {
    email: invitation.email,
    role: invitation.role,
    householdName: invitation.household.name,
  };
}

const acceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(80),
  password: z.string().min(8),
});

export type AcceptState = { error?: string } | undefined;

export async function acceptInvitation(
  _prev: AcceptState,
  formData: FormData,
): Promise<AcceptState> {
  const parsed = acceptSchema.safeParse({
    token: formData.get("token"),
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "invalid" };
  const { token, name, password } = parsed.data;

  const passwordHash = await bcrypt.hash(password, 12);

  // Re-validate and consume the invitation atomically.
  const result = await prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findFirst({
      where: validInviteWhere(token),
    });
    if (!invitation) return { error: "invalid" as const };

    const existing = await tx.user.findUnique({
      where: { email: invitation.email },
      select: { id: true },
    });
    if (existing) return { error: "invalid" as const };

    await tx.user.create({
      data: {
        email: invitation.email,
        name: name.trim(),
        passwordHash,
        role: invitation.role,
        householdId: invitation.householdId,
      },
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
    return { email: invitation.email };
  });

  if ("error" in result) return { error: result.error };

  try {
    await signIn("credentials", {
      email: result.email,
      password,
      redirectTo: "/dashboard",
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) return { error: "invalid" };
    throw error; // re-throw redirect
  }
}

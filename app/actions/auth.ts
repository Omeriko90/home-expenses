"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/auth";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(6),
  householdName: z.string().max(80).optional().nullable(),
});

export type AuthState = { error?: string } | undefined;

export async function registerUser(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    householdName: formData.get("householdName"),
  });
  if (!parsed.success) {
    return { error: "invalid" };
  }
  const { name, email, password, householdName } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return { error: "exists" };
  }

  // Registering creates a brand-new household; the registrant is its admin.
  // Invited users join an existing household via /invite/accept instead.
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.household.create({
    data: {
      name: householdName?.trim() || name,
      users: {
        create: {
          name,
          email: email.toLowerCase(),
          passwordHash,
          role: "ADMIN",
        },
      },
    },
  });

  await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  return undefined;
}

export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "credentials" };
    }
    throw error; // re-throw redirect
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

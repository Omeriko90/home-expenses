"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/session";
import { unstable_update } from "@/auth";
import { sendInviteEmail } from "@/lib/email";
import { generateToken, hashToken } from "@/lib/tokens";
import { idSchema } from "@/lib/validate";
import { isRateLimited, recordAttempt, clearAttempts } from "@/lib/rate-limit";
import { LOCALE_COOKIE } from "@/lib/i18n/server";
import { dictionaries, LOCALES, type Locale } from "@/lib/i18n/dictionaries";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ------------------------------------------------------------------ //
// Profile
// ------------------------------------------------------------------ //
const profileSchema = z.object({
  name: z.string().min(1).max(80),
  locale: z.enum(["he", "en"]),
});

export async function updateProfile(input: z.infer<typeof profileSchema>) {
  const user = await requireUser();
  const { name, locale } = profileSchema.parse(input);

  await prisma.user.update({
    where: { id: user.id },
    data: { name: name.trim(), locale },
  });

  // The UI locale is cookie-driven (see app/actions/locale.ts).
  if (LOCALES.includes(locale as Locale)) {
    const store = await cookies();
    store.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  // Refresh the JWT so the topbar shows the new name without re-login.
  await unstable_update({ user: { name: name.trim(), locale } });

  revalidatePath("/", "layout");
  return { ok: true as const };
}

// ------------------------------------------------------------------ //
// Password
// ------------------------------------------------------------------ //
const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function changePassword(input: z.infer<typeof passwordSchema>) {
  const user = await requireUser();
  const { currentPassword, newPassword } = passwordSchema.parse(input);

  // Throttle current-password guesses from a hijacked session.
  const limiterKey = `pwchange:${user.id}`;
  if (isRateLimited(limiterKey, 5, 15 * 60 * 1000)) {
    return { error: "wrongPassword" as const };
  }

  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  const ok = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!ok) {
    recordAttempt(limiterKey);
    return { error: "wrongPassword" as const };
  }
  clearAttempts(limiterKey);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordChangedAt: new Date() },
  });
  // Re-stamp this session so only OTHER sessions are invalidated.
  await unstable_update({ user: { authAt: Date.now() } });
  return { ok: true as const };
}

// ------------------------------------------------------------------ //
// Household
// ------------------------------------------------------------------ //
export async function updateHousehold(name: string) {
  const admin = await requireAdmin();
  const trimmed = z.string().parse(name).trim();
  if (!trimmed || trimmed.length > 80) return { error: "invalid" as const };
  await prisma.household.update({
    where: { id: admin.householdId },
    data: { name: trimmed },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

// ------------------------------------------------------------------ //
// Invitations
// ------------------------------------------------------------------ //
const inviteSchema = z.object({
  email: z.email(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

async function baseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

async function sendInvitation(invitation: {
  email: string;
  token: string;
  householdName: string;
  inviterLocale: string;
}) {
  const inviteUrl = `${await baseUrl()}/invite/accept?token=${invitation.token}`;
  const t =
    dictionaries[(invitation.inviterLocale as Locale) in dictionaries
      ? (invitation.inviterLocale as Locale)
      : "he"];
  const { delivered } = await sendInviteEmail({
    to: invitation.email,
    inviteUrl,
    subject: t.settings.inviteEmailSubject.replace(
      "{household}",
      invitation.householdName,
    ),
    body: t.settings.inviteEmailBody.replace(
      "{household}",
      invitation.householdName,
    ),
  });
  return { delivered, inviteUrl };
}

export async function createInvitation(input: z.infer<typeof inviteSchema>) {
  const admin = await requireAdmin();
  const { role } = inviteSchema.parse(input);
  const email = inviteSchema.parse(input).email.toLowerCase();

  // Already a user anywhere — email is the global login key.
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return { error: "emailExists" as const };

  const existingInvite = await prisma.invitation.findUnique({
    where: {
      householdId_email: { householdId: admin.householdId, email },
    },
  });
  if (
    existingInvite &&
    !existingInvite.acceptedAt &&
    existingInvite.expiresAt > new Date()
  ) {
    return { error: "alreadyInvited" as const };
  }

  const token = generateToken();
  const data = {
    email,
    tokenHash: hashToken(token),
    role,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    acceptedAt: null,
    invitedById: admin.id,
  };
  await prisma.invitation.upsert({
    where: { householdId_email: { householdId: admin.householdId, email } },
    update: data,
    create: { ...data, householdId: admin.householdId },
  });

  const household = await prisma.household.findUniqueOrThrow({
    where: { id: admin.householdId },
    select: { name: true },
  });
  const { delivered, inviteUrl } = await sendInvitation({
    email,
    token,
    householdName: household.name,
    inviterLocale: admin.locale,
  });

  revalidatePath("/settings");
  return { ok: true as const, delivered, inviteUrl };
}

export async function resendInvitation(id: string) {
  const admin = await requireAdmin();
  idSchema.parse(id);
  const invitation = await prisma.invitation.findFirst({
    where: { id, householdId: admin.householdId, acceptedAt: null },
    include: { household: { select: { name: true } } },
  });
  if (!invitation) return { error: "notFound" as const };

  const token = generateToken();
  await prisma.invitation.update({
    where: { id },
    data: {
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });

  const { delivered, inviteUrl } = await sendInvitation({
    email: invitation.email,
    token,
    householdName: invitation.household.name,
    inviterLocale: admin.locale,
  });

  revalidatePath("/settings");
  return { ok: true as const, delivered, inviteUrl };
}

export async function revokeInvitation(id: string) {
  const admin = await requireAdmin();
  idSchema.parse(id);
  await prisma.invitation.deleteMany({
    where: { id, householdId: admin.householdId },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

// ------------------------------------------------------------------ //
// Members
// ------------------------------------------------------------------ //
export async function removeMember(userId: string) {
  const admin = await requireAdmin();
  idSchema.parse(userId);
  if (userId === admin.id) return { error: "cannotRemoveSelf" as const };

  const target = await prisma.user.findFirst({
    where: { id: userId, householdId: admin.householdId },
  });
  if (!target) return { error: "notFound" as const };

  if (target.role === "ADMIN") {
    const admins = await prisma.user.count({
      where: { householdId: admin.householdId, role: "ADMIN" },
    });
    if (admins <= 1) return { error: "lastAdmin" as const };
  }

  // Transaction attribution survives: createdByUserId is optional (SetNull).
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/settings");
  return { ok: true as const };
}

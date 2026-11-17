"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/db";
import { signIn, signOut } from "@/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateToken, hashToken } from "@/lib/tokens";
import { isRateLimited, recordAttempt, clearAttempts } from "@/lib/rate-limit";

const BCRYPT_COST = 12;

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
  householdName: z.string().max(80).optional().nullable(),
});

export type AuthState = { error?: string; success?: boolean } | undefined;

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

  // Throttle mass account/household creation.
  const regKey = `register:${email.toLowerCase()}`;
  if (isRateLimited(regKey, 5, 60 * 60 * 1000)) {
    return { error: "rateLimited" };
  }
  recordAttempt(regKey);

  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    // Same generic error as validation failure so responses don't reveal
    // whether an email is registered.
    return { error: "invalid" };
  }

  // Registering creates a brand-new household; the registrant is its admin.
  // Invited users join an existing household via /invite/accept instead.
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
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

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function authenticate(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const limiterKey = `login:${email}`;

  if (isRateLimited(limiterKey, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)) {
    return { error: "rateLimited" };
  }

  try {
    await signIn("credentials", {
      email,
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
    clearAttempts(limiterKey);
    return undefined;
  } catch (error) {
    if (error instanceof AuthError) {
      recordAttempt(limiterKey);
      return { error: "credentials" };
    }
    throw error; // re-throw redirect
  }
}

const RESET_MAX_REQUESTS = 3;
const RESET_WINDOW_MS = 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = z.email().safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: "invalid" };
  }
  const email = parsed.data.toLowerCase();

  const limiterKey = `reset:${email}`;
  if (isRateLimited(limiterKey, RESET_MAX_REQUESTS, RESET_WINDOW_MS)) {
    return { error: "rateLimited" };
  }
  recordAttempt(limiterKey);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = generateToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });
    const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
    await sendPasswordResetEmail(
      user.email,
      `${baseUrl}/reset-password?token=${token}`,
    );
  }

  // Identical response whether or not the account exists.
  return { success: true };
}

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function resetPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: "invalid" };
  }
  const { token, password } = parsed.data;

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "invalidToken" };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
    }),
  ]);
  clearAttempts(`login:${record.user.email}`);

  await signIn("credentials", {
    email: record.user.email,
    password,
    redirectTo: "/dashboard",
  });
  return undefined;
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}

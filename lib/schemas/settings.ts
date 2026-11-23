import { z } from "zod";
import { LOCALES, type Dictionary } from "@/lib/i18n/dictionaries";

export const UserRoles = {
  Member: "MEMBER",
  Admin: "ADMIN",
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export const InviteErrors = {
  EmailExists: "emailExists",
  AlreadyInvited: "alreadyInvited",
} as const;

export function createProfileSchema(t?: Dictionary) {
  return z.object({
    name: z.string().trim().min(1, t?.errors.required).max(80),
    locale: z.enum(LOCALES),
  });
}

export const profileSchema = createProfileSchema();
export type ProfileInput = z.infer<typeof profileSchema>;

export function createPasswordSchema(t?: Dictionary) {
  return z.object({
    currentPassword: z.string().min(1, t?.errors.required),
    newPassword: z.string().min(8, t?.errors.passwordMin),
  });
}

export const passwordSchema = createPasswordSchema();
export type PasswordInput = z.infer<typeof passwordSchema>;

export function createInviteSchema(t?: Dictionary) {
  return z.object({
    email: z.email(t?.errors.invalidEmail),
    role: z.enum([UserRoles.Member, UserRoles.Admin]),
  });
}

export const inviteSchema = createInviteSchema();
export type InviteInput = z.infer<typeof inviteSchema>;

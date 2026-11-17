import { createHash, randomBytes } from "crypto";

// Opaque link tokens (password reset, invites): the raw token travels only in
// the emailed link; the DB stores a sha256 so a leak can't be replayed.
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

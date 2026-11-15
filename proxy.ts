import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Edge-safe proxy (Next 16's middleware successor): JWT session check only,
// no Prisma / bcrypt here.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Protect everything except Next internals, auth API, and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};

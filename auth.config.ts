import type { NextAuthConfig } from "next-auth";

// Edge-safe config (no Node-only deps). Shared by middleware + full auth.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register") ||
        nextUrl.pathname.startsWith("/forgot-password") ||
        nextUrl.pathname.startsWith("/reset-password");

      // Invite-accept is public: the invitee has no account yet. A logged-in
      // user may still open it (to see the "log out first" notice).
      if (nextUrl.pathname.startsWith("/invite")) {
        return true;
      }

      // Auth pages are public. The "already logged in → dashboard" bounce
      // lives in the pages themselves (DB-checked, so stale sessions can
      // still reach the login form instead of redirect-looping).
      if (isAuthPage) {
        return true;
      }

      // Everything else requires auth.
      return isLoggedIn;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        const u = user as {
          id?: string;
          locale?: string;
          role?: string;
          householdId?: string;
        };
        token.id = u.id as string;
        token.locale = u.locale ?? "he";
        token.role = u.role ?? "MEMBER";
        token.householdId = u.householdId ?? "";
        // Sign-in instant; compared against passwordChangedAt to invalidate
        // stale sessions after a password change (see lib/session.ts).
        token.authAt = Date.now();
      }
      // unstable_update() from server actions (e.g. profile rename).
      if (trigger === "update" && session?.user) {
        const u = session.user as {
          name?: string;
          locale?: string;
          authAt?: number;
        };
        if (u.name) token.name = u.name;
        if (u.locale) token.locale = u.locale;
        if (u.authAt) token.authAt = u.authAt;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.locale = (token.locale as string) ?? "he";
        session.user.role = (token.role as "ADMIN" | "MEMBER") ?? "MEMBER";
        session.user.householdId = (token.householdId as string) ?? "";
        session.user.authAt = (token.authAt as number) ?? 0;
      }
      return session;
    },
  },
  providers: [], // added in auth.ts (Node runtime)
} satisfies NextAuthConfig;

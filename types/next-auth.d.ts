import { DefaultSession } from "next-auth";

type AppRole = "ADMIN" | "MEMBER";

declare module "next-auth" {
  interface User {
    locale?: string;
    role?: AppRole;
    householdId?: string;
  }

  interface Session {
    user: {
      id: string;
      locale: string;
      role: AppRole;
      householdId: string;
      /** Sign-in instant (ms); sessions older than passwordChangedAt are rejected. */
      authAt: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    locale: string;
    role: AppRole;
    householdId: string;
    authAt?: number;
  }
}

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
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    locale: string;
    role: AppRole;
    householdId: string;
  }
}

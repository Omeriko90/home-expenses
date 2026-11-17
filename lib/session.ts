import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * DB-verified current user, or null. Confirms the JWT's user still exists and
 * that the session wasn't issued before the last password change — so removed
 * members and stolen sessions die on their next request. The session doing a
 * password change is re-stamped via unstable_update (see changePassword).
 */
export async function freshSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      locale: true,
      role: true,
      householdId: true,
      passwordChangedAt: true,
    },
  });
  if (!user) return null;

  const authAt = session.user.authAt;
  if (
    user.passwordChangedAt &&
    authAt &&
    authAt < user.passwordChangedAt.getTime()
  ) {
    return null;
  }

  const { passwordChangedAt: _ignored, ...publicUser } = user;
  return publicUser;
}

export async function requireUser() {
  const user = await freshSessionUser();
  // Stale/removed sessions land on the login form (it renders for them — the
  // logged-in bounce is DB-checked too), where signing in mints a new session.
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

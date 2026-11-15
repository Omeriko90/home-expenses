import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * DB-verified current user. Reads the JWT session, then confirms the user
 * still exists and returns the fresh record — so role/household are never
 * stale and removed members lose access on their next action.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      locale: true,
      role: true,
      householdId: true,
    },
  });
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

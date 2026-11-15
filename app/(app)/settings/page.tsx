import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { SettingsView } from "@/components/features/settings/settings-view";

export default async function SettingsPage() {
  const user = await requireUser();

  const [household, members, invitations] = await Promise.all([
    prisma.household.findUniqueOrThrow({
      where: { id: user.householdId },
      select: { name: true },
    }),
    prisma.user.findMany({
      where: { householdId: user.householdId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: {
        householdId: user.householdId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, email: true, role: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <SettingsView
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        locale: user.locale,
        role: user.role,
      }}
      householdName={household.name}
      members={members.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
        role: m.role,
        joinedAt: m.createdAt.toISOString(),
      }))}
      invitations={invitations.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        expiresAt: i.expiresAt.toISOString(),
      }))}
    />
  );
}

/**
 * Create (or update) a household user account.
 * Usage: npx tsx scripts/create-user.ts <email> <name> <password> [locale] [role] [householdId]
 *
 * - role: ADMIN | MEMBER (default ADMIN — CLI-created users are owners)
 * - householdId: target household; defaults to the first household in the DB,
 *   creating one if none exists.
 */
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email, name, password, locale = "he", roleArg = "ADMIN", householdIdArg] =
    process.argv.slice(2);
  if (!email || !name || !password) {
    console.error(
      "Usage: npx tsx scripts/create-user.ts <email> <name> <password> [locale] [role] [householdId]",
    );
    process.exit(1);
  }

  const role = roleArg.toUpperCase() === "MEMBER" ? Role.MEMBER : Role.ADMIN;

  let householdId = householdIdArg;
  if (!householdId) {
    const household =
      (await prisma.household.findFirst({ orderBy: { createdAt: "asc" } })) ??
      (await prisma.household.create({ data: { name: "הבית שלנו" } }));
    householdId = household.id;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { name, passwordHash, locale, role },
    create: {
      email: email.toLowerCase(),
      name,
      passwordHash,
      locale,
      role,
      householdId,
    },
  });

  console.log(
    `✓ User ready: ${user.name} <${user.email}> (locale=${user.locale}, role=${user.role}, household=${user.householdId})`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

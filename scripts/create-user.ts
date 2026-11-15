/**
 * Create (or update) a household user account.
 * Usage: npx tsx scripts/create-user.ts <email> <name> <password> [locale]
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [email, name, password, locale = "he"] = process.argv.slice(2);
  if (!email || !name || !password) {
    console.error(
      "Usage: npx tsx scripts/create-user.ts <email> <name> <password> [locale]",
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: { name, passwordHash, locale },
    create: { email: email.toLowerCase(), name, passwordHash, locale },
  });

  console.log(`✓ User ready: ${user.name} <${user.email}> (locale=${user.locale})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.role.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN", description: "Full access" },
  });
  await prisma.role.upsert({
    where: { name: "VIEWER" },
    update: {},
    create: { name: "VIEWER", description: "Read-only" },
  });
}

main().finally(() => prisma.$disconnect());

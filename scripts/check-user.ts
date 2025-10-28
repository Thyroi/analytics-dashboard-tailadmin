import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function checkUser() {
  const email = "thyroi0208@gmail.com";
  const testPassword = "condadoHuelva123";

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      auth0Sub: true,
    },
  });

  if (!user) {
    console.log("❌ Usuario no encontrado");
    return;
  }

  console.log("✅ Usuario encontrado:");
  console.log("  - ID:", user.id);
  console.log("  - Email:", user.email);
  console.log("  - Auth0Sub:", user.auth0Sub);
  console.log("  - Tiene password:", !!user.password);

  if (user.password) {
    const isValid = await argon2.verify(user.password, testPassword);
    console.log(`  - Password válida con "${testPassword}":`, isValid);
  }

  await prisma.$disconnect();
}

checkUser();

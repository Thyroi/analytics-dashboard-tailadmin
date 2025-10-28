/**
 * Script para asignar password por defecto a usuarios sin contraseña
 * Ejecutar con: npx tsx scripts/set-default-passwords.ts
 */

import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = "condadoHuelva123";

async function setDefaultPasswords() {
  console.log("🔍 Buscando usuarios sin contraseña...");

  const usersWithoutPassword = await prisma.user.findMany({
    where: { password: null },
    select: { id: true, email: true },
  });

  console.log(
    `📊 Encontrados ${usersWithoutPassword.length} usuarios sin contraseña`
  );

  if (usersWithoutPassword.length === 0) {
    console.log("✅ Todos los usuarios ya tienen contraseña");
    return;
  }

  console.log(`🔐 Hasheando password por defecto: "${DEFAULT_PASSWORD}"`);
  const hashedPassword = await argon2.hash(DEFAULT_PASSWORD);

  let updated = 0;
  for (const user of usersWithoutPassword) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });
    console.log(`  ✓ Password asignado a ${user.email}`);
    updated++;
  }

  console.log(`\n✅ Migración completada: ${updated} usuarios actualizados`);
  console.log(
    `⚠️  Recuerda que todos tienen la contraseña: ${DEFAULT_PASSWORD}`
  );
  console.log(`⚠️  Los usuarios deben cambiarla en su primer login`);
}

setDefaultPasswords()
  .catch((error) => {
    console.error("❌ Error en la migración:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

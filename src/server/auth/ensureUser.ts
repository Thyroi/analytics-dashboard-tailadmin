import { prisma } from "@/server/db";


export type EnsureUserInput = {
  sub: string;              // viene de Auth0 -> User.auth0Sub
  email: string;            // requerido por tu esquema
  picture?: string | null;  // lo mapeamos a avatarUrl
};

export async function ensureUser({ sub, email, picture }: EnsureUserInput) {
  // 1) Buscar por auth0Sub (no por "sub")
  const existing = await prisma.user.findUnique({
    where: { auth0Sub: sub },
    include: {
      roles: { include: { role: true } },
      profile: true,
    },
  });
  if (existing) return existing;

  // 2) Asegurar roles base
  await prisma.role.upsert({
    where: { name: "ADMIN" },
    create: { name: "ADMIN" },
    update: {},
  });
  await prisma.role.upsert({
    where: { name: "VIEWER" },
    create: { name: "VIEWER" },
    update: {},
  });

  // 3) Crear user SIN castear email a null
  const created = await prisma.user.create({
    data: {
      auth0Sub: sub,
      email,
      avatarUrl: picture ?? undefined,
      profile: { create: {} },
      roles: {
        create: [{ role: { connect: { name: "VIEWER" } } }],
      },
    },
    include: {
      roles: { include: { role: true } },
      profile: true,
    },
  });

  return created;
}

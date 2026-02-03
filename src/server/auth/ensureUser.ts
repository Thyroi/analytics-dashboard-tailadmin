import { prisma } from "@/server/db";
import argon2 from "argon2";

export type EnsureUserInput = {
  sub?: string; // viene de Auth0 -> User.auth0Sub (opcional para híbrido)
  email: string; // requerido por tu esquema
  picture?: string | null; // lo mapeamos a avatarUrl
  password?: string; // para validación de login local
};

export async function ensureUser({
  sub,
  email,
  picture,
  password,
}: EnsureUserInput) {
  // ===== CASO 1: Login con Auth0 =====
  if (sub) {
    const existing = await prisma.user.findUnique({
      where: { auth0Sub: sub },
      include: {
        roles: { include: { role: true } },
        profile: true,
      },
    });
    if (existing) return existing;

    throw new Error("Usuario no registrado");
  }

  // ===== CASO 2: Login Local (email + password) =====
  if (password) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: {
        id: true,
        email: true,
        auth0Sub: true,
        password: true, // Incluir explícitamente
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        roles: { include: { role: true } },
        profile: true,
      },
    });

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (!user.password) {
      throw new Error(
        "Este usuario no tiene contraseña configurada. Usa Auth0 para iniciar sesión.",
      );
    }

    const isValid = await argon2.verify(user.password, password);
    if (!isValid) {
      throw new Error("Contraseña incorrecta");
    }

    return user;
  }

  throw new Error("Método de autenticación no especificado");
}

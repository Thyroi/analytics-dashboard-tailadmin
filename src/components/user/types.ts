import type { AppRouter } from "@/server/trpc/";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type Me = NonNullable<RouterOutputs["user"]["me"]>;

export type Social = {
  linkedin?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  x?: string | null;
};

export function parseSocial(input: unknown): Social | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  return {
    linkedin: typeof o.linkedin === "string" ? o.linkedin : null,
    facebook: typeof o.facebook === "string" ? o.facebook : null,
    instagram: typeof o.instagram === "string" ? o.instagram : null,
    x: typeof o.x === "string" ? o.x : null,
  };
}

export function hasAnySocial(s: Social | null): boolean {
  return !!s && (!!s.linkedin || !!s.facebook || !!s.instagram || !!s.x);
}

export function getFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string | null | undefined
): string {
  return [firstName, lastName].filter(Boolean).join(" ") || email || "Usuario";
}

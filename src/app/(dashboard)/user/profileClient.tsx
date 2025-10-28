"use client";

import Avatar from "@/components/common/Avatar";
import { trpc } from "@/lib/trpc/client";
import type { AppRouter } from "@/server/trpc/";
import type { inferRouterOutputs } from "@trpc/server";
import { useMemo } from "react";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Me = NonNullable<RouterOutputs["user"]["me"]>;

type Social = {
  linkedin?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  x?: string | null; // twitter/x
};

function parseSocial(input: unknown): Social | null {
  if (!input || typeof input !== "object") return null;
  const o = input as Record<string, unknown>;
  return {
    linkedin: typeof o.linkedin === "string" ? o.linkedin : null,
    facebook: typeof o.facebook === "string" ? o.facebook : null,
    instagram: typeof o.instagram === "string" ? o.instagram : null,
    x: typeof o.x === "string" ? o.x : null,
  };
}

function hasAnySocial(s: Social | null): boolean {
  return !!s && (!!s.linkedin || !!s.facebook || !!s.instagram || !!s.x);
}

export default function ProfileClient() {
  const { data, isLoading, error } = trpc.user.me.useQuery(undefined, {
    staleTime: 30_000,
  });

  if (isLoading) return <ProfileSkeleton />;

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <p className="text-sm text-red-600">
            No se pudo cargar tu perfil: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="card">
        <div className="card-body flex items-center justify-between">
          <div>
            <h2 className="card-title">No has iniciado sesión</h2>
            <p className="card-subtitle">
              Inicia sesión para ver y editar tu perfil.
            </p>
          </div>
          <a
            href="/auth/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Iniciar sesión
          </a>
        </div>
      </div>
    );
  }

  return <ProfileView me={data} />;
}

function ProfileView({ me }: { me: Me }) {
  const { email, avatarUrl, profile, roles } = me;

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    email ||
    "Usuario";

  const socials = useMemo(
    () => parseSocial(profile?.social),
    [profile?.social]
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="card">
        <div className="card-body flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={avatarUrl}
              name={fullName}
              email={email ?? undefined}
              size={56}
            />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {fullName}
              </h2>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {email}
                {roles.length > 0 && (
                  <span className="ml-2 inline-flex gap-1">
                    {roles.map((r) => (
                      <span
                        key={r.roleId}
                        className="rounded border border-gray-200 px-2 py-0.5 text-xs dark:border-white/10"
                      >
                        {r.role.name}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          </div>

          <a
            href="/auth/logout"
            className="inline-flex items-center rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            Cerrar sesión
          </a>
        </div>
      </div>

      {/* Información personal */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Información personal</h3>
        </div>
        <div className="card-body">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="First Name" value={profile?.firstName ?? undefined} />
            <Field label="Last Name" value={profile?.lastName ?? undefined} />
            <Field label="Email address" value={email ?? undefined} />
            <Field label="Phone" value={profile?.phone ?? undefined} />
            <Field label="Bio" value={profile?.bio ?? undefined} full />
          </dl>
        </div>
      </div>

      {/* Dirección */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Address</h3>
        </div>
        <div className="card-body">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field label="Country" value={profile?.country ?? undefined} />
            <Field
              label="City/State"
              value={
                [profile?.city, profile?.state].filter(Boolean).join(", ") ||
                undefined
              }
            />
            <Field
              label="Postal Code"
              value={profile?.postalCode ?? undefined}
            />
            <Field label="TAX ID" value={profile?.taxId ?? undefined} />
          </dl>
        </div>
      </div>

      {/* Redes sociales */}
      {hasAnySocial(socials) && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Redes sociales</h3>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field label="LinkedIn" value={socials?.linkedin ?? undefined} />
              <Field label="Facebook" value={socials?.facebook ?? undefined} />
              <Field
                label="Instagram"
                value={socials?.instagram ?? undefined}
              />
              <Field label="X (Twitter)" value={socials?.x ?? undefined} />
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  full = false,
}: {
  label: string;
  value?: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
        {value ? value : <span className="text-gray-400">—</span>}
      </dd>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((k) => (
        <div key={k} className="card">
          <div className="card-body">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded bg-gray-200 dark:bg-white/10"
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

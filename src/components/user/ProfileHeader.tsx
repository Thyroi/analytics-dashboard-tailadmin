"use client";

import Avatar from "@/components/common/Avatar";
import type { Me } from "./types";

type ProfileHeaderProps = {
  me: Me;
  onEditClick: () => void;
};

export default function ProfileHeader({ me, onEditClick }: ProfileHeaderProps) {
  const { email, avatarUrl, profile, roles } = me;

  const fullName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    email ||
    "Usuario";

  const handleLogout = async () => {
    try {
      // 1. Cerrar sesión local (si existe)
      await fetch("/api/auth/local/logout", { method: "POST" });

      // 2. Redirigir a logout de Auth0 (que también limpia su sesión)
      window.location.href = "/auth/logout";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Aún así redirigir a Auth0 logout
      window.location.href = "/auth/logout";
    }
  };

  return (
    <div className="card">
      <div className="card-body p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
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

          <div className="flex items-center gap-2">
            <button
              onClick={onEditClick}
              className="inline-flex items-center gap-2 rounded-lg bg-huelva-primary px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              aria-label="Editar perfil"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
              Editar perfil
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

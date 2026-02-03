"use client";

import Avatar from "@/components/common/Avatar";
import { ChevronDown, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type MinimalUser = {
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  nickname?: string | null;
};

type Props = {
  user: MinimalUser;
  className?: string;
};

export default function UserDropdown({ user, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Cerrar al hacer click fuera o al presionar ESC
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const displayName = user.name ?? user.nickname ?? user.email ?? "Usuario";
  const email = user.email ?? "";

  const handleLogout = async () => {
    try {
      // 1. Cerrar sesión local (si existe)
      await fetch("/api/auth/local/logout", { method: "POST" });

      // 2. Redirigir a logout de Auth0 (que también limpia su sesión)
      const returnTo = encodeURIComponent(`${window.location.origin}/login`);
      window.location.href = `/auth/logout?returnTo=${returnTo}`;
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Aún así redirigir a Auth0 logout
      const returnTo = encodeURIComponent(`${window.location.origin}/login`);
      window.location.href = `/auth/logout?returnTo=${returnTo}`;
    }
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-white/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar src={user.picture} name={displayName} email={email} size={28} />
        <span className="text-sm text-gray-900 dark:text-gray-100 max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 rounded-2xl bg-white border border-gray-200 shadow-lg p-3
               dark:bg-neutral-900 dark:border-white/10
               text-gray-700 dark:text-gray-200"
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-2">
            <Avatar
              src={user.picture}
              name={displayName}
              email={email}
              size={40}
            />
            <div className="min-w-0">
              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                {displayName}
              </div>
              <div className="text-xs text-gray-500 truncate">{email}</div>
            </div>
          </div>

          <div className="my-3 h-px bg-gray-100 dark:bg-white/10" />

          <div className="flex flex-col">
            <a
              href="/user"
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-sm
                   text-gray-700 dark:text-gray-200"
              role="menuitem"
            >
              <User className="h-4 w-4 text-gray-400" />
              Ver perfil
            </a>
          </div>

          <div className="my-3 h-px bg-gray-100 dark:bg-white/10" />

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-sm
                 text-red-600 dark:text-red-400 w-full text-left"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, LogOut, User, Settings, LifeBuoy } from "lucide-react";

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

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-white/5"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Image
          src={user.picture || "/avatar.png"}
          alt={displayName}
          width={28}
          height={28}
          className="rounded-full"
        />
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
            <Image
              src={user.picture || "/avatar.png"}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full"
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
            <a
              href="/settings"
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-sm
                   text-gray-700 dark:text-gray-200"
              role="menuitem"
            >
              <Settings className="h-4 w-4 text-gray-400" />
              Configuración (WIP)
            </a>
            <a
              href="mailto:soporte@tuempresa.com"
              className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-sm
                   text-gray-700 dark:text-gray-200"
              role="menuitem"
            >
              <LifeBuoy className="h-4 w-4 text-gray-400" />
              Soporte
            </a>
          </div>

          <div className="my-3 h-px bg-gray-100 dark:bg-white/10" />

          <a
            href="/auth/logout"
            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-sm
                 text-red-600 dark:text-red-400"
            role="menuitem"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </a>
        </div>
      )}
    </div>
  );
}

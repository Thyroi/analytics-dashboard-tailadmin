"use client";

import AuthUserMenu from "@/components/auth/AuthUserMenu";
import { useSidebar } from "@/context/SidebarContext";
import { Bars3Icon, MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function AppHeader() {
  const { setIsMobileOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-40 flex items-center h-14 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      {/* Botón menú (izquierda) */}
      <button
        className="lg:hidden p-2 text-gray-700 dark:text-gray-300"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Abrir menú"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Empuja las acciones a la derecha */}
      <div className="ml-auto" />

      {/* Acciones (derecha) */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Cambiar tema"
        >
          {theme === "dark" ? (
            <SunIcon className="w-5 h-5 text-yellow-400" />
          ) : (
            <MoonIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>

        <AuthUserMenu className="ml-1" connection="google-workspace" />
      </div>
    </header>
  );
}

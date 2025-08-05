"use client";

import { useSidebar } from "@/context/SidebarContext";
import { Bars3Icon, MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function AppHeader() {
  const { setIsMobileOpen } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita problemas de hidratación
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <header className="header-container">
      {/* Botón para abrir Sidebar en móvil */}
      <button
        className="lg:hidden p-2 text-gray-700 dark:text-gray-300"
        onClick={() => setIsMobileOpen(true)}
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      <h1 className="header-title">Dashboard</h1>

      <div className="header-actions flex items-center gap-3">
        {/* Toggle Dark Mode */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {theme === "dark" ? (
            <SunIcon className="w-5 h-5 text-yellow-400" />
          ) : (
            <MoonIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          )}
        </button>
      </div>
    </header>
  );
}

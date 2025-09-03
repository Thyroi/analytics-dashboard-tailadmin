"use client";

import Link from "next/link";
import { useSidebar } from "@/context/SidebarContext";
import { SidebarItemDef } from "./types";
import { useEffect, useState } from "react";

type Props = {
  item: SidebarItemDef;
  active: boolean;
};

export default function SidebarItem({ item, active }: Props) {
  const { isExpanded, isHovered, isMobileOpen, setIsMobileOpen } = useSidebar();

  // para centrar icono cuando está colapsado (SSR-safe)
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  return (
    <Link
      href={item.path}
      onClick={() => setIsMobileOpen(false)}
      className={[
        "group relative flex items-center gap-3 rounded-md py-3 transition-colors duration-200",
        active
          ? "pl-3 pr-3 bg-[var(--color-huelva-primary)] text-white shadow-sm"
          : "px-3 text-gray-800 dark:text-gray-100",
        // Hover solo en inactivos: sin fondo, solo color
        !active
          ? "hover:text-[var(--color-huelva-primary)] dark:hover:text-[var(--color-huelva-primary)]"
          : "",
        // Colapsado => centrado
        !ready || (!isExpanded && !isHovered && !isMobileOpen)
          ? "lg:justify-center"
          : "justify-start",
      ].join(" ")}
    >
      {/* Icono */}
      <span
        className={[
          "flex-shrink-0 transition-colors duration-200",
          active ? "text-white" : "text-gray-600 dark:text-gray-300",
          !active
            ? "group-hover:text-[var(--color-huelva-primary)] dark:group-hover:text-[var(--color-huelva-primary)]"
            : "",
        ].join(" ")}
      >
        {item.icon}
      </span>

      {/* Label (solo si sidebar abierto) */}
      {(isExpanded || isHovered || isMobileOpen) && (
        <span
          className={[
            "font-medium transition-colors duration-200",
            active ? "text-white" : "",
            !active
              ? "group-hover:text-[var(--color-huelva-primary)] dark:group-hover:text-[var(--color-huelva-primary)]"
              : "",
          ].join(" ")}
        >
          {item.name}
        </span>
      )}
    </Link>
  );
}

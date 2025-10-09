"use client";

import { useSidebar } from "@/context/SidebarContext";
import { trpc } from "@/lib/trpc/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

import SidebarSection from "@/components/sidebar/SidebarSection";
import {
  ADMIN_ITEM,
  PRIMARY_ITEMS,
  SECONDARY_ITEMS_BASE,
} from "@/components/sidebar/menu";

function cleanPath(p: string) {
  // quita query/hash y el trailing slash
  const noQS = p.split("?")[0].split("#")[0];
  const trimmed = noQS.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export default function AppSidebar() {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered } = useSidebar();
  const pathname = usePathname();

  const { data: me } = trpc.user.meOptional.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 0,
    placeholderData: (p) => p,
  });

  const isAdmin =
    me?.roles?.some((r) => r.role?.name?.toUpperCase() === "ADMIN") ?? false;

  const isActive = useCallback(
    (path: string) => {
      const a = cleanPath(pathname || "/");
      const b = cleanPath(path);
      if (b === "/") return a === "/"; // Home solo exacto
      return a === b || a.startsWith(b + "/"); // Marca activo también en subrutas
    },
    [pathname]
  );

  const secondaryItems = useMemo(
    () =>
      isAdmin ? [...SECONDARY_ITEMS_BASE, ADMIN_ITEM] : SECONDARY_ITEMS_BASE,
    [isAdmin]
  );

  return (
    <aside
      className={`fixed top-0 left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen transition-all duration-300 ease-in-out z-50
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-6 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start px-4"
        }`}
      >
        <Link
          href="/"
          className="text-lg font-bold text-huelva-primary dark:text-white"
        >
          Dashboard
        </Link>
      </div>

      <nav className="flex flex-col gap-2 px-3">
        <SidebarSection items={PRIMARY_ITEMS} isActive={isActive} />
        <div className="my-3 border-t border-gray-200 dark:border-gray-800" />
        <SidebarSection items={secondaryItems} isActive={isActive} />
      </nav>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  Squares2X2Icon,
  ChevronDownIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";

// TRPC client
import { trpc } from "@/lib/trpc/client";
// Tipo del usuario desde Zod (solo type)
import type { User as MeUser } from "@/server/trpc/schemas/user";

export default function AppSidebar() {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const pathname = usePathname();

  // ---- Me (dentro del componente) ----
  const { data: me } = trpc.user.me.useQuery<MeUser | null>(undefined, {
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev, // reduce flicker un poco
  });

  const isAdmin = useMemo(
    () => me?.roles?.some((r) => r.role?.name?.toUpperCase() === "ADMIN") ?? false,
    [me]
  );

  // ---- Items ----
  const dashboardItems = useMemo(
    () => [
      { name: "Analytics", path: "/analytics" },
    ],
    []
  );

  const adminItems = useMemo(
    () => [{ name: "Users", path: "/users" }],
    []
  );

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  // ---- Submenu: Dashboard ----
  const [openDashboard, setOpenDashboard] = useState(false);
  const dashRef = useRef<HTMLDivElement | null>(null);
  const [dashHeight, setDashHeight] = useState(0);
  const dashHasActive = dashboardItems.some((sub) => isActive(sub.path));

  useEffect(() => {
    if (dashHasActive) setOpenDashboard(true);
  }, [dashHasActive]);

  useEffect(() => {
    if (openDashboard && dashRef.current) setDashHeight(dashRef.current.scrollHeight);
    else setDashHeight(0);
  }, [openDashboard]);

  // ---- Submenu: Admin ----
  const [openAdmin, setOpenAdmin] = useState(false);
  const adminRef = useRef<HTMLDivElement | null>(null);
  const [adminHeight, setAdminHeight] = useState(0);
  const adminHasActive = adminItems.some((sub) => isActive(sub.path));

  useEffect(() => {
    if (adminHasActive) setOpenAdmin(true);
  }, [adminHasActive]);

  useEffect(() => {
    if (openAdmin && adminRef.current) setAdminHeight(adminRef.current.scrollHeight);
    else setAdminHeight(0);
  }, [openAdmin]);

  return (
    <aside
      className={`fixed top-0 left-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen transition-all duration-300 ease-in-out z-50
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-6 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start px-4"
        }`}
      >
        <Link href="/" className="text-lg font-bold text-gray-900 dark:text-white">
          My Dashboard
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex flex-col gap-4 px-4">
        {/* === Dashboard === */}
        <button
          onClick={() => setOpenDashboard((p) => !p)}
          className={`menu-item group ${
            dashHasActive ? "menu-item-active" : "menu-item-inactive"
          }`}
        >
          <span
            className={`${
              dashHasActive ? "menu-item-icon-active" : "menu-item-icon-inactive"
            }`}
          >
            <Squares2X2Icon className="w-5 h-5" />
          </span>
          {(isExpanded || isHovered || isMobileOpen) && <span>Dashboard</span>}
          {(isExpanded || isHovered || isMobileOpen) && (
            <ChevronDownIcon
              className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                openDashboard ? "rotate-180 text-brand-500" : ""
              }`}
            />
          )}
        </button>

        {/* Subitems Dashboard */}
        <div
          ref={dashRef}
          className="overflow-hidden transition-all duration-300"
          style={{ height: `${dashHeight}px` }}
        >
          <ul className="mt-2 ml-8 space-y-2">
            {dashboardItems.map((sub) => (
              <li key={sub.name}>
                <Link
                  href={sub.path}
                  className={`menu-dropdown-item ${
                    isActive(sub.path)
                      ? "menu-dropdown-item-active"
                      : "menu-dropdown-item-inactive"
                  }`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* === Admin (solo si isAdmin) === */}
        {isAdmin && (
          <>
            <button
              onClick={() => setOpenAdmin((p) => !p)}
              className={`menu-item group ${
                adminHasActive ? "menu-item-active" : "menu-item-inactive"
              }`}
            >
              <span
                className={`${
                  adminHasActive ? "menu-item-icon-active" : "menu-item-icon-inactive"
                }`}
              >
                <UserGroupIcon className="w-5 h-5" />
              </span>
              {(isExpanded || isHovered || isMobileOpen) && <span>Admin</span>}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openAdmin ? "rotate-180 text-brand-500" : ""
                  }`}
                />
              )}
            </button>

            {/* Subitems Admin */}
            <div
              ref={adminRef}
              className="overflow-hidden transition-all duration-300"
              style={{ height: `${adminHeight}px` }}
            >
              <ul className="mt-2 ml-8 space-y-2">
                {adminItems.map((sub) => (
                  <li key={sub.name}>
                    <Link
                      href={sub.path}
                      className={`menu-dropdown-item ${
                        isActive(sub.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </nav>
    </aside>
  );
}


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
import { trpc } from "@/lib/trpc/client";

export default function AppSidebar() {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const pathname = usePathname();

  // 👇 usa el optional para evitar 401 cuando no hay sesión
  const { data: me } = trpc.user.meOptional.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 0,
    placeholderData: (prev) => prev,
  });

  const isAdmin = useMemo(
    () => me?.roles?.some((r) => r.role?.name?.toUpperCase() === "ADMIN") ?? false,
    [me]
  );

  const dashboardItems = useMemo(
    () => [
      { name: "Analytics", path: "/analytics" },
      { name: "Chatbot Insights", path: "/chatbot" },
    ],
    []
  );
  const adminItems = useMemo(() => [{ name: "Users", path: "/users" }], []);

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

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
        ${isExpanded || isMobileOpen ? "w-[210px]" : isHovered ? "w-[210px]" : "w-[90px]"}
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
        <Link href="/" className="text-lg font-bold text-gray-900 dark:text-white">
          My Dashboard
        </Link>
      </div>

      <nav className="flex flex-col gap-4 px-4">
        {/* Dashboard */}
        <button
          onClick={() => setOpenDashboard((p) => !p)}
          className={`menu-item group ${
            dashHasActive ? "menu-item-active" : "menu-item-inactive"
          }`}
        >
          <span className={`${dashHasActive ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
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
                    isActive(sub.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"
                  }`}
                  onClick={() => setIsMobileOpen(false)}
                >
                  {sub.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Admin (solo si ADMIN) */}
        {isAdmin && (
          <>
            <button
              onClick={() => setOpenAdmin((p) => !p)}
              className={`menu-item group ${
                adminHasActive ? "menu-item-active" : "menu-item-inactive"
              }`}
            >
              <span className={`${adminHasActive ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import { Squares2X2Icon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useState, useRef, useCallback } from "react";

export default function AppSidebar() {
  const { isExpanded, isHovered, isMobileOpen, setIsHovered, setIsMobileOpen } =
    useSidebar();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState(false);
  const subMenuRef = useRef<HTMLDivElement | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState(0);

  const subItems = [
    { name: "Ecommerce", path: "/ecommerce" },
    { name: "Analytics", path: "/analytics" },
  ];

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  // Detectar si hay subitem activo solo al inicio o cuando cambia la ruta
  useEffect(() => {
    if (subItems.some((sub) => sub.path === pathname)) {
      setOpenSubmenu(true);
    }
  }, [pathname]);

  // Calcular altura del submenu
  useEffect(() => {
    if (openSubmenu && subMenuRef.current) {
      setSubMenuHeight(subMenuRef.current.scrollHeight);
    } else {
      setSubMenuHeight(0);
    }
  }, [openSubmenu]);

  // Toggle manual
  const handleToggle = () => {
    setOpenSubmenu((prev) => !prev);
  };

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

      {/* Dashboard */}
      <nav className="flex flex-col gap-4 px-4">
        <button
          onClick={handleToggle}
          className={`menu-item group ${
            openSubmenu || subItems.some((sub) => isActive(sub.path))
              ? "menu-item-active"
              : "menu-item-inactive"
          }`}
        >
          <span
            className={`${
              openSubmenu || subItems.some((sub) => isActive(sub.path))
                ? "menu-item-icon-active"
                : "menu-item-icon-inactive"
            }`}
          >
            <Squares2X2Icon className="w-5 h-5" />
          </span>
          {(isExpanded || isHovered || isMobileOpen) && <span>Dashboard</span>}
          {(isExpanded || isHovered || isMobileOpen) && (
            <ChevronDownIcon
              className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                openSubmenu ? "rotate-180 text-brand-500" : ""
              }`}
            />
          )}
        </button>

        {/* Subitems */}
        <div
          ref={subMenuRef}
          className="overflow-hidden transition-all duration-300"
          style={{ height: `${subMenuHeight}px` }}
        >
          <ul className="mt-2 ml-8 space-y-2">
            {subItems.map((sub) => (
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
      </nav>
    </aside>
  );
}

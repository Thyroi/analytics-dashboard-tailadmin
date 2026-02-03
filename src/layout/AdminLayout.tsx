"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { usePathname } from "next/navigation";
import React from "react";
import SubHeader from "./SubHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();

  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Rutas válidas donde SÍ debe mostrarse el SubHeader
  const validRoutes = ["/", "/analytics", "/chatbot", "/users", "/test-tags"];

  // Si la ruta actual no coincide con ninguna válida => 404
  const is404 = !validRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route),
  );

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {!is404 && <SubHeader />}
          {children}
        </div>
      </div>
    </div>
  );
}

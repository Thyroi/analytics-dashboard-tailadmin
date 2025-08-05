"use client";

import { useSidebar } from "@/context/SidebarContext";

export default function Backdrop() {
  const { isMobileOpen, setIsMobileOpen } = useSidebar();

  return isMobileOpen ? (
    <div
      className="fixed inset-0 bg-black/50 z-40 lg:hidden"
      onClick={() => setIsMobileOpen(false)}
    ></div>
  ) : null;
}

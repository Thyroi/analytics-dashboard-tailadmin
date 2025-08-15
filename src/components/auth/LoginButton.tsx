"use client";

import type { ReactNode } from "react";

type Props = {
  className?: string;
  connection?: string;
  children?: ReactNode;
};

export default function LoginButton({
  className = "",
  children = "Iniciar sesión",
}: Props) {
  return (
    <a
      href={`/auth/login`}
      className={`inline-flex items-center gap-2 rounded-full px-3 h-9 text-sm bg-blue-600 text-white hover:bg-blue-700 ${className}`}
    >
      {children}
    </a>
  );
}

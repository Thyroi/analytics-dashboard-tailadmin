"use client";

import { useUser } from "@auth0/nextjs-auth0";
import LoginButton from "./LoginButton";
import UserDropdown, { type MinimalUser } from "./UserDropdown";

type Props = {
  className?: string;
  connection?: string;
};

export default function AuthUserMenu({
  className = "",
  connection = "google-workspace",
}: Props) {
  const { user, isLoading, error } = useUser();

  // Loader compacto para el header
  if (isLoading) {
    return (
      <div
        className={`h-9 w-28 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse ${className}`}
      />
    );
  }

  // Si hay error o no hay sesión → botón de login
  if (error || !user) {
    return <LoginButton className={className} connection={connection} />;
  }

  // Map a MinimalUser (sin any)
  const u = user;
  const mapped: MinimalUser = {
    name: u.name ?? null,
    email: u.email ?? null,
    picture: u.picture ?? null,
    nickname: (u as { nickname?: string }).nickname ?? null,
  };

  return <UserDropdown className={className} user={mapped} />;
}

"use client";

import { trpc } from "@/lib/trpc/client";
import { useMemo } from "react";
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
  const {
    data: me,
    isLoading,
    isFetching,
  } = trpc.user.meOptional.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 0,
    placeholderData: (prev) => prev,
  });

  const mapped = useMemo<MinimalUser | null>(() => {
    if (!me) return null;
    const name =
      me.profile?.firstName || me.profile?.lastName
        ? [me.profile?.firstName, me.profile?.lastName]
            .filter(Boolean)
            .join(" ")
        : null;

    return {
      name,
      email: me.email,
      picture: me.avatarUrl ?? null,
      nickname: (me.email.split("@")[0] ?? "").toString(),
    };
  }, [me]);

  if (isLoading || isFetching) {
    return (
      <div
        className={`h-9 w-28 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse ${className}`}
      />
    );
  }

  if (!mapped) {
    return <LoginButton className={className} connection={connection} />;
  }

  return <UserDropdown className={className} user={mapped} />;
}

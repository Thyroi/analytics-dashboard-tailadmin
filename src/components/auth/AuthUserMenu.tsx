"use client";

import { trpc } from "@/lib/trpc/client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
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
  const searchParams = useSearchParams();
  const {
    data: me,
    isLoading,
    isFetching,
    refetch,
  } = trpc.user.meOptional.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 0,
    placeholderData: (prev) => prev,
  });

  // Refetch cuando volvemos del callback de Auth0
  useEffect(() => {
    const fromCallback = searchParams.get("code") || searchParams.get("state");
    if (fromCallback) {
      refetch();
    }
  }, [searchParams, refetch]);

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

  if (!me && (isLoading || isFetching)) {
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

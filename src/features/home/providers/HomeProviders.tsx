"use client";

import React from "react";
import { HomeFiltersProvider } from "@/features/home/context/HomeFiltersContext";
import { Granularity } from "@/lib/types";

type Props = {
  children: React.ReactNode;
  initialGranularity?: Granularity;
  initialDateFrom?: string;
  initialDateTo?: string;
};

export default function HomeProviders({
  children,
  initialGranularity = "d",
  initialDateFrom,
  initialDateTo,
}: Props) {
  return (
    <HomeFiltersProvider
      initialGranularity={initialGranularity}
      initialDateFrom={initialDateFrom}
      initialDateTo={initialDateTo}
    >
      {children}
    </HomeFiltersProvider>
  );
}

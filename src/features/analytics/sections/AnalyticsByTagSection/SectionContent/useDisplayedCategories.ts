import { CATEGORY_ID_ORDER } from "@/lib/taxonomy/categories";
import { useMemo } from "react";
import { EXCLUDED_CATEGORY } from "./constants";

type QueryState = {
  status: "ready" | "loading" | "error";
  [key: string]: unknown;
};

export function useDisplayedCategories(
  state: QueryState,
  ids: readonly string[]
) {
  return useMemo<string[]>(
    () =>
      state.status === "ready"
        ? (ids as string[]).filter((id) => id !== EXCLUDED_CATEGORY)
        : CATEGORY_ID_ORDER.filter((id) => id !== EXCLUDED_CATEGORY),
    [state.status, ids]
  );
}

// src/features/chatbot/context/TopTagsCtx.tsx
"use client";
import * as React from "react";

type TopTagsCtxType = {
  activeTag: string | null;
  setActiveTag: (t: string | null) => void;
};

const TopTagsCtx = React.createContext<TopTagsCtxType | null>(null);

export function TopTagsProvider({ children }: { children: React.ReactNode }) {
  const [activeTag, setActiveTag] = React.useState<string | null>(null);
  const value = React.useMemo(() => ({ activeTag, setActiveTag }), [activeTag]);
  return <TopTagsCtx.Provider value={value}>{children}</TopTagsCtx.Provider>;
}

export function useTopTagsCtx(): TopTagsCtxType {
  const ctx = React.useContext(TopTagsCtx);
  if (!ctx) throw new Error("useTopTagsCtx must be used inside TopTagsProvider");
  return ctx;
}

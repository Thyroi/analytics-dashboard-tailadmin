"use client";

import * as React from "react";
import type { AuditTagsResponse, Granularity } from "@/features/chatbot/types/tags";
import { makeBody, postAuditTags, childrenPattern, searchTokenPattern } from "@/features/chatbot/services/mindsAic";

type QueryBase = {
  granularity: Granularity;
  startTime?: string;
  endTime?: string;
};

type UseAuditState = {
  data: AuditTagsResponse | null;
  error: unknown;
  loading: boolean;
};

function useAuditTags(pattern: string | null, opts: QueryBase) {
  const [state, setState] = React.useState<UseAuditState>({
    data: null,
    error: null,
    loading: false,
  });

  React.useEffect(() => {
    if (!pattern) return;

    const controller = new AbortController();

    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const body = makeBody(pattern, opts.granularity, opts.startTime, opts.endTime);
        const res = await postAuditTags(body, { signal: controller.signal });
        setState({ data: res, error: null, loading: false });
      } catch (e: unknown) {
        if ((e as { name?: string })?.name === "AbortError") return;
        setState({ data: null, error: e, loading: false });
      }
    })();

    return () => controller.abort();
  }, [pattern, opts.granularity, opts.startTime, opts.endTime]);

  return state;
}

export function useChildrenOf(prefix: string, opts: QueryBase) {
  const pattern = childrenPattern(prefix || "root");
  return useAuditTags(pattern, opts);
}

export function useSearchByToken(token: string | null, opts: QueryBase) {
  const pattern = token && token.trim().length ? searchTokenPattern(token.trim()) : null;
  return useAuditTags(pattern, opts);
}

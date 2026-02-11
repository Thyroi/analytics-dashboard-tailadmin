import { ChallengeError, safeJsonFetch } from "@/lib/fetch/safeFetch";

export type MindsaicTagPoint = { date: string; value: number };

export type MindsaicTagEntry = {
  id: string;
  label: string;
  total: number;
  delta?: number | null;
};

export type MindsaicPatternOutput = {
  region: string | null;
  topic: string | null;
  tags: MindsaicTagEntry[];
  data: Record<string, MindsaicTagPoint[]>;
  preData?: Record<string, MindsaicTagPoint[]>;
  previous?: Record<string, MindsaicTagPoint[]>;
  totalCurrent?: number;
  totalPrevious?: number;
  totalPrev?: number;
  totalDelta?: number;
};

export type MindsaicTagsResponse = {
  code: number;
  output: Record<string, MindsaicPatternOutput>;
};

export type FetchMindsaicTagsParams = {
  patterns: string[];
  startTime: string;
  endTime?: string;
  id?: string;
  signal?: AbortSignal;
};

const API_PATH = "/api/chatbot/audit/tags";

export async function fetchMindsaicTagsData({
  patterns,
  startTime,
  endTime,
  id = "huelva",
  signal,
}: FetchMindsaicTagsParams): Promise<MindsaicTagsResponse> {
  try {
    const response = (await safeJsonFetch(API_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        patterns,
        startTime,
        ...(endTime ? { endTime } : null),
      }),
      signal,
    })) as MindsaicTagsResponse;

    return response;
  } catch (err) {
    if (err instanceof ChallengeError) {
      return { code: 200, output: {} } as MindsaicTagsResponse;
    }
    throw err;
  }
}

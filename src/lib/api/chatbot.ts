export type ChatbotGranularity = "d" | "w" | "m" | "y";
export type ChatbotPoint = { time: string; value: number };

export type ChatbotRequest = {
  patterns: string[];
  startTime?: string;
  endTime?: string;
  id?: string;
};

export type ChatbotResponse = {
  code: number;
  output: Record<string, ChatbotPoint[]>;
};

import { ChallengeError, safeJsonFetch } from "@/lib/fetch/safeFetch";

export async function fetchChatbotTags(
  input: ChatbotRequest,
  init?: RequestInit,
): Promise<ChatbotResponse> {
  const requestBody = {
    id: input.id ?? "huelva",
    patterns: input.patterns,
    ...(input.startTime && { startTime: input.startTime }),
    ...(input.endTime && { endTime: input.endTime }),
  };

  try {
    const response = (await safeJsonFetch("/api/chatbot/audit/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      ...init,
    })) as ChatbotResponse;

    return response;
  } catch (err) {
    // If upstream returned a HTML challenge, degrade gracefully with empty output
    if (err instanceof ChallengeError) {
      return { code: 200, output: {} } as ChatbotResponse;
    }
    throw err;
  }
}

export type ChatbotGranularity = "d" | "w" | "m" | "y";
export type ChatbotPoint = { time: string; value: number };

export type ChatbotRequest = {
  pattern: string;
  granularity: ChatbotGranularity;
  startTime?: string;
  endTime?: string;
};

export type ChatbotResponse = {
  code: number;
  output: Record<string, ChatbotPoint[]>;
};

export async function fetchChatbotTags(
  input: ChatbotRequest,
  init?: RequestInit
): Promise<ChatbotResponse> {
  // ⚠️ endpoint correcto:
  const res = await fetch("/api/chatbot/audit/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ db: "project_huelva", ...input }),
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<ChatbotResponse>;
}

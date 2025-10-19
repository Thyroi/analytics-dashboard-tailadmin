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
  const requestBody = {
    db: "project_huelva",
    patterns: [input.pattern], // ✨ FIX: El endpoint POST espera 'patterns' (array), no 'pattern' (string)
    granularity: input.granularity,
    ...(input.startTime && { startTime: input.startTime }),
    ...(input.endTime && { endTime: input.endTime }),
  };
  

  
  const res = await fetch("/api/chatbot/audit/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("🤖 fetchChatbotTags ERROR:", {
      status: res.status,
      statusText: res.statusText,
      errorText: text,
      requestBody
    });
    throw new Error(`Chatbot API Error ${res.status}: ${text || res.statusText}`);
  }
  
  const response = await res.json() as ChatbotResponse;

  return response;
}

"use client";

import StickyHeaderSection from "@/components/common/StickyHeaderSection";
import { useTagTimeframe } from "@/features/analytics/context/TagTimeContext";
import { useCategoriesTotalsNew } from "@/features/analytics/hooks/categorias/useCategoriesTotals";
import { fetchChatbotTotals } from "@/lib/services/chatbot/totals";
import { CATEGORY_ID_ORDER } from "@/lib/taxonomy/categories";
import { computeDeltaArtifact } from "@/lib/utils/delta";
import { computeRangesForKPI } from "@/lib/utils/time/timeWindows";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export default function DebugCategoriesResumenSection() {
  // Usar el contexto TagTimeContext igual que AnalyticsByTagSection
  const {
    mode,
    granularity,
    setGranularity,
    startDate,
    endDate,
    setRange,
    clearRange,
  } = useTagTimeframe();

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  console.log("🔍 Debug Component - Params:", {
    granularity,
    startDate: startDateStr,
    endDate: endDateStr,
    mode,
  });

  const gaQuery = useCategoriesTotalsNew({
    granularity,
    startDate: startDateStr,
    endDate: endDateStr,
    enabled: Boolean(startDateStr && endDateStr),
  });

  const chatbotQuery = useQuery({
    queryKey: [
      "debug",
      "chatbot",
      "totals",
      granularity,
      startDateStr,
      endDateStr,
    ],
    queryFn: async () => {
      console.log("🔍 Fetching chatbot with:", {
        granularity,
        startDate: startDateStr,
        endDate: endDateStr,
      });

      // Calcular el payload que se enviará (replicando la lógica de fetchChatbotTotals)
      const { computeRangesForKPI } = await import(
        "@/lib/utils/time/timeWindows"
      );
      const ranges = computeRangesForKPI(granularity, startDateStr, endDateStr);

      const formatDateForChatbot = (dateISO: string) =>
        dateISO.replace(/-/g, "");

      const payload = {
        db: "project_huelva",
        patterns: "root.*.*.*",
        granularity: "d" as const,
        startTime: formatDateForChatbot(ranges.previous.start),
        endTime: formatDateForChatbot(ranges.current.end),
      };

      console.log("📤 Chatbot POST payload:", payload);
      console.log("📅 Ranges calculated:", ranges);

      return fetchChatbotTotals({
        granularity,
        startDate: startDateStr,
        endDate: endDateStr,
      });
    },
    enabled: Boolean(startDateStr && endDateStr),
  });

  const combined = useMemo(() => {
    interface CombinedItem {
      id: string;
      title: string;
      ga4Current: number;
      ga4Previous: number;
      chatbotCurrent: number;
      chatbotPrevious: number;
      totalCurrent: number;
      totalPrev: number;
      artifact: ReturnType<typeof computeDeltaArtifact>;
    }

    const items: CombinedItem[] = [];
    const gaItems = gaQuery.data?.data.items ?? [];

    // chatbot response might be in different shapes; normalize
    interface ChatbotCategory {
      id: string;
      currentTotal?: number;
      prevTotal?: number;
    }

    let chatbotCats: ChatbotCategory[] = [];
    if (chatbotQuery.data) {
      const raw = chatbotQuery.data as Record<string, unknown>;
      if (Array.isArray(raw.categories)) {
        chatbotCats = raw.categories as ChatbotCategory[];
      } else if (typeof raw.data === "object" && raw.data !== null) {
        const dataObj = raw.data as Record<string, unknown>;
        if (Array.isArray(dataObj.categories)) {
          chatbotCats = dataObj.categories as ChatbotCategory[];
        } else if (Array.isArray(dataObj.items)) {
          chatbotCats = dataObj.items as ChatbotCategory[];
        }
      }
    }

    const chatbotMap = new Map<string, ChatbotCategory>();
    chatbotCats.forEach((c) => chatbotMap.set(c.id, c));

    CATEGORY_ID_ORDER.forEach((catId) => {
      const gaItem = gaItems.find((g) => g.id === catId) || {
        id: catId,
        title: catId,
        total: 0,
        previousTotal: 0,
      };
      const chatbot = chatbotMap.get(catId) || {
        id: catId,
        currentTotal: 0,
        prevTotal: 0,
      };

      const totalCurrent = (gaItem.total || 0) + (chatbot.currentTotal || 0);
      const totalPrev = (gaItem.previousTotal || 0) + (chatbot.prevTotal || 0);
      const artifact = computeDeltaArtifact(totalCurrent, totalPrev);

      items.push({
        id: catId,
        title: gaItem.title || catId,
        ga4Current: gaItem.total ?? 0,
        ga4Previous: gaItem.previousTotal ?? 0,
        chatbotCurrent: chatbot.currentTotal ?? 0,
        chatbotPrevious: chatbot.prevTotal ?? 0,
        totalCurrent,
        totalPrev,
        artifact,
      });
    });

    return items;
  }, [gaQuery.data, chatbotQuery.data]);

  // Calcular payload para mostrar en UI
  const chatbotPayload = useMemo(() => {
    try {
      const ranges = computeRangesForKPI(granularity, startDateStr, endDateStr);
      const formatDateForChatbot = (dateISO: string) =>
        dateISO.replace(/-/g, "");

      return {
        db: "project_huelva",
        patterns: "root.*.*.*",
        granularity: "d" as const,
        startTime: formatDateForChatbot(ranges.previous.start),
        endTime: formatDateForChatbot(ranges.current.end),
        ranges, // Para mostrar también los rangos calculados
      };
    } catch {
      return null;
    }
  }, [granularity, startDateStr, endDateStr]);

  return (
    <div>
      <StickyHeaderSection
        title="🔍 Debug: Categorías Totales"
        subtitle="GA4 + Chatbot combinados"
        mode={mode}
        granularity={granularity}
        startDate={startDate}
        endDate={endDate}
        onGranularityChange={setGranularity}
        onRangeChange={setRange}
        onClearRange={clearRange}
      />

      <div className="mt-3 flex justify-end gap-3 items-center px-1">
        <button
          onClick={() => {
            gaQuery.refetch();
            chatbotQuery.refetch();
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Refresh
        </button>

        <div className="text-sm text-gray-500">
          GA4:{" "}
          {gaQuery.isLoading
            ? "loading"
            : gaQuery.isError
            ? "❌ error"
            : "✅ ok"}
          <br />
          Chatbot:{" "}
          {chatbotQuery.isLoading
            ? "loading"
            : chatbotQuery.isError
            ? "❌ error"
            : "✅ ok"}
        </div>
      </div>

      {/* Errores */}
      {gaQuery.isError && (
        <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded">
          <h4 className="font-semibold text-red-800">GA4 Error:</h4>
          <pre className="text-xs text-red-600 mt-2">
            {String(gaQuery.error)}
          </pre>
        </div>
      )}

      {chatbotQuery.isError && (
        <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded">
          <h4 className="font-semibold text-red-800">Chatbot Error:</h4>
          <pre className="text-xs text-red-600 mt-2">
            {String(chatbotQuery.error)}
          </pre>
        </div>
      )}

      {/* Request payload info */}
      {chatbotPayload && (
        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-semibold text-blue-800">
            📤 Chatbot POST Request Body:
          </h4>
          <div className="mt-2 grid grid-cols-2 gap-4">
            <div>
              <pre className="text-xs bg-white p-2 rounded border">
                {JSON.stringify(
                  {
                    db: chatbotPayload.db,
                    patterns: chatbotPayload.patterns,
                    granularity: chatbotPayload.granularity,
                    startTime: chatbotPayload.startTime,
                    endTime: chatbotPayload.endTime,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold mb-1">Rangos calculados:</p>
              <pre className="text-xs bg-white p-2 rounded border">
                {JSON.stringify(chatbotPayload.ranges, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {combined.map((c) => (
          <div key={c.id} className="p-4 border rounded bg-white shadow-sm">
            <h3 className="font-semibold">
              {c.title} <span className="text-xs text-gray-400">({c.id})</span>
            </h3>
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="text-xs text-gray-500">GA4 Current</div>
                <div className="font-mono">{c.ga4Current}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Chatbot Current</div>
                <div className="font-mono">{c.chatbotCurrent}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total Current</div>
                <div className="font-mono">{c.totalCurrent}</div>
              </div>

              <div>
                <div className="text-xs text-gray-500">GA4 Previous</div>
                <div className="font-mono">{c.ga4Previous}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Chatbot Previous</div>
                <div className="font-mono">{c.chatbotPrevious}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total Previous</div>
                <div className="font-mono">{c.totalPrev}</div>
              </div>
            </div>

            <div className="mt-3 text-sm">
              <div>
                Delta state:{" "}
                <span className="font-semibold">{c.artifact.state}</span>
              </div>
              <div>
                DeltaPct:{" "}
                <span className="font-mono">{String(c.artifact.deltaPct)}</span>
              </div>
              <div>
                DeltaAbs:{" "}
                <span className="font-mono">{String(c.artifact.deltaAbs)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded bg-white">
          <h4 className="font-semibold mb-2">GA4 raw response</h4>
          <pre className="text-xs overflow-auto max-h-96">
            {JSON.stringify(gaQuery.data, null, 2)}
          </pre>
        </div>

        <div className="p-4 border rounded bg-white">
          <h4 className="font-semibold mb-2">Chatbot raw response</h4>
          <pre className="text-xs overflow-auto max-h-96">
            {JSON.stringify(chatbotQuery.data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

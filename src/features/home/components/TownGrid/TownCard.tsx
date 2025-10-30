import type { TownCardProps } from "./types";

export function TownCard({ data, onClick }: TownCardProps) {
  const deltaColor =
    data.combinedDeltaPct === null
      ? "text-gray-500"
      : data.combinedDeltaPct > 0
      ? "text-green-600"
      : "text-red-600";

  const deltaText =
    data.combinedDeltaPct === null
      ? "Sin datos"
      : `${data.combinedDeltaPct > 0 ? "+" : ""}${data.combinedDeltaPct.toFixed(
          1
        )}%`;

  return (
    <div
      className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <h3 className="font-semibold mb-3 text-lg">{data.title}</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>GA4 Total:</span>
          <span className="font-mono">{data.ga4Total}</span>
        </div>

        <div className="flex justify-between">
          <span>GA4 Previous:</span>
          <span className="font-mono">{data.ga4Previous}</span>
        </div>

        <div className="flex justify-between">
          <span>Chatbot Total:</span>
          <span className="font-mono">{data.chatbotTotal}</span>
        </div>

        <div className="flex justify-between">
          <span>Chatbot Previous:</span>
          <span className="font-mono">{data.chatbotPrevious}</span>
        </div>

        <hr className="border-gray-200 dark:border-gray-600" />

        <div className="flex justify-between font-semibold">
          <span>Combined Total:</span>
          <span className="font-mono">{data.combinedTotal}</span>
        </div>

        <div className="flex justify-between">
          <span>Delta:</span>
          <span className={`font-mono ${deltaColor}`}>{deltaText}</span>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Click para ver drilldown →
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  categoryLabel: string;
  categoryId: string;
  granularity: string;
  ga4Total: number;
  chatbotTotal: number;
  combinedTotal: number;
  onClose: () => void;
}

export function ModalHeader({
  categoryLabel,
  categoryId,
  granularity,
  ga4Total,
  chatbotTotal,
  combinedTotal,
  onClose,
}: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Drilldown: {categoryLabel}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Categoría: {categoryId} | Granularidad: {granularity}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
          GA4: {ga4Total.toLocaleString()} • Chatbot:{" "}
          {chatbotTotal.toLocaleString()} • Total:{" "}
          {combinedTotal.toLocaleString()}
        </p>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

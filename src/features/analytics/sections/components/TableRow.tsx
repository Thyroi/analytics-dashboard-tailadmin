/**
 * Table row component for comparative pages
 */

import { formatNumber, formatPercent } from "@/lib/analytics/format";
import { DeltaBadge } from "./DeltaBadge";

interface TableRowProps {
  item: {
    path: string;
    label: string;
    visits: number;
    deltaPct: number | null;
  };
  isSelected: boolean;
  isDisabled: boolean;
  onToggle: (path: string) => void;
}

export function TableRow({
  item,
  isSelected,
  isDisabled,
  onToggle,
}: TableRowProps) {
  const deltaFormatted = formatPercent(item.deltaPct || 0);

  return (
    <tr
      onClick={() => !isDisabled && onToggle(item.path)}
      className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "bg-orange-50 dark:bg-orange-900/30 border-l-4 border-orange-500 shadow-sm"
          : ""
      } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
      title={
        isDisabled
          ? "Máximo 8 elementos"
          : "Click para seleccionar/deseleccionar"
      }
    >
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          disabled={isDisabled}
          onChange={() => onToggle(item.path)}
          className={`rounded border-gray-300 dark:border-gray-600 disabled:opacity-50 pointer-events-none transition-colors ${
            isSelected
              ? "text-orange-600 focus:ring-orange-500 bg-orange-50 border-orange-300"
              : "text-orange-600 focus:ring-orange-500"
          }`}
          title={isDisabled ? "Máximo 8 elementos" : undefined}
        />
      </td>
      <td className="px-6 py-4">
        <div>
          <div
            className={`font-medium transition-colors ${
              isSelected
                ? "text-orange-900 dark:text-orange-100"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {item.label}
          </div>
          <div
            className={`text-sm transition-colors ${
              isSelected
                ? "text-orange-700 dark:text-orange-300"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {item.path}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
        {formatNumber(item.visits)}
      </td>
      <td className="px-6 py-4">
        <DeltaBadge
          text={deltaFormatted.text}
          variant={deltaFormatted.variant}
        />
      </td>
    </tr>
  );
}

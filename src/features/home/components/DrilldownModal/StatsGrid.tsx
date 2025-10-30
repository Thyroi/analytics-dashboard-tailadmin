import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";

interface StatsGridProps {
  townId: TownId;
  granularity: Granularity;
}

export function StatsGrid({ townId, granularity }: StatsGridProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
      <h3 className="font-semibold mb-3">📊 Estadísticas del Pueblo</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Granularity:</span>
          <div className="font-mono">{granularity}</div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Town ID:</span>
          <div className="font-mono">{townId}</div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Pattern:</span>
          <div className="font-mono text-xs">root.{townId}.*</div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Status:</span>
          <div className="font-mono text-green-600">✅ Ready</div>
        </div>
      </div>
    </div>
  );
}

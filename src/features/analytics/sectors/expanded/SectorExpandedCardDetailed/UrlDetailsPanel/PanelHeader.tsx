import Header from "@/components/common/Header";
import { Activity } from "lucide-react";
import { useMemo } from "react";
import { deriveActivityFromPath } from "./formatters";

type PanelHeaderProps = {
  path: string;
  activityName?: string;
  contextName?: string;
  onClose?: () => void;
};

export function PanelHeader({
  path,
  activityName,
  contextName,
  onClose,
}: PanelHeaderProps) {
  const subtitleText = useMemo(() => {
    const activity = activityName ?? deriveActivityFromPath(path);
    if (activity && contextName) {
      return `Análisis específico de la actividad ${activity} de ${contextName}`;
    }
    if (activity) {
      return `Análisis específico de la actividad ${activity}`;
    }
    return "Análisis específico del ámbito";
  }, [activityName, contextName, path]);

  return (
    <div className="mb-4 flex items-start justify-between gap-3 pb-3 border-b border-red-200/60 dark:border-red-700/40">
      <Header
        title="Detalle de URL"
        titleSize="sm"
        Icon={Activity}
        subtitle={subtitleText}
        subtitleColor="text-red-600 dark:text-red-400"
      />
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white/80 dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          Cerrar
        </button>
      )}
    </div>
  );
}

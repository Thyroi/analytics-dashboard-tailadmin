import Header from "@/components/common/Header";
import { BarChart3 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="card bg-analytics-gradient flex">
      <div className="card-header">
        <Header
          className="flex items-center h-full"
          title="Top 5 páginas más visitadas"
          Icon={BarChart3}
          iconColor="text-huelva-primary"
          titleSize="xxs"
          titleClassName="font-bold"
        />
      </div>
      <div className="card-body flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 dark:text-gray-500">
          Cargando gráfico...
        </div>
      </div>
    </div>
  );
}

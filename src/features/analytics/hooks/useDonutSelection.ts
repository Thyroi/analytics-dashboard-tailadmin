import type { UrlSeries } from "@/features/analytics/services/drilldown";
import { pickPathForSubActivity } from "@/lib/utils/core/drilldown";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";

type SeriesByUrl = {
  name: string;
  data: number[];
  path: string;
}[];

export function useDonutSelection(seriesByUrl: SeriesByUrl) {
  const queryClient = useQueryClient();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  const handleDonutSliceClick = useCallback(
    (sub: string) => {
      // Adaptamos el formato para que funcione con pickPathForSubActivity
      const adaptedSeries = seriesByUrl.map((s) => ({
        name: s.name,
        path: s.path,
        data: s.data,
      }));

      const candidate = pickPathForSubActivity(
        sub,
        adaptedSeries as UrlSeries[]
      );

      if (candidate) {
        // Actualizar estado (incluso si es el mismo path)
        setSelectedPath(candidate);

        // Invalidar queries por prefijo para forzar refetch inmediato
        queryClient.invalidateQueries({
          queryKey: ["url-drilldown"],
        });

        // Hacer scroll al nivel 3 (siempre, para asegurar visibilidad)
        setTimeout(() => {
          detailsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 150);
      }
    },
    [queryClient, seriesByUrl]
  );

  return {
    selectedPath,
    detailsRef,
    handleDonutSliceClick,
  };
}

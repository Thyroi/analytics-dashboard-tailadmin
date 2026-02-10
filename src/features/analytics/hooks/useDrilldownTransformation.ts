import { formatUrlForDisplay } from "@/lib/utils/drilldown/url-formatting";
import { generateBrandGradient } from "@/lib/utils/formatting/colors";
import { useMemo } from "react";

type DrilldownItem = {
  label: string;
  value: number;
};

type DrilldownData =
  | { loading: true }
  | { loading: false; donut: DrilldownItem[]; deltaPct: number | null };

type UrlSeriesData =
  | { loading: true }
  | {
      loading: false;
      seriesByUrl: Array<{ name: string; data: number[]; path: string }>;
      xLabels: string[];
    };

export function useDrilldownTransformation(
  drilldown: DrilldownData,
  urlSeries: UrlSeriesData,
) {
  return useMemo(() => {
    if (drilldown.loading) {
      return {
        loading: true,
        xLabels: [],
        seriesByUrl: [],
        donut: [],
        deltaPct: 0,
        colorsByName: {},
      };
    }

    if (urlSeries.loading) {
      const sortedItems = [...drilldown.donut].sort(
        (a, b) => b.value - a.value,
      );
      const colors = generateBrandGradient(sortedItems.length, [
        "#902919",
        "#E55338",
        "#F5AA35",
      ]);
      const colorByUrl = new Map<string, string>();
      sortedItems.forEach((item, index) => {
        colorByUrl.set(item.label, colors[index]);
      });

      const formattedDonut = drilldown.donut.map((item) => ({
        id: item.label,
        label: formatUrlForDisplay(item.label),
        value: item.value,
        color: colorByUrl.get(item.label) || colors[0],
      }));

      return {
        loading: false,
        xLabels: [],
        seriesByUrl: [],
        donut: formattedDonut,
        deltaPct: drilldown.deltaPct ?? 0,
        colorsByName: {},
      };
    }

    // SOLO usar datos reales de la API, NO datos sintéticos
    if (urlSeries.seriesByUrl.length === 0) {
      return {
        loading: false,
        xLabels: [],
        seriesByUrl: [],
        donut: [],
        deltaPct: drilldown.deltaPct ?? 0,
        colorsByName: {},
      };
    }

    // Usar solo datos reales del endpoint URL
    const seriesByUrl = drilldown.donut
      .map((item) => {
        const realData = urlSeries.seriesByUrl.find(
          (series) => series.path === item.label || series.name === item.label,
        );

        if (!realData) {
          return null; // Si no hay datos reales, retornar null
        }

        return {
          name: formatUrlForDisplay(item.label), // Formatear el name con la función independiente
          data: realData.data,
          path: item.label,
        };
      })
      .filter(
        (item): item is { name: string; data: number[]; path: string } =>
          item !== null,
      );

    const xLabels = urlSeries.xLabels;

    // Ordenar items por valor para asignar colores (mayor valor = color más oscuro)
    const sortedItems = [...drilldown.donut].sort((a, b) => b.value - a.value);

    // Generar colores degradados: mayor valor → huelva-dark, menor valor → huelva-secondary
    const colors = generateBrandGradient(sortedItems.length, [
      "#902919",
      "#E55338",
      "#F5AA35",
    ]);

    // Crear mapa de colores basado en el ranking por valor
    const colorByUrl = new Map<string, string>();
    sortedItems.forEach((item, index) => {
      colorByUrl.set(item.label, colors[index]);
    });

    // Formatear donut con estructura {id, label, value, color}
    const formattedDonut = drilldown.donut.map((item) => ({
      id: item.label, // URL original como id
      label: formatUrlForDisplay(item.label), // URL formateada como label
      value: item.value, // valor numérico
      color: colorByUrl.get(item.label) || colors[0], // color asignado por valor
    }));

    // Crear mapa de colores por nombre para el gráfico de líneas (usando nombres formateados)
    const colorsByName = new Map<string, string>();
    seriesByUrl.forEach((series) => {
      const originalUrl = series.path;
      const color = colorByUrl.get(originalUrl);
      if (color) {
        colorsByName.set(series.name, color);
      }
    });

    return {
      loading: false,
      xLabels,
      seriesByUrl,
      donut: formattedDonut,
      deltaPct: drilldown.deltaPct ?? 0,
      colorsByName: Object.fromEntries(colorsByName), // Convertir Map a objeto para pasar como prop
    };
  }, [drilldown, urlSeries]);
}

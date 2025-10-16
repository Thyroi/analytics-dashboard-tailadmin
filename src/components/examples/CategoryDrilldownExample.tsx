/**
 * Ejemplo de uso de ChartPair con modo "grouped"
 * Para mostrar drilldown de categorías con GroupedBarChart + DonutChart
 */

"use client";

import type { GroupedBarSeries } from "@/components/charts/GroupedBarChart";
import ChartPair from "@/components/common/ChartPair";
import type { DonutDatum } from "@/lib/types";

export default function CategoryDrilldownExample() {
  // Datos de ejemplo para el drilldown de una categoría (ej: "Turismo")
  const groupedBarData: GroupedBarSeries[] = [
    {
      name: "Consultas",
      data: [45, 62, 38, 71, 55, 49], // Por subcategoría
      color: "#3B82F6", // Azul
    },
    {
      name: "Respuestas",
      data: [42, 58, 35, 68, 52, 46], // Por subcategoría
      color: "#10B981", // Verde
    },
    {
      name: "Satisfacción",
      data: [38, 55, 32, 65, 48, 43], // Por subcategoría
      color: "#F59E0B", // Amarillo
    },
  ];

  const subcategories = [
    "Playas",
    "Hoteles",
    "Restaurantes",
    "Monumentos",
    "Actividades",
    "Transporte",
  ];

  // Datos del donut (distribución por subcategoría)
  const donutData: DonutDatum[] = [
    { label: "Playas", value: 125, color: "#3B82F6" },
    { label: "Hoteles", value: 178, color: "#10B981" },
    { label: "Restaurantes", value: 105, color: "#F59E0B" },
    { label: "Monumentos", value: 204, color: "#EF4444" },
    { label: "Actividades", value: 155, color: "#8B5CF6" },
    { label: "Transporte", value: 138, color: "#EC4899" },
  ];

  const handleDonutSlice = (label: string) => {
    console.log("Donut slice clicked:", label);
    // Aquí podrías navegar a otro nivel de drilldown
  };

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Drilldown de Categoría: Turismo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Análisis detallado por subcategorías con comparativa de métricas
        </p>
      </div>

      {/* ChartPair con modo "grouped" */}
      <ChartPair
        mode="grouped"
        categories={subcategories}
        groupedSeries={groupedBarData}
        chartTitle="Métricas por Subcategoría"
        chartSubtitle="Comparativa de consultas, respuestas y satisfacción"
        chartHeight={400}
        tooltipFormatter={(val) => `${val} interacciones`}
        yAxisFormatter={(val) => `${val}`}
        donutData={donutData}
        deltaPct={null}
        onDonutSlice={handleDonutSlice}
        donutCenterLabel="Total"
        showActivityButton={true}
        actionButtonTarget="/chatbot/turismo"
        className="bg-white dark:bg-gray-900 rounded-lg shadow-sm"
      />

      {/* Ejemplo adicional con datos de pueblos */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Drilldown de Categoría: Cultura
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Distribución por pueblos
        </p>
      </div>

      <ChartPair
        mode="grouped"
        categories={["Huelva", "Moguer", "Palos", "Mazagón", "Punta Umbría"]}
        groupedSeries={[
          {
            name: "Museos",
            data: [25, 18, 12, 8, 15],
            color: "#8B5CF6",
          },
          {
            name: "Eventos",
            data: [32, 28, 15, 12, 22],
            color: "#EC4899",
          },
          {
            name: "Historia",
            data: [45, 35, 28, 18, 30],
            color: "#F59E0B",
          },
        ]}
        chartTitle="Cultura por Pueblo"
        chartSubtitle="Distribución de consultas culturales"
        chartHeight={350}
        tooltipFormatter={(val) => `${val} consultas`}
        donutData={[
          { label: "Museos", value: 78, color: "#8B5CF6" },
          { label: "Eventos", value: 109, color: "#EC4899" },
          { label: "Historia", value: 156, color: "#F59E0B" },
        ]}
        deltaPct={15.2}
        donutCenterLabel="Cultura"
        showActivityButton={false}
      />
    </div>
  );
}

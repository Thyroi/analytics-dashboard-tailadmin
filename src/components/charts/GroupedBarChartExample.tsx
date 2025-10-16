/**
 * Ejemplo de uso del GroupedBarChart
 * Muestra cómo usar el componente con datos de ejemplo
 */

"use client";

import GroupedBarChart from "@/components/charts/GroupedBarChart";

export default function GroupedBarChartExample() {
  // Datos de ejemplo similares a la imagen
  const deliveryData = {
    categories: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    series: [
      {
        name: "Shipment",
        data: [80, 60, 70, 40, 70, 45, 45, 55, 58, 50, 65, 75],
        color: "#A8C5DA", // Azul claro como en la imagen
      },
      {
        name: "Delivery",
        data: [87, 47, 65, 23, 75, 67, 73, 85, 25, 70, 85, 90],
        color: "#3B82F6", // Azul fuerte como en la imagen
      },
    ],
  };

  // Ejemplo con datos de categorías de chatbot
  const chatbotCategoriesData = {
    categories: [
      "Turismo",
      "Cultura",
      "Deportes",
      "Gastronomía",
      "Historia",
      "Eventos",
    ],
    series: [
      {
        name: "Mes Actual",
        data: [65, 45, 30, 80, 55, 70],
        color: "#10B981", // Verde
      },
      {
        name: "Mes Anterior",
        data: [50, 60, 25, 70, 40, 65],
        color: "#6B7280", // Gris
      },
    ],
  };

  // Ejemplo con datos de pueblos
  const pueblosData = {
    categories: [
      "Huelva",
      "Moguer",
      "Palos",
      "Mazagón",
      "Punta Umbría",
      "Isla Cristina",
    ],
    series: [
      {
        name: "Consultas",
        data: [120, 85, 65, 90, 110, 75],
        color: "#8B5CF6", // Púrpura
      },
      {
        name: "Respuestas",
        data: [115, 80, 60, 85, 105, 70],
        color: "#EC4899", // Rosa
      },
    ],
  };

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Ejemplos de Grouped Bar Chart
      </h1>

      {/* Ejemplo 1: Delivery Statistics (igual a la imagen) */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          1. Delivery Statistics (Replica de la imagen)
        </h2>
        <GroupedBarChart
          title="Delivery Statistics"
          subtitle="Total number of deliveries 70.5K"
          categories={deliveryData.categories}
          series={deliveryData.series}
          height={350}
          showLegend={true}
          tooltipFormatter={(val) => `${val}%`}
          yAxisFormatter={(val) => `${val}%`}
        />
      </div>

      {/* Ejemplo 2: Chatbot Categories */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          2. Comparación de Categorías de Chatbot
        </h2>
        <GroupedBarChart
          title="Categorías más consultadas"
          subtitle="Comparación mensual de consultas por categoría"
          categories={chatbotCategoriesData.categories}
          series={chatbotCategoriesData.series}
          height={300}
          showLegend={true}
          tooltipFormatter={(val) => `${val} consultas`}
          yAxisFormatter={(val) => `${val}`}
        />
      </div>

      {/* Ejemplo 3: Pueblos Data */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          3. Estadísticas por Pueblos
        </h2>
        <GroupedBarChart
          title="Interacciones por Pueblo"
          subtitle="Consultas vs Respuestas efectivas"
          categories={pueblosData.categories}
          series={pueblosData.series}
          height={300}
          showLegend={true}
          tooltipFormatter={(val) => `${val} interacciones`}
          yAxisFormatter={(val) => `${val}`}
        />
      </div>

      {/* Ejemplo 4: Sin título, colores personalizados */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          4. Versión Minimalista
        </h2>
        <GroupedBarChart
          categories={["Q1", "Q2", "Q3", "Q4"]}
          series={[
            {
              name: "2023",
              data: [45, 67, 78, 89],
              color: "#F59E0B", // Amarillo
            },
            {
              name: "2024",
              data: [52, 73, 85, 95],
              color: "#EF4444", // Rojo
            },
          ]}
          height={250}
          showLegend={false}
          tooltipFormatter={(val) => `${val}K`}
          className="border border-gray-200 dark:border-gray-700"
        />
      </div>
    </div>
  );
}

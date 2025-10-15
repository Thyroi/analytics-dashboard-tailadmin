/**
 * Ejemplo de uso del sistema de chatbot con drill-down completo
 * Según especificaciones del prompt maestro
 */

"use client";

import type { ComparisonMode, Granularity, ViewMode } from "@/features/chatbot";
import { ChatbotByTagView } from "@/features/chatbot";
import { useState } from "react";

// Configuraciones predefinidas
const CATEGORIES = [
  "turismo",
  "cultura",
  "naturaleza",
  "gastronomia",
  "eventos",
  "patrimonio",
  "playas",
  "senderismo",
];

const TOWNS = [
  "almonte",
  "bollullos",
  "bonares",
  "chucena",
  "escacena",
  "hinojos",
  "lucena",
  "manzanilla",
  "niebla",
  "palma",
  "palos",
  "paterna",
  "rociana",
  "san_juan",
  "trigueros",
  "villalba",
  "villarasa",
];

export default function ChatbotExample() {
  const [config, setConfig] = useState({
    mode: "byCategory" as ViewMode,
    granularity: "d" as Granularity,
    comparisonMode: "toDate" as ComparisonMode,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b0f14] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Título principal */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Sistema de Análisis Chatbot
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Drill-down completo con visualizaciones interactivas
          </p>
        </div>

        {/* Controles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configuración
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Modo de vista */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Modo de Vista
              </label>
              <select
                value={config.mode}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    mode: e.target.value as ViewMode,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="byCategory">Por Categoría</option>
                <option value="byTown">Por Pueblo</option>
              </select>
            </div>

            {/* Granularidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Granularidad
              </label>
              <select
                value={config.granularity}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    granularity: e.target.value as Granularity,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="d">Diario</option>
                <option value="w">Semanal</option>
                <option value="m">Mensual</option>
                <option value="y">Anual</option>
              </select>
            </div>

            {/* Modo de comparación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comparación
              </label>
              <select
                value={config.comparisonMode}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    comparisonMode: e.target.value as ComparisonMode,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="toDate">Hasta la fecha</option>
                <option value="period">Período completo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vista principal con drill-down */}
        <ChatbotByTagView
          mode={config.mode}
          granularity={config.granularity}
          categories={config.mode === "byCategory" ? CATEGORIES : []}
          towns={config.mode === "byTown" ? TOWNS : []}
          // comparisonMode={config.comparisonMode} // TEMPORALMENTE NO USADO
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm"
        />

        {/* Información de características */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">
            Características del Sistema
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-300">
            <li>
              • <strong>Drill-down interactivo:</strong> Haz clic en cualquier
              tarjeta para ver análisis detallado
            </li>
            <li>
              • <strong>Visualizaciones dinámicas:</strong> Gráficos de líneas y
              donut con datos en tiempo real
            </li>
            <li>
              • <strong>Estados de carga:</strong> Skeletons animados durante la
              carga de datos
            </li>
            <li>
              • <strong>Manejo de errores:</strong> Recuperación automática y
              reintentos
            </li>
            <li>
              • <strong>Responsive design:</strong> Optimizado para todos los
              dispositivos
            </li>
            <li>
              • <strong>Modo oscuro:</strong> Soporte completo para tema oscuro
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

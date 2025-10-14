"use client";

import type { Granularity } from "@/features/chatbot";
import { fetchTagAudit, PATTERNS } from "@/features/chatbot";
import {
  aggregateCategoriesForUIWithDebug,
  debugTokenMap,
  fetchDrilldownData,
  toTokens,
  type CategoryAggUI,
} from "@/features/chatbot/utils/aggregation";
import type { CategoryId } from "@/lib/taxonomy/categories";
import { useState } from "react";

// Importar la función de formateo de fechas
function formatDateForAPI(date: Date, granularity: Granularity): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  switch (granularity) {
    case "d":
      return `${year}${month.toString().padStart(2, "0")}${day
        .toString()
        .padStart(2, "0")}`;
    case "w": {
      // Cálculo simplificado de semana ISO
      const startOfYear = new Date(year, 0, 1);
      const dayOfYear =
        Math.floor(
          (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
        ) + 1;
      const week = Math.ceil(dayOfYear / 7);
      return `${year}/${week.toString().padStart(2, "0")}`;
    }
    case "m":
      return `${year}/${month.toString().padStart(2, "0")}`;
    case "y":
      return year.toString(); // Formato simple como en el ejemplo funcional
    default:
      throw new Error(`Granularidad no soportada: ${granularity}`);
  }
}

export default function TestQuery() {
  const [granularity, setGranularity] = useState<Granularity>("d");
  const [isLoading, setIsLoading] = useState(false);
  const [processedCategories, setProcessedCategories] = useState<
    CategoryAggUI[]
  >([]);
  const [debugInfo, setDebugInfo] = useState<{
    rawKeys: string[];
    tokenMapSize: number;
    matchedKeys: string[];
    unmatchedKeys: string[];
    tokenMatches: Array<{
      key: string;
      tokens: string[];
      matched: CategoryId | null;
    }>;
  } | null>(null);
  const [rawApiResponse, setRawApiResponse] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [drilldownData, setDrilldownData] = useState<{
    category: CategoryId;
    pattern: string;
    rawData: Record<string, unknown>;
    processedData: Array<{ key: string; time: string; value: number }>;
    totalValue: number;
    dataPointsCount: number;
  } | null>(null);
  const [isDrilldownLoading, setIsDrilldownLoading] = useState(false);
  const [tokenMapDebug, setTokenMapDebug] = useState<{
    tokensByCategory: Record<string, string[]>;
    totalTokens: number;
  } | null>(null);

  // Función para debug del tokenMap
  const showTokenMapDebug = () => {
    const debug = debugTokenMap();
    setTokenMapDebug({
      tokensByCategory: debug.tokensByCategory,
      totalTokens: debug.totalTokens,
    });
    console.log("🔍 TOKEN MAP DEBUG:", debug);
  };

  // Función para testear claves específicas problemáticas
  const testProblematicKeys = () => {
    const debug = debugTokenMap();
    const problematicKeys = [
      "root.doñana.almonte",
      "root.espacios_museisticos.muelle_de_las_carabelas",
      "root.espacios_museisticos.niebla",
      "root.espacios_museiticos.muelle_de_las_carabelas",
      "root.historia.lugares_colombinos",
      "root.historia",
      "root.la_rabida.muelle_de_la_reina",
      "root.la_rabida.muelle_de_las_carabelas",
      "root.lugares_colombinos.muelle_de_las_carabelas",
      "root.naturaleza.parques",
      "root.otros",
      "root.palos.muelle_de_las_carabelas",
      "root.palos",
      "root.patrimonio.muelle_de_las_carabelas",
      "root.patrimonio.palos",
      "root.rutas_culturales.palos",
    ];

    console.log("🧪 TESTING PROBLEMATIC KEYS:");

    const results = problematicKeys.map((key) => {
      const keyPath = key.startsWith("root.") ? key.slice(5) : key;
      const firstSegment = keyPath.split(".")[0];
      const tokens = toTokens(firstSegment);

      let matched: CategoryId | null = null;
      for (const token of tokens) {
        const categoryId = debug.tokenMap.get(token);
        if (categoryId) {
          matched = categoryId;
          break;
        }
      }

      return {
        key,
        firstSegment,
        tokens,
        matched,
        reason: !matched
          ? debug.tokenMap.has(firstSegment)
            ? "Token exacto no encontrado"
            : "Primer segmento no mapeado"
          : "✅ Match encontrado",
      };
    });

    console.table(results);

    // Mostrar también tokens disponibles para comparar
    console.log("📋 Tokens disponibles por categoría:", debug.tokensByCategory);

    return results;
  };

  // Función de test simple
  const testQuery = async () => {
    setIsLoading(true);

    try {
      // Generar fechas según granularidad actual
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const startTime = formatDateForAPI(yesterday, granularity);
      const endTime = formatDateForAPI(now, granularity);

      // Parámetros de prueba con granularidad seleccionada
      const testParams = {
        patterns: PATTERNS.allCategories(),
        granularity: granularity,
        startTime: startTime,
        endTime: endTime,
      };

      console.log(
        "🧪 PARÁMETROS DE PRUEBA:",
        JSON.stringify(testParams, null, 2)
      );

      // Simular el body que se enviará a la API
      const apiBody = {
        db: "project_huelva",
        patterns: testParams.patterns, // Corregido: patterns como string (no array)
        granularity: testParams.granularity,
        startTime: testParams.startTime,
        endTime: testParams.endTime,
      };

      console.log(
        "📡 BODY QUE SE ENVIARÁ A LA API:",
        JSON.stringify(apiBody, null, 2)
      );

      // Hacer la llamada real
      const response = await fetchTagAudit(testParams);

      console.log("✅ RESPUESTA DE LA API:", JSON.stringify(response, null, 2));

      // Guardar respuesta sin procesar
      setRawApiResponse(response);

      // Procesar las categorías usando la función de agregación con debug
      if (response && response.output) {
        const { result: aggregatedData, debug } =
          aggregateCategoriesForUIWithDebug(response.output);
        setProcessedCategories(aggregatedData);
        setDebugInfo(debug);

        console.log(
          "🔄 CATEGORÍAS PROCESADAS:",
          JSON.stringify(aggregatedData, null, 2)
        );

        console.log("🐛 INFORMACIÓN DE DEBUG:", JSON.stringify(debug, null, 2));
      }
    } catch (error) {
      console.error("❌ ERROR EN LA QUERY:", error);

      if (error instanceof Error) {
        console.error("❌ ERROR MESSAGE:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Función para hacer drilldown de una categoría específica
  const handleDrilldown = async (categoryId: CategoryId) => {
    setIsDrilldownLoading(true);
    setDrilldownData(null);

    try {
      // Generar fechas según granularidad actual (mismo período que la query principal)
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const startTime = formatDateForAPI(yesterday, granularity);
      const endTime = formatDateForAPI(now, granularity);

      console.log(`🎯 Iniciando drilldown para categoría: ${categoryId}`);

      // Hacer la query específica para esta categoría
      const drilldownResult = await fetchDrilldownData(
        categoryId,
        granularity,
        startTime,
        endTime
      );

      setDrilldownData(drilldownResult);
    } catch (error) {
      console.error("❌ ERROR EN DRILLDOWN:", error);
    } finally {
      setIsDrilldownLoading(false);
    }
  };

  return (
    <main className="py-8 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Test de Query Chatbot</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Granularidad de prueba:
            </label>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as Granularity)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="d">Diario</option>
              <option value="w">Semanal</option>
              <option value="m">Mensual</option>
              <option value="y">Anual</option>
            </select>
          </div>

          <button
            onClick={testQuery}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Probando..." : "Probar Query"}
          </button>

          <button
            onClick={showTokenMapDebug}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Ver TokenMap Debug
          </button>

          <button
            onClick={testProblematicKeys}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Test Claves Problemáticas
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium mb-2">Información de Debug:</h3>
          <ul className="text-sm space-y-1">
            <li>
              • Pattern a usar: <code>{PATTERNS.allCategories()}</code>
            </li>
            <li>
              • Granularidad seleccionada: <code>{granularity}</code>
            </li>
            <li>
              • Formato de fechas para <code>{granularity}</code>:
            </li>
            <ul className="ml-4 mt-1 space-y-1">
              {granularity === "d" && (
                <li>
                  - Diario: <code>yyyymmdd</code> (ej: 20241009)
                </li>
              )}
              {granularity === "w" && (
                <li>
                  - Semanal: <code>yyyy/ww</code> (ej: 2024/41)
                </li>
              )}
              {granularity === "m" && (
                <li>
                  - Mensual: <code>yyyy/mm</code> (ej: 2024/10)
                </li>
              )}
              {granularity === "y" && (
                <li>
                  - Anual: <code>yyyy</code> (ej: 2025)
                </li>
              )}
            </ul>
            <li>• Se usarán fechas actuales (ayer y hoy)</li>
            <li>
              • Formato API: <code>patterns</code> como string, no como array
            </li>
            <li>
              • Revisar la consola del navegador para ver los logs detallados
            </li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            Pasos para debuggear:
          </h4>
          <ol className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-decimal list-inside">
            <li>Haz clic en &quot;Probar Query&quot;</li>
            <li>Abre las DevTools del navegador (F12)</li>
            <li>Ve a la pestaña Console</li>
            <li>Revisa los logs que aparecen con los emojis 🧪 📡 ✅ ❌</li>
            <li>Copia el JSON del error si aparece</li>
          </ol>
        </div>

        {/* Sección de Categorías Procesadas */}
        {processedCategories.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-4">
              🎯 Categorías Procesadas ({processedCategories.length}{" "}
              encontradas)
            </h3>

            {/* Información sin procesar del API */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                � Datos sin procesar del API:
              </h4>
              <pre className="bg-gray-900 rounded-lg p-4 text-cyan-400 text-xs font-mono overflow-auto max-h-80 whitespace-pre-wrap">
                {JSON.stringify(rawApiResponse, null, 2)}
              </pre>
            </div>

            {/* Cards Visuales */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {processedCategories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-700 shadow-sm"
                >
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {category.label}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        ID:
                      </span>
                      <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
                        {category.id}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Value:
                      </span>
                      <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                        {category.value.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Delta:
                      </span>
                      <span
                        className={`font-medium ${
                          category.delta > 0
                            ? "text-green-600 dark:text-green-400"
                            : category.delta < 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {category.delta > 0 ? "+" : ""}
                        {category.delta.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Botón de Drilldown */}
                  <button
                    onClick={() => handleDrilldown(category.id)}
                    disabled={isDrilldownLoading}
                    className="w-full mt-3 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white text-sm font-medium rounded transition-colors"
                  >
                    {isDrilldownLoading ? "⏳ Cargando..." : "🎯 Ver Drilldown"}
                  </button>
                </div>
              ))}
            </div>

            {/* Información procesada por aggregation */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                🔄 Datos procesados por aggregateCategoriesForUI():
              </h4>
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
                <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                  {JSON.stringify(processedCategories, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Sección de JSON Procesado por Aggregation */}
        {processedCategories.length > 0 && (
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h3 className="font-medium text-purple-800 dark:text-purple-200 mb-4">
              � JSON Procesado por aggregateCategoriesForUI()
            </h3>

            <div className="bg-gray-900 rounded-lg p-4 overflow-auto">
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
                {JSON.stringify(processedCategories, null, 2)}
              </pre>
            </div>

            <div className="mt-3 text-sm text-purple-700 dark:text-purple-300">
              <strong>Total de categorías procesadas:</strong>{" "}
              {processedCategories.length}
            </div>
          </div>
        )}

        {/* Sección de Drilldown */}
        {drilldownData && (
          <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <h3 className="font-medium text-orange-800 dark:text-orange-200 mb-4">
              🎯 Drilldown de Categoría: {drilldownData.category}
            </h3>

            <div className="space-y-4">
              {/* Info del Pattern */}
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Pattern utilizado:
                </div>
                <div className="font-mono text-lg text-orange-600 dark:text-orange-400">
                  {drilldownData.pattern}
                </div>
              </div>

              {/* Stats rápidas */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Keys Encontradas
                  </div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {Object.keys(drilldownData.rawData.output || {}).length}
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Data Points
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {drilldownData.dataPointsCount}
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Value
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {drilldownData.totalValue.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Lista de Keys encontradas */}
              <div>
                <h4 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                  🔍 Keys encontradas para {drilldownData.pattern}:
                </h4>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded max-h-32 overflow-auto">
                  {Object.keys(drilldownData.rawData.output || {}).map(
                    (key, i) => (
                      <div
                        key={i}
                        className="font-mono text-sm text-purple-700 dark:text-purple-300 mb-1"
                      >
                        {key}
                        <span className="text-xs text-gray-500 ml-2">
                          (
                          {(
                            drilldownData.rawData.output as Record<
                              string,
                              Array<{ time: string; value: number }>
                            >
                          )[key]?.length || 0}{" "}
                          points)
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* JSON del Drilldown */}
              <div>
                <h4 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                  📋 Datos Procesados del Drilldown:
                </h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-60">
                  <pre className="text-yellow-400 text-sm font-mono whitespace-pre-wrap">
                    {JSON.stringify(drilldownData.processedData, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Raw API Response */}
              <div>
                <h4 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                  🔧 Respuesta Raw del API:
                </h4>
                <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-40">
                  <pre className="text-cyan-400 text-xs font-mono whitespace-pre-wrap">
                    {JSON.stringify(drilldownData.rawData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de Debug de Taxonomía */}
        {debugInfo && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-4">
              🐛 Debug de Mapeo de Taxonomía
            </h3>

            {/* Resumen de matching */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Keys Totales
                </div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {debugInfo.rawKeys.length}
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Tokens Mapa
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {debugInfo.tokenMapSize}
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Keys Matcheadas
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {debugInfo.matchedKeys.length}
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Keys No Matcheadas
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {debugInfo.unmatchedKeys.length}
                </div>
              </div>
            </div>

            {/* Keys no matcheadas */}
            {debugInfo.unmatchedKeys.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                  ❌ Keys no matcheadas ({debugInfo.unmatchedKeys.length}):
                </h4>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded max-h-32 overflow-auto">
                  {debugInfo.unmatchedKeys.map((key, i) => (
                    <div
                      key={i}
                      className="font-mono text-sm text-red-700 dark:text-red-300 mb-1"
                    >
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keys matcheadas */}
            {debugInfo.matchedKeys.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                  ✅ Keys matcheadas ({debugInfo.matchedKeys.length}):
                </h4>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded max-h-32 overflow-auto">
                  {debugInfo.matchedKeys.map((key, i) => (
                    <div
                      key={i}
                      className="font-mono text-sm text-green-700 dark:text-green-300 mb-1"
                    >
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detalle de matching de tokens */}
            <div>
              <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                🔍 Detalle de Token Matching:
              </h4>
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-60">
                <pre className="text-blue-400 text-xs font-mono whitespace-pre-wrap">
                  {JSON.stringify(debugInfo.tokenMatches, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Sección de debug del TokenMap */}
        {tokenMapDebug && (
          <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-4">
              🔍 Debug TokenMap ({tokenMapDebug.totalTokens} tokens)
            </h3>
            <div className="space-y-4">
              {Object.entries(tokenMapDebug.tokensByCategory).map(
                ([categoryId, tokens]) => (
                  <div
                    key={categoryId}
                    className="border border-purple-200 dark:border-purple-700 rounded-lg p-3"
                  >
                    <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                      📂 {categoryId} ({tokens.length} tokens):
                    </h4>
                    <div className="bg-gray-900 rounded-lg p-3 overflow-auto max-h-32">
                      <div className="text-green-400 text-xs font-mono flex flex-wrap gap-1">
                        {tokens.map((token, i) => (
                          <span
                            key={i}
                            className="bg-gray-800 px-2 py-1 rounded"
                          >
                            {token}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

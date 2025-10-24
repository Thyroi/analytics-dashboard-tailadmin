/**
 * Componente para debug de discrepancias entre donut y series
 */

"use client";

import type { CategoryId } from "@/lib/taxonomy/categories";
import type { TownId } from "@/lib/taxonomy/towns";
import type { Granularity } from "@/lib/types";
import { useState } from "react";
import { useDebugDetails } from "../hooks/useDebugDetails";

export default function DebugDetailsSection() {
  const [startDate, setStartDate] = useState("2025-10-22");
  const [endDate, setEndDate] = useState("2025-10-22");
  const [categoryId, setCategoryId] = useState<CategoryId>("naturaleza");
  const [townId, setTownId] = useState<TownId>("almonte");
  const [granularity, setGranularity] = useState<Granularity>("d");

  const { data, isLoading, error } = useDebugDetails({
    startDate,
    endDate,
    categoryId,
    townId,
    granularity,
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          🔍 Debug Details - Donut vs Series
        </h2>

        {/* Controls */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value as CategoryId)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="naturaleza">Naturaleza</option>
              <option value="playas">Playas</option>
              <option value="patrimonio">Patrimonio</option>
              <option value="sabor">Sabor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Town</label>
            <select
              value={townId}
              onChange={(e) => setTownId(e.target.value as TownId)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="almonte">Almonte</option>
              <option value="huelva">Huelva</option>
              <option value="ayamonte">Ayamonte</option>
              <option value="palos">Palos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Granularity
            </label>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as Granularity)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="d">Day</option>
              <option value="w">Week</option>
              <option value="m">Month</option>
              <option value="y">Year</option>
            </select>
          </div>
        </div>

        {/* Loading/Error States */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Analyzing details...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600 text-sm mt-1">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </div>
        )}

        {/* Results */}
        {data && (
          <div className="space-y-6">
            {/* Input Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="font-medium text-blue-900 mb-3">
                📋 Input Parameters
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Date Range:</span>
                  <br />
                  <span className="text-blue-700">
                    {data.input.startDate} → {data.input.endDate}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Category:</span>
                  <br />
                  <span className="text-blue-700">
                    {data.input.categoryLabel}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Town:</span>
                  <br />
                  <span className="text-blue-700">{data.input.townLabel}</span>
                </div>
                <div>
                  <span className="font-medium">Granularity:</span>
                  <br />
                  <span className="text-blue-700">
                    {data.input.requestedGranularity} →{" "}
                    {data.calculation.finalGranularity}
                  </span>
                </div>
              </div>
            </div>

            {/* Calculation Details */}
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h3 className="font-medium text-green-900 mb-3">
                ⚡ Range Calculation
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Duration:</span>{" "}
                  {data.calculation.durationDays} days
                </p>
                <p>
                  <span className="font-medium">Granularity:</span>{" "}
                  {data.calculation.granularityReason}
                </p>
                <p>
                  <span className="font-medium">Current Period:</span>{" "}
                  {data.calculation.currentRange.start} →{" "}
                  {data.calculation.currentRange.end}
                </p>
                <p>
                  <span className="font-medium">Previous Period:</span>{" "}
                  {data.calculation.previousRange.start} →{" "}
                  {data.calculation.previousRange.end}
                </p>
              </div>
            </div>

            {/* API URLs */}
            <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
              <h3 className="font-medium text-purple-900 mb-3">
                🔗 API Endpoints
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Category Details:</span>
                  <br />
                  <code className="text-purple-700 bg-purple-100 px-2 py-1 rounded text-xs">
                    {data.apis.categoryDetails.url}
                  </code>
                  <p className="text-purple-600 text-xs mt-1">
                    {data.apis.categoryDetails.note}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Town Details:</span>
                  <br />
                  <code className="text-purple-700 bg-purple-100 px-2 py-1 rounded text-xs">
                    {data.apis.townDetails.url}
                  </code>
                  <p className="text-purple-600 text-xs mt-1">
                    {data.apis.townDetails.note}
                  </p>
                </div>
              </div>
            </div>

            {/* Potential Issues */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="font-medium text-yellow-900 mb-3">
                ⚠️ Potential Issues
              </h3>
              <div className="space-y-3">
                {data.potentialIssues.map((issue, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-yellow-400 pl-4"
                  >
                    <h4 className="font-medium text-yellow-800">
                      {issue.issue}
                    </h4>
                    <p className="text-yellow-700 text-sm">
                      {issue.description}
                    </p>
                    <p className="text-yellow-600 text-xs mt-1">
                      <span className="font-medium">Investigation:</span>{" "}
                      {issue.investigation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* API Analysis */}
            {data.analysis && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="font-medium text-red-900 mb-3">
                  🔍 Analysis Results
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white rounded p-3">
                    <span className="font-medium">Series Total:</span>
                    <br />
                    <span className="text-2xl font-bold text-blue-600">
                      {data.analysis.seriesTotal}
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      ({data.analysis.seriesPoints} points)
                    </span>
                  </div>
                  <div className="bg-white rounded p-3">
                    <span className="font-medium">Donut Total:</span>
                    <br />
                    <span className="text-2xl font-bold text-green-600">
                      {data.analysis.donutTotal}
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      ({data.analysis.donutItems} items)
                    </span>
                  </div>
                  <div className="bg-white rounded p-3">
                    <span className="font-medium">Last Series Point:</span>
                    <br />
                    <span className="text-2xl font-bold text-orange-600">
                      {data.analysis.lastSeriesPoint}
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">(current day)</span>
                  </div>
                  <div className="bg-white rounded p-3">
                    <span className="font-medium">Delta %:</span>
                    <br />
                    <span
                      className={`text-2xl font-bold ${
                        data.analysis.deltaPct !== null &&
                        data.analysis.deltaPct >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {data.analysis.deltaPct !== null
                        ? `${data.analysis.deltaPct}%`
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Discrepancy Alert */}
                {data.analysis.seriesTotal !== data.analysis.donutTotal && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
                    <h4 className="font-bold text-red-800">
                      🚨 DISCREPANCY DETECTED!
                    </h4>
                    <p className="text-red-700 text-sm">
                      Series total ({data.analysis.seriesTotal}) ≠ Donut total (
                      {data.analysis.donutTotal})
                    </p>
                    <p className="text-red-600 text-xs mt-1">
                      Difference:{" "}
                      {Math.abs(
                        data.analysis.seriesTotal - data.analysis.donutTotal
                      )}{" "}
                      units
                    </p>
                  </div>
                )}

                {/* Point vs Total Alert */}
                {data.analysis.lastSeriesPoint !== data.analysis.donutTotal && (
                  <div className="mt-2 p-3 bg-orange-100 border border-orange-300 rounded">
                    <h4 className="font-bold text-orange-800">
                      ⚠️ POINT vs DONUT MISMATCH!
                    </h4>
                    <p className="text-orange-700 text-sm">
                      Last series point ({data.analysis.lastSeriesPoint}) ≠
                      Donut total ({data.analysis.donutTotal})
                    </p>
                    <p className="text-orange-600 text-xs mt-1">
                      This is the issue you reported: graph shows{" "}
                      {data.analysis.lastSeriesPoint} but donut shows{" "}
                      {data.analysis.donutTotal}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* API Errors */}
            {data.apiErrors && data.apiErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="font-medium text-red-900 mb-3">❌ API Errors</h3>
                <ul className="space-y-1 text-sm text-red-700">
                  {data.apiErrors.map((error: string, index: number) => (
                    <li
                      key={index}
                      className="font-mono text-xs bg-red-100 p-2 rounded"
                    >
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h3 className="font-medium text-gray-900 mb-3">📝 Next Steps</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                {data.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

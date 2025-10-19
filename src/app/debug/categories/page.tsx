"use client";

import { DebugCategoriesSection } from "@/features/home/debug/DebugCategoriesSection";
import type { Granularity } from "@/lib/types";
import { useState } from "react";

export default function DebugCategoriesPage() {
  const [granularity, setGranularity] = useState<Granularity>("d");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Debug Categories - GA4 vs Chatbot with Charts
          </h1>
          <p className="text-gray-600">
            Comparación visual entre datos de GA4 y Chatbot para categorías con
            gráficas interactivas
          </p>
          <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
            💡 Tip: Scroll down to see the visual charts section with
            interactive graphs
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Granularidad:
          </label>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="d">Daily</option>
            <option value="w">Weekly</option>
            <option value="m">Monthly</option>
            <option value="y">Yearly</option>
          </select>
        </div>

        <DebugCategoriesSection granularity={granularity} />
      </div>
    </div>
  );
}

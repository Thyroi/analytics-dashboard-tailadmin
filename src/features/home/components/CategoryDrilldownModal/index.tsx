"use client";

import { getCategoryLabel } from "@/lib/taxonomy/categories";
import { CategoryInfo } from "./CategoryInfo";
import { ChartsPlaceholder } from "./ChartsPlaceholder";
import { ModalHeader } from "./ModalHeader";
import type { CategoryDrilldownModalProps } from "./types";
import { useCategoryTotals } from "./useCategoryTotals";

export default function CategoryDrilldownModal({
  categoryId,
  granularity,
  onClose,
}: CategoryDrilldownModalProps) {
  const categoryLabel = getCategoryLabel(categoryId);
  const { ga4Total, chatbotTotal, combinedTotal } = useCategoryTotals(
    categoryId,
    granularity
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white dark:bg-gray-800 rounded-lg shadow-xl">
          <ModalHeader
            categoryLabel={categoryLabel}
            categoryId={categoryId}
            granularity={granularity}
            ga4Total={ga4Total}
            chatbotTotal={chatbotTotal}
            combinedTotal={combinedTotal}
            onClose={onClose}
          />

          <div className="p-6">
            <CategoryInfo
              categoryId={categoryId}
              categoryLabel={categoryLabel}
              granularity={granularity}
            />
            <ChartsPlaceholder
              categoryLabel={categoryLabel}
              granularity={granularity}
              categoryId={categoryId}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { CategoryDrilldownModalProps } from "./types";

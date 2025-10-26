/**
 * Debug page for Chatbot Totals
 *
 * Permite inspeccionar:
 * - Datos raw de la API
 * - Valores current y prev procesados
 * - Deltas calculados con el nuevo sistema
 * - Query completa vs datos usados para cálculo
 */

import DebugChatbotCategoriesSection from "@/features/debug/chatbot/components/DebugCategoriesSection";
import DebugChatbotTownsSection from "@/features/debug/chatbot/components/DebugTownsSection";

export default function DebugChatbotTotalsPage() {
  return (
    <div className="flex flex-col gap-8 p-4">
      <div className="max-w-[1560px] mx-auto w-full">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Debug: Chatbot Totals
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Inspecciona datos raw vs procesados para categorías y pueblos del
          chatbot
        </p>
      </div>

      {/* Categories Section */}
      <DebugChatbotCategoriesSection />

      {/* Towns Section */}
      <DebugChatbotTownsSection />
    </div>
  );
}

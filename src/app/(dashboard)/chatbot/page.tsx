"use client";

import Header from "@/components/common/Header";
import TopTagsSection from "@/features/chatbot/components/tags/TopTagsSection";
import { DEFAULT_TAG_META, TAG_META } from "@/lib/mockData";

export default function TagsDashboard() {
  return (
    <main className="px-6 py-8">
      {/* Header */}
      <Header
        title="Top tags con más búsquedas"
        subtitle="Icono, número de búsquedas y etiqueta"
      />
      <TopTagsSection tagMeta={TAG_META} defaultTagMeta={DEFAULT_TAG_META} />
    </main>
  );
}

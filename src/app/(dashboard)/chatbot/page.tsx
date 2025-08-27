"use client";

import Header from "@/components/common/Header";
import SubtagsSection from "@/features/chatbot/components/tags/SubTagsSection";
import TopTagsSection from "@/features/chatbot/components/tags/TopTagsSection";
import { TopTagsProvider } from "@/features/chatbot/context/TopTagsCtx";
import { DEFAULT_TAG_META, TAG_META } from "@/lib/mockData";

export default function TagsDashboard() {
  return (
    <TopTagsProvider>
      <main className="py-8">
        <Header
          title="Top tags con más búsquedas"
          subtitle="Icono, número de búsquedas y etiqueta"
        />
        <TopTagsSection tagMeta={TAG_META} defaultTagMeta={DEFAULT_TAG_META} />
        <SubtagsSection />
      </main>
    </TopTagsProvider>
  );
}

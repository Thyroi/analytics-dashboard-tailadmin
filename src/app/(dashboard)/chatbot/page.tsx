"use client";

import * as React from "react";
import { Suspense } from "react";
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

        {/* Cualquier componente que use useSearchParams/usePathname debe ir dentro de Suspense */}
        <Suspense fallback={<div className="h-24" />}>
          <TopTagsSection tagMeta={TAG_META} defaultTagMeta={DEFAULT_TAG_META} />
        </Suspense>

        <Suspense fallback={<div className="h-96" />}>
          <SubtagsSection />
        </Suspense>
      </main>
    </TopTagsProvider>
  );
}

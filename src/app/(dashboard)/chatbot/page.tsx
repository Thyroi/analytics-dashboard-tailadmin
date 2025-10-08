"use client";

import Header from "@/components/common/Header";
import ChatbotByTagSection from "@/features/chatbot/components/sections/ChatbotByTagSection";
import ChatbotByTownSection from "@/features/chatbot/components/sections/ChatbotByTownSection";

export default function TagsDashboard() {
  return (
    <main className="py-8 space-y-6">
      <Header
        title="Top tags con más búsquedas"
        subtitle="Icono, número de búsquedas y etiqueta"
      />
      <ChatbotByTagSection />
      <ChatbotByTownSection />
    </main>
  );
}

"use client";

import AnalyticsTagsSection from "@/features/chatbot/components/AnalyticsTagsSection";
import TagsPieGrid from "@/features/chatbot/components/TagsPieGrid";

export default function AnalyticsPage() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* ROW 1 */}
      <div className="col-span-12 min-w-0">
        <AnalyticsTagsSection />
      </div>
      
      {/* ROW 2 */}
      <div className="col-span-12 min-w-0">
        <TagsPieGrid />
      </div>
    </div>
  );
}

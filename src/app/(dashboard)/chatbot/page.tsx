"use client";

import AnalyticsTagsSection from "@/features/analytics/components/AnalyticsTagsSection";

export default function AnalyticsPage() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* ROW 1 */}

      <div className="col-span-12 min-w-0">
        <AnalyticsTagsSection />
      </div>
    </div>
  );
}

"use client";

import CustomersDemographicsSection from "@/features/analytics/components/CustomersDemographicsSection";
import DevicesOsDonutSection from "@/features/analytics/components/DevicesOsDonutSection";
import MonthlyRangeSection from "@/features/analytics/components/MonthlyRangeSection";
import MonthlyVisitsSection from "@/features/analytics/components/MonthlyVisitsSection";
import TopPagesSection from "@/features/analytics/components/TopPagesSection";
import UserActivityComparisonSection from "@/features/analytics/components/UserActivityComparisonSection";
import AnalyticsKPICards from "@features/analytics/components/AnalyticsKPISection";
import UserAcquisitionChart from "@features/analytics/components/UserAcquisitionSection";

export default function AnalyticsPage() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* ROW 1 */}
      <div className="col-span-12 lg:col-span-3 min-w-0">
        <AnalyticsKPICards stretch />
      </div>

      <div className="col-span-12 lg:col-span-9 min-w-0">
        <UserAcquisitionChart />
      </div>

      {/* ROW 2 */}
      <div className="col-span-12 lg:col-span-4 min-w-0">
        <div className="flex flex-col gap-6">
          <DevicesOsDonutSection />
          <MonthlyVisitsSection />
        </div>
      </div>

      <div className="col-span-12 lg:col-span-8 min-w-0">
        <CustomersDemographicsSection />
      </div>

      {/* ROW 3 */}
      <div className="col-span-12 min-w-0">
        <UserActivityComparisonSection />
      </div>

      {/* ROW 4 */}
      <div className="col-span-12 min-w-0">
        <MonthlyRangeSection />
      </div>

      <div className="col-span-12 min-w-0">
        <TopPagesSection start="2025-08-01" end="2025-08-31" limit={5} />
      </div>
    </div>
  );
}

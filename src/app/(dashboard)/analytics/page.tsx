// src/app/(dashboard)/analytics/page.tsx
"use client";

import MonthlyRangeChart from "@/components/charts/MonthlyRangeChart";
import DonutChartCard from "@/components/charts/DonutChartCard";
import { CustomersDemographicCard, MonthlyVisitsChart } from "@/components/charts";
import CompareLineChart from "@/components/charts/CompareLineChart";
import UserAcquisitionChart from "@/components/charts/UserAcquisitionChart";
import AnalyticsKPICards from "@/components/charts/AnalyticsKPICards";

export default function AnalyticsPage() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* ROW 1 */}
      <div className="col-span-12 lg:col-span-3">
        <AnalyticsKPICards stretch />
      </div>
      <div className="col-span-12 lg:col-span-9">
        <UserAcquisitionChart />
      </div>

      {/* ROW 2 */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <DonutChartCard />
        <MonthlyVisitsChart />
      </div>

      <div className="col-span-16 lg:col-span-8">
        <CustomersDemographicCard />
      </div>

      {/* ROW 3 */}
      <div className="col-span-12">
        <CompareLineChart />
      </div>

      {/* ROW 4 */}
      <div className="col-span-12">
        <MonthlyRangeChart />
      </div>
    </div>
  );
}

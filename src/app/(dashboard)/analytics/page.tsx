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
      <div className="col-span-12 lg:col-span-3 min-w-0">
        <AnalyticsKPICards stretch />
      </div>

      <div className="col-span-12 lg:col-span-9 min-w-0">
        <UserAcquisitionChart />
      </div>

      {/* ROW 2 */}
      <div className="col-span-12 lg:col-span-4 min-w-0">
        <div className="flex flex-col gap-6">
          <DonutChartCard />
          <MonthlyVisitsChart />
        </div>
      </div>

      {/* OJO: antes tenías col-span-16; cámbialo a 12 */}
      <div className="col-span-12 lg:col-span-8 min-w-0">
        <CustomersDemographicCard />
      </div>

      {/* ROW 3 */}
      <div className="col-span-12 min-w-0">
        <CompareLineChart />
      </div>

      {/* ROW 4 */}
      <div className="col-span-12 min-w-0">
        <MonthlyRangeChart />
      </div>
    </div>
  );
}

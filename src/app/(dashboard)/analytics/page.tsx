import {
  MonthlyVisitsChart,
  Last7DaysChart,
  MonthlyRangeChart,
  CustomersDemographicCard,
} from "@/components/charts";
import KPICard from "@/components/dashboard/KPICard";
import CompareLineChart from "@/components/charts/CompareLineChart";
import DonutChartCard from "@/components/charts/DonutChartCard";

export default function AnalyticsPage() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* KPI row */}
      <section className="col-span-12 grid grid-cols-12 gap-6">
        <KPICard className="col-span-12 sm:col-span-6 lg:col-span-3" title="Revenue" value="$21,424" delta="+4.6%" />
        <KPICard className="col-span-12 sm:col-span-6 lg:col-span-3" title="Orders" value="940" delta="+1.2%" />
        <KPICard className="col-span-12 sm:col-span-6 lg:col-span-3" title="Users" value="2,145" delta="-0.8%" deltaVariant="down" />
        <KPICard className="col-span-12 sm:col-span-6 lg:col-span-3" title="Bounce" value="38%" delta="-2.1%" deltaVariant="down" />
      </section>

      {/* Row 1 */}
      <section className="col-span-12 lg:col-span-7">
        <MonthlyVisitsChart />
      </section>
      <section className="col-span-12 lg:col-span-5">
        <CompareLineChart />
      </section>

      {/* Row 2 */}
      <section className="col-span-12 lg:col-span-7">
        <MonthlyRangeChart />
      </section>
      <section className="col-span-12 lg:col-span-5">
        <DonutChartCard />
      </section>

      {/* Row 3 */}
      <section className="col-span-12">
        <CustomersDemographicCard />
      </section>
    </div>
  );
}

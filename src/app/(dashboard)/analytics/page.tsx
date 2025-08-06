import {
  MonthlyVisitsChart,
  Last7DaysChart,
  MonthlyRangeChart,
} from "@/components/charts";

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <MonthlyVisitsChart />
      <Last7DaysChart />
      <MonthlyRangeChart />
    </div>
  );
}

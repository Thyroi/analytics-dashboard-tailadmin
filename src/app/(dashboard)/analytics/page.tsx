// src/app/(dashboard)/analytics/page.tsx
"use client";

import KPICard from "@/components/dashboard/KPICard";
import MonthlyRangeChart from "@/components/charts/MonthlyRangeChart";
import DonutChartCard from "@/components/charts/DonutChartCard";
import { CustomersDemographicCard, MonthlyVisitsChart } from "@/components/charts";
import CompareLineChart from "@/components/charts/CompareLineChart";

export default function AnalyticsPage() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* ROW 1 */}
      <div className="col-span-12 lg:col-span-3 flex flex-col gap-2">
        <KPICard title="Revenue" value="$21,424" delta="+4.6%" />
        <KPICard title="Orders" value="940" delta="+1.2%" />
        {/* si quieres solo 2 KPIs, elimina este tercero */}
        <KPICard title="Users" value="2,145" delta="-0.8%" deltaVariant="down" />
      </div>

      <div className="col-span-12 lg:col-span-9">
        {/* El componente ya incluye su card + header; no envolver */}
        <MonthlyRangeChart />
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
      <div className="col-span-12 lg:col-span-12">
        {/* Aquí puedes agregar más gráficos o componentes */}
        <CompareLineChart />
      </div>
    </div>
  );
}

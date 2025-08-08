// src/app/(dashboard)/page.tsx
import {
  MonthlyVisitsChart,
  Last7DaysChart,
  MonthlyRangeChart,
  CustomersDemographicCard,
} from "@/components/charts";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
      {/* Título de página */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Ideanto Analytics
        </h1>
      </div>

      <div className="grid grid-cols-12 gap-6 2xl:gap-8">
        <section className="col-span-12 xl:col-span-8">
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Visitas mensuales</h3>
                <p className="card-subtitle">Usuarios activos por mes</p>
              </div>
            </div>
            <MonthlyVisitsChart
              height={180}
              wrapInCard={false}
              showHeader={false}
            />
          </div>
        </section>

        <section className="col-span-12 xl:col-span-4">
          <div className="card h-full">
            <div className="card-header">
              <div>
                <h3 className="card-title">Últimos 7 días</h3>
                <p className="card-subtitle">Tendencia semanal</p>
              </div>
            </div>
            <div className="card-body">
              <Last7DaysChart
                height={160}
                wrapInCard={false}
                showHeader={false}
              />
            </div>
          </div>
        </section>

        <section className="col-span-12 xl:col-span-8">
              <MonthlyRangeChart
                height={180}
              />
        </section>

        <section className="col-span-12 xl:col-span-4">
          <div className="card h-full">
            <div className="card-header">
              <div>
                <h3 className="card-title">Demografía de clientes</h3>
                <p className="card-subtitle">
                  Número de clientes según el país
                </p>
              </div>
            </div>
            <CustomersDemographicCard
              height={180}
              wrapInCard={false}
              showHeader={false}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

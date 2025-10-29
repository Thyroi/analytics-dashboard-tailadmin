import type { DonutDatum } from "@/lib/types";
import DonutSection from "../DonutSection";
import DrilldownTitle from "../DrilldownTitle";

type TechnologySectionProps = {
  operatingSystems: DonutDatum[];
  devices: DonutDatum[];
  countries: DonutDatum[];
  deltaPct: number;
};

export function TechnologySection({
  operatingSystems,
  devices,
  countries,
  deltaPct,
}: TechnologySectionProps) {
  return (
    <>
      <section>
        <DrilldownTitle name="tecnológia y demográfia" color="secondary" />
        <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-3">
          <DonutSection
            donutData={operatingSystems ?? []}
            title="SISTEMAS OPERATIVOS"
            titleColor="text-[#c10007]"
          />
          <DonutSection
            donutData={devices ?? []}
            title="TIPO DE DISPOSITIVO"
            titleColor="text-[#c10007]"
          />
          <DonutSection
            donutData={countries ?? []}
            title="PAÍS DE ORIGEN"
            titleColor="text-[#c10007]"
          />
        </div>
      </section>

      {/* Delta global (sobre vistas) */}
      <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        Variación total (vistas):{" "}
        <span className="font-semibold">{Math.round(deltaPct)}%</span>
      </div>
    </>
  );
}

"use client";

import PieChart from "@/components/charts/PieChart";
import Header from "@/components/common/Header";
import { useSubtagsData } from "@/hooks/useSubtagsData";
import GranularityTabs from "../../../../components/dashboard/GranularityTabs";
import SubtagsCompareChart from "./SubtagsCompareChart";
import SubtagsList from "./SubtagsList";
import TagSelector from "./TagSelector";

export default function SubtagsSection() {
  const {
    tag,
    subGran,
    setSubGran,
    onChangeTag,
    rows,
    donutData,
    colorsByLabel,
    totalVisible,
    donutHeight,
    compareHeight,
    subtitleSuffix,
    tagOptions,
    donutOptions,
    windowDates,
    dateRangeLabel,
  } = useSubtagsData();

  return (
    <section id="subtags-section" className="mt-8">
      {/* Header local */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <TagSelector
          value={tag}
          options={tagOptions}
          onChange={onChangeTag}
          prefixLabel="Tags"
          suffixText={`• Subtags (${subtitleSuffix})`}
        />
        <GranularityTabs value={subGran} onChange={setSubGran} />
      </div>

      {/* Card unificada (3 columnas) */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#14181e] p-4 pl-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* Izquierda */}
          <div className="xl:col-span-3 flex flex-col">
            <Header
              title="Issues Discovered"
              subtitle="Newly found and yet to be solved"
            />
            <SubtagsList
              className="flex-1 mt-4"
              rows={rows}
              colorsByLabel={colorsByLabel}
              totalVisible={totalVisible}
              title="Issue type"
              totalLabel="Total count"
            />
          </div>

          {/* Centro: Donut */}
          <div className="xl:col-span-3 flex items-center justify-center">
            {donutData.length ? (
              <PieChart
                type="donut"
                data={donutData}
                height={donutHeight}
                colorsByLabel={colorsByLabel}
                showLegend={false}
                dataLabels="none"
                donutTotalLabel="Total"
                donutTotalFormatter={(t) => Intl.NumberFormat().format(t)}
                optionsExtra={donutOptions}
              />
            ) : (
              <div className="text-sm text-gray-400">Sin datos en el rango</div>
            )}
          </div>

          {/* Derecha: Líneas */}
          <div className="xl:col-span-6 flex flex-col">
            <SubtagsCompareChart
              rows={rows}
              gran={subGran}
              colorsByLabel={colorsByLabel}
              height={compareHeight}
              title="Comparativa de subtags (líneas)"
              subtitle={`Tendencia por subtag — ${subtitleSuffix}${
                dateRangeLabel ? ` · ${dateRangeLabel}` : ""
              }`}
              maxSeries={6}
              windowDates={windowDates}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

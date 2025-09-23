"use client";

import GeneralDataRow from "@/features/home/generalSection/GeneralDataRow";
import HomeProviders from "@/features/home/providers/HomeProviders";
import SectorsByTagSection from "@/features/home/sectors/SectorsByTagSection";
import SectorsByTownSection from "@/features/home/sectors/SectorsByTownSection";

export default function Home() {
  return (
    <HomeProviders>
      <main className="flex flex-col gap-10 px-4 py-6 md:py-10">
        <section className="max-w-[1560px] mx-auto w-full">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center ring-1 ring-black/5">
              <span className="font-semibold">📊</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Datos generales
            </h2>
          </div>
          <GeneralDataRow />
        </section>

        <section className="max-w-[1560px] mx-auto w-full">
          <div className="max-w-[1560px] mx-auto">
            <SectorsByTagSection />
          </div>
        </section>

        <section className="max-w-[1560px] mx-auto w-full">
          <div className="max-w-[1560px] mx-auto">
            <SectorsByTownSection />
          </div>
        </section>
      </main>
    </HomeProviders>
  );
}

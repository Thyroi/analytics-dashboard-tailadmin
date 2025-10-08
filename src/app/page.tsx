"use client";

import HomeProviders from "@/features/home/providers/HomeProviders";
import GeneralDataSection from "@/features/home/sections/GeneralDataSection";
import SectorsByTagSection from "@/features/home/sectors/SectorsByTagSection";
import SectorsByTownSection from "@/features/home/sectors/SectorsByTownSection";


export default function Home() {
  return (
    <HomeProviders>
      <main className="flex flex-col gap-10 px-4 py-6 md:py-10">
        <GeneralDataSection />
        <SectorsByTagSection />
        <SectorsByTownSection />
      </main>
    </HomeProviders>
  );
}

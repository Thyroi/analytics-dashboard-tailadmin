"use client";

import LogoCard from "@/components/subheader/LogoCard";
import MapBanner from "@/components/subheader/MapBanner";

export default function SubHeader() {
  return (
    <section className="w-full bg-transparent">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex items-stretch gap-6 pb-6">
          <LogoCard />
          <MapBanner />
        </div>
      </div>
    </section>
  );
}

"use client";

import GeneralDataCard from "@/features/home/generalSection/GeneralDataCard";

type Props = {
  className?: string;
};

export default function GeneralDataRow({ className = "" }: Props) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch ${className}`}
    >
      {/* Cada columna ocupa 50% en md+ y 100% en mobile.
          h-full garantiza que ambas tarjetas tengan la misma altura. */}
      <div className="w-full h-full">
        <GeneralDataCard
          title="Usuarios totales"
          metric="visits"
          className="w-full h-full"
        />
      </div>

      <div className="w-full h-full">
        <GeneralDataCard
          title="Interacciones totales"
          metric="interactions"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}

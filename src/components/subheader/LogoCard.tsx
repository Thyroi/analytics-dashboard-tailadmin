"use client";

import Image from "next/image";

type LogoCardProps = {
  /** Clase extra opcional */
  className?: string;
};

export default function LogoCard({ className = "" }: LogoCardProps) {
  return (
    <div
      className={`relative bg-white rounded-l-[29px] overflow-hidden w-[270px] h-[160px] ${className}`}
      style={{
        boxShadow: [
          "0px 0.41px 3.15px 0px #00000004",
          "0px 1.79px 6.52px 0px #00000007",
          "0px 4.4px 13px 0px #00000009",
          "0px 8.47px 25.48px 0px #0000000B",
          "0px 14.26px 46.85px 0px #0000000E",
          "0px 22px 80px 0px #00000012",
        ].join(", "),
      }}
    >
      {/* borde sutil como en la maqueta */}
      <div className="absolute inset-0 rounded-l-[29px] ring-1 ring-black/5 pointer-events-none" />

      {/* Logo centrado */}
      <div className="h-full w-full flex items-center justify-center p-6">
        <Image
          src="/logo-mancomunidad.png"
          alt="Condado de Huelva - Mancomunidad de Desarrollo"
          width={400}
          height={200}
          priority
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </div>
  );
}

import Image from "next/image";

const MapBanner = () => {
  return (
    <div
      className="flex-1 relative rounded-[8px]"
      style={{
        background:
          "linear-gradient(90deg, var(--color-huelva-primary) 0%, var(--color-huelva-secondary) 100%)",
        boxShadow:
          "0 8px 24px -8px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Contenedor fijo en altura */}
      <div className="h-[160px] w-full relative overflow-hidden">
        {/* Imagen de fondo */}
        <Image
          src="/condado-banner.png"
          alt="Condado de Huelva - Mancomunidad de Desarrollo"
          fill
          priority
          className="object-cover object-bottom"
        />

        {/* Imagen del mapa sobrepuesta */}
        <div className="absolute top-[-40px] right-0 flex items-start justify-end p-4">
          <Image
            src="/mapa-condado.png"
            alt="Mapa del Condado de Huelva"
            width={210}
            height={250}
            priority
            className="object-contain drop-shadow-lg"
            style={{ width: "auto", height: "auto" }} 
          />
        </div>
      </div>
    </div>
  );
};

export default MapBanner;

"use client";

import Header from "@/components/common/Header";
import { MapPinned } from "lucide-react";

type Props = {
  /** Título del componente */
  title?: string;
  /** Alto del mapa */
  mapHeight?: number;
  /** Número de países a mostrar */
  countryRows?: number;
  /** Clases CSS del contenedor */
  className?: string;
};

export default function CustomersDemographicsSkeleton({
  title = "Demografía de clientes",
  mapHeight = 260,
  countryRows = 3,
  className = "card bg-analytics-gradient overflow-hidden",
}: Props) {
  return (
    <div className={className} aria-busy="true">
      <div className="card-header">
        <Header title={title} Icon={MapPinned} titleSize="xs" />
      </div>

      <div className="card-body">
        {/* Mapa placeholder */}
        <div className="relative mb-6 overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
          <div
            className="w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10"
            style={{ height: mapHeight }}
          >
            {/* Puntos simulando marcadores en el mapa */}
            <div className="relative h-full w-full">
              {/* Marcador 1 - Europa */}
              <div 
                className="absolute h-3 w-3 rounded-full bg-red-400 animate-pulse"
                style={{ top: "35%", left: "52%" }}
              />
              {/* Marcador 2 - América */}
              <div 
                className="absolute h-2 w-2 rounded-full bg-red-300 animate-pulse"
                style={{ top: "45%", left: "25%" }}
              />
              {/* Marcador 3 - Asia */}
              <div 
                className="absolute h-2 w-2 rounded-full bg-red-300 animate-pulse"
                style={{ top: "40%", left: "75%" }}
              />
              
              {/* Overlay de loading */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-lg bg-white/80 px-3 py-2 text-sm text-gray-600 dark:bg-black/50 dark:text-gray-300">
                  Cargando mapa...
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de países skeleton */}
        <div className="space-y-4">
          {Array.from({ length: countryRows }).map((_, i) => (
            <CountryRowSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CountryRowSkeleton({ index }: { index: number }) {
  // Solo el primer país expandido para simplificar
  const isExpanded = index === 0;

  return (
    <div>
      {/* País skeleton */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-white/5">
        <div className="flex items-center gap-3">
          {/* Flag placeholder */}
          <div className="h-5 w-7 rounded bg-gray-300 dark:bg-white/20" />
          
          {/* Nombre del país */}
          <div className="h-4 w-24 rounded bg-gray-200 dark:bg-white/10" />
        </div>

        <div className="flex items-center gap-4">
          {/* Barra de progreso */}
          <div className="hidden sm:block">
            <div className="h-2 w-16 rounded-full bg-gray-200 dark:bg-white/10">
              <div 
                className="h-full rounded-full bg-red-300 dark:bg-red-400"
                style={{ width: `${60 - index * 15}%` }}
              />
            </div>
          </div>
          
          {/* Porcentaje */}
          <div className="h-3 w-8 rounded bg-gray-200 dark:bg-white/10" />
          
          {/* Usuarios */}
          <div className="h-3 w-12 rounded bg-gray-200 dark:bg-white/10" />
          
          {/* Icono de expansión */}
          <div className="h-4 w-4 rounded bg-gray-200 dark:bg-white/10" />
        </div>
      </div>

      {/* Solo mostrar regiones expandidas en el primer país */}
      {isExpanded && (
        <div className="ml-6 mr-2 mb-2 mt-2">
          {Array.from({ length: 2 }).map((_, regionIndex) => (
            <div 
              key={regionIndex}
              className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 p-2 mb-1 dark:border-white/5 dark:bg-white/5"
            >
              <div className="h-3 w-20 rounded bg-gray-200 dark:bg-white/10" />
              <div className="flex items-center gap-3">
                <div className="h-2 w-12 rounded-full bg-gray-200 dark:bg-white/10">
                  <div className="h-full w-3/4 rounded-full bg-red-200 dark:bg-red-300" />
                </div>
                <div className="h-3 w-6 rounded bg-gray-200 dark:bg-white/10" />
                <div className="h-3 w-8 rounded bg-gray-200 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
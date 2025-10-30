import { MAP_MARKERS } from "./constants";

interface MapPlaceholderProps {
  height: number;
}

export function MapPlaceholder({ height }: MapPlaceholderProps) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
      <div
        className="w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/10"
        style={{ height }}
      >
        {/* Puntos simulando marcadores en el mapa */}
        <div className="relative h-full w-full">
          {MAP_MARKERS.map((marker, index) => (
            <div
              key={index}
              className={`absolute ${marker.size} rounded-full ${marker.color} animate-pulse`}
              style={{ top: marker.top, left: marker.left }}
            />
          ))}

          {/* Overlay de loading */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg bg-white/80 px-3 py-2 text-sm text-gray-600 dark:bg-black/50 dark:text-gray-300">
              Cargando mapa...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Función para formatear URLs removiendo dominio/protocolo
 * y convirtiendo segmentos en formato legible manteniendo TODOS los niveles
 * Ejemplo: /almonte/naturaleza/ruta-ciclista → "Almonte / Naturaleza / Ruta Ciclista"
 */
export function formatUrlForDisplay(url: string): string {
  try {
    const raw = String(url ?? "").trim();

    let pathname = raw;

    // Si es URL absoluta (o protocol-relative), extraer solo pathname
    if (
      raw.startsWith("http://") ||
      raw.startsWith("https://") ||
      raw.startsWith("//")
    ) {
      const normalized = raw.startsWith("//") ? `https:${raw}` : raw;
      pathname = new URL(normalized).pathname;
    }

    // Remover query params/hash por seguridad
    const noHash = pathname.split("#")[0] ?? pathname;
    pathname = noHash.split("?")[0] ?? noHash;

    // Normalizar path
    pathname = pathname.startsWith("/") ? pathname : `/${pathname}`;

    // Separar segmentos del path
    let segments = pathname.split("/").filter(Boolean);

    // Fallback para valores tipo "dominio.com/ruta" sin protocolo
    // o strings legacy como "https:/dominio/ruta"
    if (segments.length > 1) {
      const first = (segments[0] || "").toLowerCase();
      if (first === "http:" || first === "https:" || first.includes(".")) {
        segments = segments.slice(1);
      }
    }

    if (segments.length === 0) {
      return "Inicio";
    }

    // Función helper para capitalizar y limpiar segmentos
    const formatSegment = (segment: string): string => {
      return segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    // ✅ Formatear TODOS los segmentos y unirlos con " - "
    // Esto mantiene la unicidad mientras hace la URL más legible
    const formattedSegments = segments.map(formatSegment);

    return formattedSegments.join(" - ");
  } catch {
    return url;
  }
}

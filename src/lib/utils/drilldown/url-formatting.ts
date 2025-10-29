/**
 * Función para formatear URLs removiendo el dominio wp.ideanto.com
 * y convirtiendo segmentos en formato legible manteniendo TODOS los niveles
 * Ejemplo: /almonte/naturaleza/ruta-ciclista → "Almonte / Naturaleza / Ruta Ciclista"
 */
export function formatUrlForDisplay(url: string): string {
  try {
    let workingUrl = url;

    // Remover la base https://wp.ideanto.com
    if (workingUrl.startsWith("https://wp.ideanto.com")) {
      workingUrl = workingUrl.replace("https://wp.ideanto.com", "");
    } else if (workingUrl.startsWith("http://wp.ideanto.com")) {
      workingUrl = workingUrl.replace("http://wp.ideanto.com", "");
    }

    // Remover query params y hash para el procesamiento
    const hashIndex = workingUrl.indexOf("#");
    if (hashIndex !== -1) {
      workingUrl = workingUrl.substring(0, hashIndex);
    }

    const queryIndex = workingUrl.indexOf("?");
    if (queryIndex !== -1) {
      workingUrl = workingUrl.substring(0, queryIndex);
    }

    // Normalizar path
    const pathname = workingUrl.startsWith("/") ? workingUrl : "/" + workingUrl;

    // Separar segmentos del path
    const segments = pathname.split("/").filter(Boolean);

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

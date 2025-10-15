/**
 * Función para formatear URLs removiendo el dominio wp.ideanto.com y el primer segmento (pueblo)
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

    // Separar query y hash
    let search = "";
    let hash = "";

    const hashIndex = workingUrl.indexOf("#");
    if (hashIndex !== -1) {
      hash = workingUrl.substring(hashIndex);
      workingUrl = workingUrl.substring(0, hashIndex);
    }

    const queryIndex = workingUrl.indexOf("?");
    if (queryIndex !== -1) {
      search = workingUrl.substring(queryIndex);
      workingUrl = workingUrl.substring(0, queryIndex);
    }

    // Normalizar path
    const pathname = workingUrl.startsWith("/") ? workingUrl : "/" + workingUrl;

    // Remover pueblo del path (asumir que es el primer segmento)
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      return search + hash || "/";
    }

    // Si hay más de un segmento, quitar el primero (pueblo) y mantener el resto
    let resultPath: string;
    if (segments.length > 1) {
      resultPath = "/" + segments.slice(1).join("/");
    } else {
      resultPath = "/";
    }

    // Preservar trailing slash si el original lo tenía
    if (
      pathname.endsWith("/") &&
      !resultPath.endsWith("/") &&
      resultPath !== "/"
    ) {
      resultPath += "/";
    }

    return resultPath + search + hash;
  } catch {
    return url;
  }
}

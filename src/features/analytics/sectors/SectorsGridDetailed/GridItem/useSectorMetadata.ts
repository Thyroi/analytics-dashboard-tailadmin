import type { IconOrImage } from "@/lib/utils/core/images";
import { sectorIconSrc, sectorTitle } from "@/lib/utils/core/sector";
import { MapPinIcon } from "@heroicons/react/24/solid";
import type { Mode } from "../types";
import { extractImageSrc } from "../utils";

export function useSectorMetadata(mode: Mode, id: string) {
  const title = sectorTitle(mode, id);
  const iconCandidate = sectorIconSrc(mode, id);
  const imgSrcStr = extractImageSrc(iconCandidate);
  const isTown = mode === "town";

  // Crear el variant con el tipo correcto basado en imgSrcStr
  const iconOrImage: IconOrImage = imgSrcStr
    ? { imgSrc: imgSrcStr }
    : {
        Icon: MapPinIcon as React.ComponentType<React.SVGProps<SVGSVGElement>>,
      };

  return {
    title,
    isTown,
    expandedVariant: iconOrImage,
    collapsedVariant: iconOrImage,
  };
}

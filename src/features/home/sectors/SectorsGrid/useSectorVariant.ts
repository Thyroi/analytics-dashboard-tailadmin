import { sectorIconSrc, sectorTitle } from "@/lib/utils/core/sector";
import { MapPinIcon } from "@heroicons/react/24/solid";
import type { Mode } from "./types";

export function getSectorVariant(mode: Mode, id: string) {
  const title = sectorTitle(mode, id);
  const imgSrc = sectorIconSrc(mode, id);

  const variant =
    imgSrc !== undefined
      ? { imgSrc }
      : {
          Icon: MapPinIcon as React.ComponentType<
            React.SVGProps<SVGSVGElement>
          >,
        };

  return { title, variant };
}

import { brandAreaFill } from "@/lib/utils/formatting/colors";
import { useMemo } from "react";

export function useFillConfig(
  type: "line" | "area",
  brandAreaGradient: boolean
) {
  return useMemo(() => {
    if (type !== "area") return { opacity: 1 as const };
    return brandAreaGradient
      ? brandAreaFill()
      : {
          type: "gradient" as const,
          gradient: { opacityFrom: 0.55, opacityTo: 0 },
        };
  }, [type, brandAreaGradient]);
}

"use client";

import { coerceDelta } from "@/lib/utils/delta";
import { formatPct } from "@/lib/utils/format";

type Props = { deltaPct: number | null; loading: boolean };

export default function CardDelta({ deltaPct, loading }: Props) {
  const num = coerceDelta(deltaPct);

  const cls =
    num === null
      ? "text-gray-400"
      : num >= 0
      ? "text-[#35C759]"
      : "text-[#E74C3C]";

  return (
    <div
      className={`self-end text-center font-extrabold ${cls}`}
      style={{
        fontSize: num === null ? 14 : 28,
        lineHeight: num === null ? "18px" : "28px",
        visibility: loading ? "hidden" : "visible",
      }}
    >
      {formatPct(deltaPct)}
    </div>
  );
}

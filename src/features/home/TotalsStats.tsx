"use client";

import KPIList from "@/components/charts/KPIList";
import { useTotals } from "@/hooks/useTags";
import { ChatBubbleLeftRightIcon, EyeIcon } from "@heroicons/react/24/outline";
import type { Granularity } from "@/lib/chatbot/tags";

function fmt(n: number): string {
  return new Intl.NumberFormat("es-ES").format(n);
}

type Props = {
  className?: string;
  startTime?: string;
  endTime?: string;
  granularity?: Granularity;
  direction?: "vertical" | "horizontal";
  itemsPerPage?: number;
  showPager?: boolean;
  stretch?: boolean;
};

export default function TotalsStats({
  className = "",
  startTime,
  endTime,
  granularity,
  direction = "horizontal",
  itemsPerPage = 3,
  showPager = true,
  stretch = false,
}: Props) {
  const { interactions, visits } = useTotals(
    startTime || endTime ? { startTime, endTime } : undefined,
    granularity
  );

  const items = [
    {
      title: "Interacciones",
      value: fmt(interactions),
      delta: "",
      deltaVariant: "up" as const,
      icon: <ChatBubbleLeftRightIcon className="w-5 h-5" />,
    },
    {
      title: "Visitas",
      value: fmt(visits),
      delta: "",
      deltaVariant: "up" as const,
      icon: <EyeIcon className="w-5 h-5" />,
    },
  ];

  return (
    <KPIList
      className={className}
      items={items}
      direction={direction}
      itemsPerPage={itemsPerPage}
      showPager={showPager}
      stretch={stretch}
    />
  );
}

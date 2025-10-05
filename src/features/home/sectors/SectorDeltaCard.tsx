"use client";

import React, { useMemo } from "react";
import { formatPct } from "./SectorExpandedCard/utils";

type BaseProps = {
  title: string;
  deltaPct: number | null;
  className?: string;
  ringSize?: number;
  ringThickness?: number;
  height?: number;
  onClick?: () => void;
  expanded?: boolean;
  isTown?: boolean;
};

type WithIcon = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  imgSrc?: never;
};

type WithImage = {
  imgSrc: string;
  Icon?: never;
};

type Props = BaseProps & (WithIcon | WithImage);

export default function SectorDeltaCard(props: Props) {
  const {
    title,
    deltaPct,
    className = "",
    ringSize = 96,
    ringThickness = 8,
    height = 220,
    onClick,
    expanded = false,
    isTown = false,
  } = props;

  const hasDelta = typeof deltaPct === "number" && Number.isFinite(deltaPct);
  const deltaNum = hasDelta ? (deltaPct as number) : 0;

  const { deg, ringColor, trackColor, innerSize } = useMemo(() => {
    const progress = hasDelta
      ? Math.max(0, Math.min(100, Math.abs(deltaNum)))
      : 0;
    const deg = progress * 3.6;
    const ringColor = hasDelta
      ? deltaNum >= 0
        ? "#35C759"
        : "#902919"
      : "#9CA3AF"; // gris si no hay datos suficientes
    const trackColor = "rgba(0,0,0,0)";
    const innerSize = ringSize - ringThickness * 2;
    return { deg, ringColor, trackColor, innerSize };
  }, [hasDelta, deltaNum, ringSize, ringThickness]);

  const baseClasses =
    "box-border w-full h-full rounded-2xl border bg-white dark:bg-[#0c1116] shadow-sm " +
    "border-gray-200 dark:border-white/10 overflow-hidden";

  const interactiveClasses =
    typeof onClick === "function"
      ? "cursor-pointer hover:shadow-md transition-shadow focus:outline-none " +
        "focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 " +
        "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0c1116] appearance-none"
      : "";

  const selectedRing = expanded
    ? "ring-2 ring-emerald-400 ring-offset-1"
    : "ring-0";
  const Wrapper: React.ElementType =
    typeof onClick === "function" ? "button" : "div";

  const innerBg = isTown ? "#FFF1D3" : "#E64E3C";
  const iconColor = isTown ? "#E64E3C" : "#FFFFFF";

  // 👇 Centralizado: usa el util (devuelve "Sin datos suficientes" si p=null/invalid)
  const deltaLabel = formatPct(deltaPct);
  const deltaClass = hasDelta
    ? deltaNum >= 0
      ? "text-[#35C759]"
      : "text-[#E74C3C]"
    : "text-gray-400";

  return (
    <Wrapper
      type={typeof onClick === "function" ? "button" : undefined}
      onClick={onClick}
      aria-pressed={typeof onClick === "function" ? expanded : undefined}
      className={`${baseClasses} ${interactiveClasses} ${selectedRing} ${className}`}
      style={{ height, minHeight: height }}
      aria-label={`${title}: ${deltaLabel}`}
      title={`${title}: ${deltaLabel}`}
    >
      <div className="grid h-full grid-rows-[42px_1fr_52px] px-3 py-3">
        <div
          className="text-center font-bold text-[#E64E3C] leading-tight"
          style={{
            fontSize: "16px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>

        <div className="flex items-center justify-center">
          <div
            className="relative grid place-items-center rounded-full"
            style={{
              width: ringSize,
              height: ringSize,
              backgroundImage: `conic-gradient(${ringColor} 0deg ${deg}deg, ${trackColor} ${deg}deg 360deg)`,
            }}
          >
            <div
              className="grid place-items-center rounded-full overflow-hidden"
              style={{
                width: ringSize - ringThickness * 2,
                height: ringSize - ringThickness * 2,
                backgroundColor: innerBg,
              }}
            >
              {"imgSrc" in props ? (
                <img
                  src={props.imgSrc}
                  alt={title}
                  className="h-12 w-12 object-contain"
                  draggable={false}
                />
              ) : (
                <props.Icon
                  className="h-12 w-12"
                  style={{ color: iconColor }}
                />
              )}
            </div>
          </div>
        </div>

        <div
          className={`self-end text-center font-extrabold ${deltaClass}`}
          style={{
            fontSize: hasDelta ? 28 : 14,
            lineHeight: hasDelta ? "28px" : "18px",
          }}
        >
          {deltaLabel}
        </div>
      </div>
    </Wrapper>
  );
}

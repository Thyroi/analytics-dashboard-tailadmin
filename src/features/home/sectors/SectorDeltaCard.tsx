"use client";

import React, { useMemo } from "react";

type BaseProps = {
  title: string;
  /** Ahora puede ser null si no hay datos suficientes en el período previo */
  deltaPct: number | null;
  className?: string;
  ringSize?: number;
  ringThickness?: number;
  height?: number;
  onClick?: () => void;
  expanded?: boolean;
  /** Si es un pueblo: cambia el fondo del círculo interior. */
  isTown?: boolean;
};

/** Variante con SVG */
type WithIcon = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  imgSrc?: never;
};

/** Variante con PNG/JPG */
type WithImage = {
  imgSrc: string;
  Icon?: never;
};

type Props = BaseProps & (WithIcon | WithImage);

function formatDeltaPct(pct: number, locale = "es-ES"): string {
  const sign = pct > 0 ? "+" : pct < 0 ? "−" : "";
  const abs = Math.abs(pct);
  return `${sign}${abs.toLocaleString(locale, { maximumFractionDigits: 0 })}%`;
}

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

  const clickable = typeof onClick === "function";

  // Normalizamos: hay delta si es número finito
  const hasDelta = typeof deltaPct === "number" && Number.isFinite(deltaPct);
  const deltaNum = hasDelta ? (deltaPct as number) : 0;
  const isUp = hasDelta ? deltaNum >= 0 : null;

  const { deg, ringColor, trackColor, innerSize } = useMemo(() => {
    const progress = hasDelta
      ? Math.max(0, Math.min(100, Math.abs(deltaNum)))
      : 0;
    const deg = progress * 3.6;
    const ringColor = hasDelta
      ? deltaNum >= 0
        ? "#35C759"
        : "#902919"
      : "#9CA3AF"; // gris si no hay datos
    const trackColor = "rgba(0,0,0,0)"; // sin track visible para mantener estética
    const innerSize = ringSize - ringThickness * 2;
    return { deg, ringColor, trackColor, innerSize };
  }, [hasDelta, deltaNum, ringSize, ringThickness]);

  const baseClasses =
    "box-border w-full h-full rounded-2xl border bg-white dark:bg-[#0c1116] shadow-sm " +
    "border-gray-200 dark:border-white/10 overflow-hidden";
  const interactiveClasses = clickable
    ? "cursor-pointer hover:shadow-md transition-shadow focus:outline-none " +
      "focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 " +
      "focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#0c1116] appearance-none"
    : "";
  const selectedRing = expanded
    ? "ring-2 ring-emerald-400 ring-offset-1"
    : "ring-0";

  const Wrapper: React.ElementType = clickable ? "button" : "div";

  // Colores del centro y del icono según variante
  const innerBg = isTown ? "#FFF1D3" : "#E64E3C";
  const iconColor = isTown ? "#E64E3C" : "#FFFFFF";

  const deltaLabel = hasDelta
    ? formatDeltaPct(deltaNum)
    : "Sin datos suficientes";
  const deltaClass = hasDelta
    ? isUp
      ? "text-[#35C759]"
      : "text-[#E74C3C]"
    : "text-gray-400";

  return (
    <Wrapper
      type={clickable ? "button" : undefined}
      onClick={onClick}
      aria-pressed={clickable ? expanded : undefined}
      className={`${baseClasses} ${interactiveClasses} ${selectedRing} ${className}`}
      style={{ height, minHeight: height }}
      aria-label={`${title}: ${deltaLabel}`}
      title={`${title}: ${deltaLabel}`}
    >
      {/* 3 filas: título (42px), aro (flex), delta (52px) */}
      <div className="grid h-full grid-rows-[42px_1fr_52px] px-3 py-3">
        {/* Título */}
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

        {/* Aro + icono/imagen */}
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
                width: innerSize,
                height: innerSize,
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

        {/* Delta */}
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

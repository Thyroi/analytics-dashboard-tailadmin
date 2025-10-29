"use client";

import { ringVisuals } from "@/lib/utils/core/delta";
import type { DeltaArtifact } from "@/lib/utils/delta";
import { motion } from "framer-motion";
import React, { useMemo } from "react";
import CardDelta from "./CardDelta";
import CardTitle from "./CardTitle";
import RingWithIcon from "./RingWithIcon";

/* --- Tipos base --- */
type BaseProps = {
  title: string;
  deltaPct: number | null;
  deltaArtifact?: DeltaArtifact; // Nuevo: artifact opcional
  className?: string;
  ringSize?: number;
  ringThickness?: number;
  height?: number;
  onClick?: () => void;
  expanded?: boolean;
  isTown?: boolean;
  loading?: boolean;
};

type WithIcon = {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  imgSrc?: never;
};
type WithImage = { imgSrc: string; Icon?: never };

type Props = BaseProps & (WithIcon | WithImage);

/* --- Type guard sin any --- */
function hasImage(p: Props): p is BaseProps & WithImage {
  return "imgSrc" in p && typeof p.imgSrc === "string" && p.imgSrc.length > 0;
}

export default function DeltaCard(props: Props) {
  const {
    title,
    deltaPct,
    deltaArtifact,
    className = "",
    ringSize = 96,
    ringThickness = 8,
    height = 220,
    onClick,
    expanded = false,
    isTown = false,
    loading = false,
  } = props;

  // Determinar si la card debe ser clickeable basado en el artifact
  const hasInsufficientData = useMemo(() => {
    if (!deltaArtifact) return false;
    // No clickeable cuando:
    // - no_current: sin datos actuales (pero zero_vs_zero SÍ es clickeable con opacidad)
    return deltaArtifact.state === "no_current";
  }, [deltaArtifact]);

  // Determinar si debe tener opacidad reducida (sin actividad o sin datos)
  const hasLowActivity = useMemo(() => {
    if (deltaArtifact) {
      // Opacidad reducida para zero_vs_zero o no_current
      return (
        deltaArtifact.state === "zero_vs_zero" ||
        deltaArtifact.state === "no_current"
      );
    }
    // Sin artifact: opacidad reducida si deltaPct es null o 0
    return deltaPct === null || deltaPct === 0;
  }, [deltaArtifact, deltaPct]);

  const { ringBackground } = useMemo(() => ringVisuals(deltaPct), [deltaPct]);

  // Determinar estilos y comportamiento basado en si hay datos insuficientes
  const isClickable = !hasInsufficientData && typeof onClick === "function";
  const tooltipMessage = hasInsufficientData
    ? "No hay datos suficientes para mostrar detalles"
    : title;

  // ⬇️ Estilo mejorado para consistencia con GeneralDataCards
  const baseClasses =
    "box-border w-full h-full rounded-2xl border bg-white dark:bg-gray-800 shadow-sm " +
    "border-gray-200/50 dark:border-gray-700/50 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden " +
    (hasLowActivity ? "opacity-60" : "hover:border-red-300");

  const interactiveClasses = isClickable
    ? "cursor-pointer hover:shadow-md transition-shadow focus:outline-none " +
      "focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-1 " +
      "focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 appearance-none"
    : hasInsufficientData
    ? "cursor-default"
    : "";

  const selectedRing = expanded
    ? "ring-2 ring-emerald-400 ring-offset-1"
    : "ring-0";
  const wrapperClass = `${baseClasses} ${interactiveClasses} ${selectedRing} ${className}`;

  const innerBg = isTown ? "#FFF1D3" : "#E64E3C";
  const iconColor = isTown ? "#E64E3C" : "#FFFFFF";

  const content = (
    <div className="grid h-full grid-rows-[42px_1fr_52px] px-3 py-3">
      <CardTitle title={title} />

      <div className="flex items-center justify-center">
        {hasImage(props) ? (
          <RingWithIcon
            ringSize={ringSize}
            ringThickness={ringThickness}
            loading={loading}
            ringBackground={ringBackground}
            innerBg={innerBg}
            iconColor={iconColor}
            title={title}
            imgSrc={props.imgSrc}
          />
        ) : (
          <RingWithIcon
            ringSize={ringSize}
            ringThickness={ringThickness}
            loading={loading}
            ringBackground={ringBackground}
            innerBg={innerBg}
            iconColor={iconColor}
            title={title}
            Icon={props.Icon}
          />
        )}
      </div>

      <CardDelta
        deltaPct={deltaPct}
        loading={loading}
        deltaArtifact={deltaArtifact}
      />
    </div>
  );

  if (typeof onClick === "function") {
    return (
      <motion.button
        type="button"
        onClick={hasInsufficientData ? undefined : onClick}
        aria-pressed={expanded}
        className={wrapperClass}
        style={{ height, minHeight: height }}
        aria-busy={loading || undefined}
        aria-label={title}
        title={tooltipMessage}
        disabled={hasInsufficientData}
        whileHover={hasInsufficientData ? undefined : { scale: 1.02, y: -2 }}
        whileTap={hasInsufficientData ? undefined : { scale: 0.98 }}
      >
        {content}
      </motion.button>
    );
  }

  return (
    <motion.div
      className={wrapperClass}
      style={{ height, minHeight: height }}
      aria-busy={loading || undefined}
      aria-label={title}
      title={tooltipMessage}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {content}
    </motion.div>
  );
}

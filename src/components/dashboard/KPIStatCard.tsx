"use client";

import { motion } from "motion/react";
import * as React from "react";

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export type Props = {
  title: string;
  value: number | string;
  change?: number | string;
  icon: IconType;
  color?: string;
  delay?: number;
  className?: string;
};

export default function KPIStatCard({
  title,
  value,
  change,
  icon: Icon,
  color = "from-orange-500 to-red-500",
  delay = 0,
  className = "",
}: Props) {
  const valueText =
    typeof value === "number" ? value.toLocaleString() : String(value);

  const isNum = typeof change === "number";
  const changeText = isNum ? `${change}%` : change;
  const changeColor =
    isNum && change !== 0
      ? change > 0
        ? "bg-white/20 text-emerald-100"
        : "bg-white/20 text-red-100"
      : "bg-white/20 text-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      /** ⬇️ la card **no baja** de 221px de ancho */
      className={`h-full min-w-[221px] ${className}`}
    >
      <div className="relative h-full overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-90`} />
        <div className="relative flex h-full flex-col justify-between p-6 text-white">
          <div className="flex h-full items-center justify-between gap-4">
            <div className="flex h-full min-w-0 flex-col justify-between">
              <p className="mb-1 truncate text-sm text-white/80">{title}</p>
              <p className="mb-2 truncate text-3xl font-bold">{valueText}</p>

              {typeof changeText !== "undefined" && changeText !== null && (
                <span className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-[2px] text-xs ${changeColor}`}>
                  {isNum ? (Number(change) >= 0 ? "↗" : "↘") : "•"}
                  {changeText}
                </span>
              )}
            </div>

            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="shrink-0 rounded-full bg-white/20 p-4"
            >
              <Icon className="h-8 w-8" />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

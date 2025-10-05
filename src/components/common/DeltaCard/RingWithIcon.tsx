"use client";

import React from "react";

type Variant =
  | { imgSrc: string; Icon?: never }
  | {
      Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
      imgSrc?: never;
    };

type Props = {
  ringSize: number;
  ringThickness: number;
  loading: boolean;
  ringBackground: string;
  innerBg: string;
  iconColor: string;
  title: string;
} & Variant;

export default function RingWithIcon({
  ringSize,
  ringThickness,
  loading,
  ringBackground,
  innerBg,
  iconColor,
  title,
  ...variant
}: Props) {
  return (
    <div
      className="relative grid place-items-center rounded-full"
      style={{
        width: ringSize,
        height: ringSize,
        backgroundImage: loading ? "none" : ringBackground,
      }}
    >
      {loading && (
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            borderWidth: ringThickness,
            borderStyle: "solid",
            borderColor: "var(--huelva-primary, #E64E3C)",
            borderTopColor: "transparent",
            borderLeftColor: "transparent",
          }}
          aria-hidden
        />
      )}

      <div
        className="grid place-items-center rounded-full overflow-hidden"
        style={{
          width: ringSize - ringThickness * 2,
          height: ringSize - ringThickness * 2,
          backgroundColor: innerBg,
        }}
      >
        {"imgSrc" in variant ? (
          <img
            src={variant.imgSrc}
            alt={title}
            className="h-12 w-12 object-contain"
            draggable={false}
          />
        ) : (
          <variant.Icon className="h-12 w-12" style={{ color: iconColor }} />
        )}
      </div>
    </div>
  );
}

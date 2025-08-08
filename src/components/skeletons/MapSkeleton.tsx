"use client";

type Props = { height?: number; rounded?: string };

export default function MapSkeleton({ height = 260, rounded = "rounded-xl" }: Props) {
  return <div className={`skeleton w-full ${rounded}`} style={{ height }} />;
}

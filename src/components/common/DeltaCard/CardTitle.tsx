"use client";

type Props = { title: string };

export default function CardTitle({ title }: Props) {
  return (
    <div
      className="text-center font-bold text-[#E64E3C] leading-tight"
      style={{
        fontSize: 16,
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {title}
    </div>
  );
}

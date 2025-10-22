import Image from "next/image";
import React from "react";

type HeaderProps = {
  title: string;
  subtitle?: string;
  isTown: boolean;
  imgSrc?: string;
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClose: () => void;
};

export default function Header({
  title,
  subtitle,
  isTown,
  imgSrc,
  Icon,
  onClose,
}: HeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className={`h-10 w-10 rounded-full grid place-items-center ${
          isTown
            ? "bg-white ring-1 ring-black/5 dark:ring-white/10"
            : "bg-[#E64E3C]"
        }`}
        data-testid="expanded-icon-badge"
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={title}
            width={24}
            height={24}
            className="object-contain"
            draggable={false}
          />
        ) : Icon ? (
          <Icon
            className={`h-6 w-6 ${
              isTown ? "text-[#E64E3C]" : "text-white"
            } fill-current stroke-current [&_*]:fill-current [&_*]:stroke-current`}
          />
        ) : null}
      </div>
      <div className="flex-1">
        <div className="text-2xl font-bold text-[#E64E3C] leading-none">
          {title}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-tight">
            {subtitle}
          </div>
        )}
      </div>
      <button
        onClick={onClose}
        className="h-8 w-8 rounded-full grid place-items-center bg-white/80 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
        title="Cerrar detalle"
      >
        ✕
      </button>
    </div>
  );
}

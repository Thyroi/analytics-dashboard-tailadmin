import React from "react";

type HeaderProps = {
  title: string;
  isTown: boolean;
  imgSrc?: string;
  Icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClose: () => void;
};

export default function Header({ title, isTown, imgSrc, Icon, onClose }: HeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div
        className={`h-10 w-10 rounded-full grid place-items-center ${
          isTown ? "bg-white ring-1 ring-black/5 dark:ring-white/10" : "bg-[#E64E3C]"
        }`}
        data-testid="expanded-icon-badge"
      >
        {imgSrc ? (
          <img src={imgSrc} alt={title} className="h-6 w-6 object-contain" draggable={false} />
        ) : Icon ? (
          <Icon
            className={`h-6 w-6 ${
              isTown ? "text-[#E64E3C]" : "text-white"
            } fill-current stroke-current [&_*]:fill-current [&_*]:stroke-current`}
          />
        ) : null}
      </div>
      <div className="text-2xl font-bold text-[#E64E3C] flex-1 leading-none">{title}</div>
      <button
        onClick={onClose}
        className="h-8 w-8 rounded-full grid place-items-center bg-white/80 border border-gray-200 hover:bg-white"
        title="Cerrar detalle"
      >
        ✕
      </button>
    </div>
  );
}

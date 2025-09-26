import * as React from "react";
import type { LucideIcon } from "lucide-react";

type HeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
  Icon?: LucideIcon;
  iconColor?: string;
};

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  className = "",
  Icon,
  iconColor = "text-red-600",
}) => {
  return (
    <header
      // ❗️Quito mb-8 y justify-between; dejo un contenedor plano y centrado
      className={`m-0 p-0 flex items-center gap-3 ${className}`}
    >
      {Icon && <Icon className={`w-7 h-7 ${iconColor}`} />}
      <div className="leading-none">
        <h1 className="text-2xl font-medium text-gray-900 dark:text-white leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-snug">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
};

export default Header;

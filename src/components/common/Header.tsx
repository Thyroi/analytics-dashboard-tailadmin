import type { LucideIcon } from "lucide-react";
import * as React from "react";

type HeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
  Icon?: LucideIcon;
  iconColor?: string;
  subtitleColor?: string;
  titleSize?: "xxs" | "xs" | "s" | "sm" | "md" | "lg";
  titleClassName?: string;
};

const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  className = "",
  Icon,
  iconColor = "text-red-600",
  subtitleColor = "text-gray-600 dark:text-gray-400",
  titleSize = "lg",
  titleClassName = "",
}) => {
  const titleSizeClass = {
    xxs: "text-xs",
    xs: "text-sm",
    s: "text-base",
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  }[titleSize ?? "lg"];
  
  return (
    <header className={`m-0 p-0 flex items-center gap-3 ${className}`}>
      {Icon && <Icon className={`w-7 h-7 ${iconColor}`} />}
      <div className="leading-none">
        <h1
          className={`${titleSizeClass} ${titleClassName} text-gray-900 dark:text-white leading-tight`}
        >
          {title}
        </h1>
        {subtitle && (
          <p className={`text-sm mt-1 leading-snug ${subtitleColor}`}>
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
};

export default Header;

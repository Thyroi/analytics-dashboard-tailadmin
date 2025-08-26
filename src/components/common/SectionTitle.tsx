import React from "react";

type SectionTitleProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  className = "",
}) => {
  return (
    <header className={`${className}`}>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
        {title}
      </h3>
      {subtitle && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
      )}
    </header>
  );
};

export default SectionTitle;

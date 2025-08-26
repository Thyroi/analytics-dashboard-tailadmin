import * as React from "react";

type HeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

const Header: React.FC<HeaderProps> = ({ title, subtitle, className = "" }) => {
  return (
    <header className={`mb-8 ${className}`}>
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-1 text-gray-600 dark:text-gray-400">{subtitle}</p>
      )}
    </header>
  );
};

export default Header;

interface ToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ToggleButton({ isOpen, onToggle }: ToggleButtonProps) {
  return (
    <div className="relative flex-shrink-0">
      {/* Animated glow/aura effect - squared */}
      <div className="absolute -inset-1 animate-pulse">
        <div
          className="absolute inset-0 bg-orange-400/30 dark:bg-orange-500/40 rounded-lg animate-ping"
          style={{ animationDuration: "2s" }}
        ></div>
        <div className="absolute inset-0 bg-orange-400/20 dark:bg-orange-500/30 rounded-lg"></div>
      </div>

      <button
        onClick={onToggle}
        className="relative flex-shrink-0 p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all duration-200 border-2 border-orange-400/50 dark:border-orange-500/50 hover:border-orange-500 dark:hover:border-orange-400 shadow-lg shadow-orange-400/25"
        aria-expanded={isOpen}
        aria-label={isOpen ? "Colapsar tabla" : "Expandir tabla"}
      >
        <svg
          className={`w-5 h-5 text-orange-600 dark:text-orange-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>
  );
}

type CenterOverlayProps = {
  centerTop?: string;
  centerBottom?: string;
};

export function CenterOverlay({ centerTop, centerBottom }: CenterOverlayProps) {
  if (!centerTop && !centerBottom) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-tight">
      {centerTop && (
        <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {centerTop}
        </span>
      )}
      {centerBottom && (
        <span className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          {centerBottom}
        </span>
      )}
    </div>
  );
}

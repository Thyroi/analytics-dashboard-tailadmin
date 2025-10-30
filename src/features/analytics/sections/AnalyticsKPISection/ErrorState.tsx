interface ErrorStateProps {
  message: string;
  className?: string;
}

export function ErrorState({ message, className = "" }: ErrorStateProps) {
  return (
    <div
      className={`rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 ${className}`}
    >
      Error cargando KPIs: {message}
    </div>
  );
}

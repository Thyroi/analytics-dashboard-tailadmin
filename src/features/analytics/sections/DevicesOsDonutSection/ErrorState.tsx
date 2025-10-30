import { CHART_HEIGHT } from "./constants";

interface ErrorStateProps {
  message: string;
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div
      className="card bg-analytics-gradient overflow-hidden text-sm text-red-500 flex items-center justify-center"
      style={{ height: CHART_HEIGHT }}
    >
      {message}
    </div>
  );
}

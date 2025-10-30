import { GRID_COLS_CLASS, SKELETON_COUNT, SKELETON_HEIGHT } from "./constants";

interface LoadingStateProps {
  className?: string;
}

export function LoadingState({ className = "" }: LoadingStateProps) {
  return (
    <div className={`grid gap-6 ${GRID_COLS_CLASS} ${className}`}>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div
          key={i}
          className={`${SKELETON_HEIGHT} rounded-2xl bg-gray-100 animate-pulse`}
        />
      ))}
    </div>
  );
}

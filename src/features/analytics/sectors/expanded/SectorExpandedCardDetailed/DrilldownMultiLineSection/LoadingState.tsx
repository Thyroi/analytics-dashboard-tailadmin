interface LoadingStateProps {
  height: number | string;
}

export function LoadingState({ height }: LoadingStateProps) {
  return (
    <div
      className="w-full rounded-md bg-gray-100 dark:bg-gray-700 animate-pulse"
      style={{
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}

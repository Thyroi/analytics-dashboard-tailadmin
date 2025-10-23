/**
 * Table sort button component
 */

type SortField = "visits" | "deltaPct" | "label";
type SortDirection = "asc" | "desc";

interface SortButtonProps {
  field: SortField;
  currentSort: SortField;
  currentDir: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

export function SortButton({
  field,
  currentSort,
  currentDir,
  onSort,
  children,
}: SortButtonProps) {
  const isActive = currentSort === field;

  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 uppercase tracking-wider"
    >
      {children}
      {isActive && (
        <span className="text-red-600">{currentDir === "asc" ? "↑" : "↓"}</span>
      )}
    </button>
  );
}

import { SortButton } from "../SortButton";
import type { SortField, SortDirection } from "./types";

interface TableHeaderProps {
  sortBy: SortField;
  sortDir: SortDirection;
  onSort: (field: SortField) => void;
}

export function TableHeader({ sortBy, sortDir, onSort }: TableHeaderProps) {
  return (
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th className="px-6 py-3 text-left">
          <input
            type="checkbox"
            className="rounded border-gray-300 dark:border-gray-600"
            disabled
          />
        </th>
        <th className="px-6 py-3 text-left">
          <SortButton
            field="label"
            currentSort={sortBy}
            currentDir={sortDir}
            onSort={onSort}
          >
            Página
          </SortButton>
        </th>
        <th className="px-6 py-3 text-left">
          <SortButton
            field="visits"
            currentSort={sortBy}
            currentDir={sortDir}
            onSort={onSort}
          >
            Visitas
          </SortButton>
        </th>
        <th className="px-6 py-3 text-left">
          <SortButton
            field="deltaPct"
            currentSort={sortBy}
            currentDir={sortDir}
            onSort={onSort}
          >
            Cambio
          </SortButton>
        </th>
      </tr>
    </thead>
  );
}

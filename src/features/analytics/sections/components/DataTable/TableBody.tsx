import { TableRow } from "../TableRow";
import type { TableItem } from "./types";
import { MAX_SELECTED_ITEMS } from "./constants";

interface TableBodyProps {
  items: TableItem[];
  selectedPaths: string[];
  onToggle: (path: string) => void;
}

export function TableBody({ items, selectedPaths, onToggle }: TableBodyProps) {
  return (
    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
      {items.map((item) => {
        const isSelected = selectedPaths.includes(item.path);
        const isDisabled = !isSelected && selectedPaths.length >= MAX_SELECTED_ITEMS;

        return (
          <TableRow
            key={item.path}
            item={item}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onToggle={onToggle}
          />
        );
      })}
    </tbody>
  );
}

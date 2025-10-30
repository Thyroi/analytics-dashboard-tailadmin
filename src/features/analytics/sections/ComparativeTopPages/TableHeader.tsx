import { colorForPath } from "@/lib/analytics/colors";
import { SelectedPills } from "../components/SelectedPills";
import { SearchBar } from "./SearchBar";
import { ToggleButton } from "./ToggleButton";

interface TableHeaderProps {
  isTableOpen: boolean;
  onToggle: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedPaths: string[];
  pillColors: Record<string, string>;
  onPillRemove: (path: string) => void;
}

export function TableHeader({
  isTableOpen,
  onToggle,
  searchTerm,
  onSearchChange,
  selectedPaths,
  pillColors,
  onPillRemove,
}: TableHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
      {/* Row 1: Title + Toggle Button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Páginas Top
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Selecciona páginas para comparar (máximo 8)
          </p>
        </div>

        <ToggleButton isOpen={isTableOpen} onToggle={onToggle} />
      </div>

      {/* Row 2: Search Bar */}
      <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />

      {/* Row 3: Selected Pills */}
      {selectedPaths.length > 0 && (
        <SelectedPills
          selectedPaths={selectedPaths}
          pillColors={pillColors}
          colorForPath={colorForPath}
          onPillRemove={onPillRemove}
        />
      )}
    </div>
  );
}

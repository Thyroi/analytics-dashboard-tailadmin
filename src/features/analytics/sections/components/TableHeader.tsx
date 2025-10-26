/**
 * Table header with search functionality
 */

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface TableHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export function TableHeader({ searchTerm, onSearchChange }: TableHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar páginas..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent w-full"
        />
      </div>
    </div>
  );
}

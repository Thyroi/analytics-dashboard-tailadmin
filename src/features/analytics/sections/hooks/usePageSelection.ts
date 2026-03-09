/**
 * Hook for managing page selection state (max 8 items)
 */

import { getContrastingColors } from "@/lib/analytics/colors";
import { useCallback, useEffect, useMemo, useState } from "react";

interface UsePageSelectionOptions {
  topItems?: Array<{ path: string }>;
  autoSelectCount?: number;
}

export function usePageSelection(options: UsePageSelectionOptions = {}) {
  const { topItems = [], autoSelectCount = 5 } = options;
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

  // Auto-select top N on first load and keep selection valid across dataset changes
  useEffect(() => {
    if (topItems.length === 0) {
      return;
    }

    const availablePaths = new Set(topItems.map((item) => item.path));
    const topPaths = topItems
      .slice(0, Math.min(autoSelectCount, 8))
      .map((item) => item.path);

    setSelectedPaths((prev) => {
      const stillAvailable = prev.filter((path) => availablePaths.has(path));

      if (stillAvailable.length > 0) {
        return stillAvailable;
      }

      return topPaths;
    });
  }, [topItems, autoSelectCount]);

  // Handle selection toggle
  const handleItemToggle = useCallback((path: string) => {
    setSelectedPaths((prev) => {
      const isSelected = prev.includes(path);

      if (isSelected) {
        // Deselect
        return prev.filter((p) => p !== path);
      } else {
        // Select (if under limit)
        if (prev.length >= 8) {
          return prev; // Don't add if at limit
        }
        return [...prev, path];
      }
    });
  }, []);

  // Handle pill removal
  const handlePillRemove = useCallback((path: string) => {
    setSelectedPaths((prev) => prev.filter((p) => p !== path));
  }, []);

  // Memoize contrasting colors for pills to match chart colors
  const pillColors = useMemo(() => {
    return getContrastingColors(selectedPaths);
  }, [selectedPaths]);

  return {
    selectedPaths,
    pillColors,
    handleItemToggle,
    handlePillRemove,
  };
}

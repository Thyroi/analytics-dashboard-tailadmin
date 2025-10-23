/**
 * Hook for managing page selection state (max 8 items)
 */

import { getContrastingColors } from "@/lib/analytics/colors";
import { useCallback, useMemo, useState } from "react";

export function usePageSelection() {
  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);

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

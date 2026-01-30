/**
 * Example: Using the new useChatbotCategoryTotals hook
 *
 * This file demonstrates the correct pattern for using the refactored
 * category totals hook with handler-based refetching (NO useEffect).
 */

import type { Granularity } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";
import {
  useChatbotCategoryHandlers,
  useChatbotCategoryTotals,
} from "../hooks/useChatbotCategoryTotals";

/**
 * Example component showing best practices
 */
export function ExampleCategoryDisplay() {
  // Local state for controls
  const [granularity, setGranularity] = useState<Granularity>("d");
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Get handlers for invalidation/refetch
  const handlers = useChatbotCategoryHandlers();

  // Main hook - fetches automatically when params change
  const { categories, isLoading, isError, error, meta } =
    useChatbotCategoryTotals({
      granularity,
      startDate,
      endDate,
    });

  // Handler pattern 1: Granularity change
  const handleGranularityChange = (newGranularity: Granularity) => {
    setGranularity(newGranularity);
    // Invalidate queries to ensure fresh fetch
    handlers.onGranularityChange();
  };

  // Handler pattern 2: Date range change
  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    // Invalidate queries to ensure fresh fetch
    handlers.onRangeChange();
  };

  // Handler pattern 3: Clear range
  const handleClearRange = () => {
    setStartDate(null);
    setEndDate(null);
    // Invalidate queries to ensure fresh fetch
    handlers.onClearRange();
  };

  // Handler pattern 4: Manual refresh
  const handleRefresh = () => {
    handlers.onRefresh();
  };

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  if (isError) {
    return <div>Error: {error?.message || "Unknown error"}</div>;
  }

  return (
    <div>
      {/* Controls */}
      <div className="controls">
        <select
          value={granularity}
          onChange={(e) =>
            handleGranularityChange(e.target.value as Granularity)
          }
        >
          <option value="d">Day</option>
          <option value="w">Week</option>
          <option value="m">Month</option>
          <option value="y">Year</option>
        </select>

        <button onClick={handleClearRange}>Clear Range</button>
        <button onClick={handleRefresh}>Refresh</button>
      </div>

      {/* Meta info */}
      {meta && (
        <div className="meta">
          <p>Granularity: {meta.granularity}</p>
          <p>
            Current: {meta.range.current.start} to {meta.range.current.end}
          </p>
          <p>
            Previous: {meta.range.previous.start} to {meta.range.previous.end}
          </p>
        </div>
      )}

      {/* Categories grid */}
      <div className="categories-grid">
        {categories.map((category) => (
          <div key={category.id} className="category-card">
            <Image
              src={category.iconSrc}
              alt={category.label}
              width={32}
              height={32}
            />
            <h3>{category.label}</h3>
            <p>Current: {category.currentValue}</p>
            <p>Previous: {category.previousValue}</p>
            <p>Delta: {category.delta}</p>
            <p>
              Delta %:{" "}
              {category.deltaPercent !== null
                ? `${category.deltaPercent.toFixed(1)}%`
                : "N/A"}
            </p>
          </div>
        ))}
      </div>

      {/* Note: ALL 13 categories will always be displayed */}
      <p className="note">Showing {categories.length} categories (all)</p>
    </div>
  );
}

/**
 * ❌ ANTI-PATTERN: What NOT to do
 */
export function BadExample() {
  const [granularity, setGranularity] = useState<Granularity>("d");
  const { categories, refetch } = useChatbotCategoryTotals({ granularity });

  // ❌ DON'T DO THIS: useEffect to trigger refetch
  // This is unnecessary and creates extra renders
  /*
  useEffect(() => {
    refetch();
  }, [granularity, refetch]);
  */

  // ✅ Instead, React Query automatically refetches when granularity changes
  // because it's part of the query key

  return <div>{categories.length} categories</div>;
}

/**
 * Key Principles:
 *
 * 1. ✅ State changes (setGranularity, setStartDate) trigger automatic refetch
 *    because they're in the query key
 *
 * 2. ✅ Handlers (onGranularityChange, etc.) invalidate cache to ensure
 *    fresh data after state changes
 *
 * 3. ❌ NO useEffect needed - React Query handles all reactivity
 *
 * 4. ✅ All 13 categories always rendered (no filtering)
 *
 * 5. ✅ deltaPercent can be null - always check before displaying
 */

/**
 * Integration with existing context (TagTimeContext)
 */
export function ExampleWithContext() {
  // If using TagTimeContext, you already have state + setters
  // Just need to add handler calls

  /*
  const { granularity, startDate, endDate, setGranularity } = useTagTimeframe();
  const handlers = useChatbotCategoryHandlers();

  const { categories } = useChatbotCategoryTotals({
    granularity,
    startDate: startDate?.toISOString().split('T')[0] || null,
    endDate: endDate?.toISOString().split('T')[0] || null,
  });

  // Wrap setter with handler
  const handleGranularityChange = (g: Granularity) => {
    setGranularity(g);
    handlers.onGranularityChange();
  };
  */

  return <div>See ChatbotCategoriesSection for full implementation</div>;
}

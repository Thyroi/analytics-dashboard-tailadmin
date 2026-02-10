/**
 * Manual test scenarios for chatbot category totals refactor
 * Run these in browser console or as integration tests
 */

import { fetchChatbotCategoryTotals } from "@/lib/services/chatbot/categoryTotals";
import type { Granularity } from "@/lib/types";

// Test 1: Basic fetch with default params
export async function testBasicFetch() {
  console.log("🧪 Test 1: Basic fetch with granularity='d'");

  try {
    const result = await fetchChatbotCategoryTotals({
      granularity: "d",
    });

    console.log("✅ Categories count:", result.categories.length);
    console.log("✅ Expected 13 categories:", result.categories.length === 13);
    console.log("✅ Meta info:", result.meta);

    return result;
  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  }
}

// Test 2: Verify all categories present (even with 0 data)
export async function testAllCategoriesPresent() {
  console.log("🧪 Test 2: All categories should be present");

  const result = await fetchChatbotCategoryTotals({ granularity: "w" });

  const expectedCategories: string[] = [
    "naturaleza",
    "fiestasTradiciones",
    "playas",
    "espaciosMuseisticos",
    "patrimonio",
    "rutasCulturales",
    "rutasSenderismo",
    "sabor",
    "donana",
    "circuitoMonteblanco",
    "laRabida",
    "lugaresColombinos",
    "otros",
  ];

  const categoryIds = result.categories.map((c) => c.id as string);
  const allPresent = expectedCategories.every((id) => categoryIds.includes(id));

  console.log("✅ All expected categories present:", allPresent);
  console.log("Categories:", categoryIds);

  return allPresent;
}

// Test 3: Verify deltaPercent is null when prev=0
export async function testDeltaPercentNull() {
  console.log("🧪 Test 3: deltaPercent should be null when prev=0");

  const result = await fetchChatbotCategoryTotals({ granularity: "m" });

  const categoriesWithZeroPrev = result.categories.filter(
    (c) => c.prevTotal === 0,
  );

  const allNullDelta = categoriesWithZeroPrev.every(
    (c) => c.deltaPercent === null,
  );

  console.log("✅ Categories with prev=0:", categoriesWithZeroPrev.length);
  console.log("✅ All have deltaPercent=null:", allNullDelta);

  categoriesWithZeroPrev.forEach((c) => {
    console.log(
      `  - ${c.label}: current=${c.currentTotal}, prev=${c.prevTotal}, delta%=${c.deltaPercent}`,
    );
  });

  return allNullDelta;
}

// Test 4: Verify custom date range
export async function testCustomDateRange() {
  console.log("🧪 Test 4: Custom date range");

  const result = await fetchChatbotCategoryTotals({
    granularity: "d",
    startDate: "2024-01-01",
    endDate: "2024-01-07",
  });

  console.log("✅ Range info:", result.meta.range);
  console.log("✅ Current range:", result.meta.range.current);
  console.log("✅ Previous range:", result.meta.range.previous);

  return result;
}

// Test 5: Verify different granularities
export async function testGranularities() {
  console.log("🧪 Test 5: Different granularities");

  const granularities: Granularity[] = ["d", "w", "m", "y"];

  for (const g of granularities) {
    const result = await fetchChatbotCategoryTotals({ granularity: g });
    console.log(`✅ Granularity ${g}:`, {
      categories: result.categories.length,
      current: result.meta.range.current,
      previous: result.meta.range.previous,
    });
  }
}

// Test 6: Verify error handling (timeout)
export async function testErrorHandling() {
  console.log("🧪 Test 6: Error handling (this should handle gracefully)");

  try {
    // This might timeout or fail depending on API
    const result = await fetchChatbotCategoryTotals({
      granularity: "y",
      startDate: "2020-01-01",
      endDate: "2023-12-31",
    });

    console.log("✅ Request succeeded:", result.categories.length);
  } catch (error) {
    console.log("✅ Error caught:", (error as Error).message);
    console.log("✅ Is timeout?", (error as Error).message.includes("Timeout"));
  }
}

// Test 7: Verify synonym mapping in real data
export async function testSynonymMapping() {
  console.log("🧪 Test 7: Synonym mapping (requires real API data)");

  const result = await fetchChatbotCategoryTotals({ granularity: "w" });

  // Find fiestasTradiciones category
  const fiestas = result.categories.find((c) => c.id === "fiestasTradiciones");

  if (fiestas) {
    console.log("✅ Fiestas category found:");
    console.log(`  - Label: ${fiestas.label}`);
    console.log(`  - Current: ${fiestas.currentTotal}`);
    console.log(`  - Previous: ${fiestas.prevTotal}`);
    console.log(`  - Delta %: ${fiestas.deltaPercent}`);
    console.log(
      "  - Note: This should include data from 'fiestas' and 'fiestas_y_tradiciones' tokens",
    );
  }

  return fiestas;
}

// Run all tests
export async function runAllTests() {
  console.log("🚀 Running all tests...\n");

  try {
    await testBasicFetch();
    console.log("");

    await testAllCategoriesPresent();
    console.log("");

    await testDeltaPercentNull();
    console.log("");

    await testCustomDateRange();
    console.log("");

    await testGranularities();
    console.log("");

    await testSynonymMapping();
    console.log("");

    await testErrorHandling();
    console.log("");

    console.log("✅ All tests completed!");
  } catch (error) {
    console.error("❌ Test suite failed:", error);
  }
}

// Export individual tests for manual execution
export const tests = {
  testBasicFetch,
  testAllCategoriesPresent,
  testDeltaPercentNull,
  testCustomDateRange,
  testGranularities,
  testErrorHandling,
  testSynonymMapping,
  runAllTests,
};

/**
 * Usage in browser console:
 *
 * import { tests } from './test-category-totals';
 *
 * // Run all tests
 * await tests.runAllTests();
 *
 * // Or run individual tests
 * await tests.testBasicFetch();
 * await tests.testAllCategoriesPresent();
 *
 */

// Script para testear rangos temporales
import { computeRangesFromQuery } from "./src/lib/utils/timeWindows.js";

console.log("=== Testing Time Ranges ===");

// Test con endDate = 2025-10-09 (como en tu ejemplo)
const endDate = "2025-10-09";

console.log("\n1. g=w (week):");
try {
  const weekRanges = computeRangesFromQuery("w", null, endDate);
  console.log("current:", weekRanges.current);
  console.log("previous:", weekRanges.previous);
  console.log("Expected current: 2025-10-03 .. 2025-10-09");
  console.log("Expected previous: 2025-10-02 .. 2025-10-08");
} catch (e) {
  console.log("Error:", e.message);
}

console.log("\n2. g=m (month):");
try {
  const monthRanges = computeRangesFromQuery("m", null, endDate);
  console.log("current:", monthRanges.current);
  console.log("previous:", monthRanges.previous);
  console.log("Expected current: 2025-09-10 .. 2025-10-09");
  console.log("Expected previous: 2025-09-09 .. 2025-10-08");
} catch (e) {
  console.log("Error:", e.message);
}

console.log("\n3. g=y (year):");
try {
  const yearRanges = computeRangesFromQuery("y", null, endDate);
  console.log("current:", yearRanges.current);
  console.log("previous:", yearRanges.previous);
  console.log("Expected current: 2024-10-10 .. 2025-10-09");
  console.log("Expected previous: 2024-10-09 .. 2025-10-08");
} catch (e) {
  console.log("Error:", e.message);
}

console.log("\n4. g=d (day as week):");
try {
  const dayRanges = computeRangesFromQuery("d", null, endDate);
  console.log("current:", dayRanges.current);
  console.log("previous:", dayRanges.previous);
  console.log("Expected current: 2025-10-03 .. 2025-10-09");
  console.log("Expected previous: 2025-10-02 .. 2025-10-08");
} catch (e) {
  console.log("Error:", e.message);
}

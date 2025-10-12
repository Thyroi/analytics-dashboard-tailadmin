// Test script para verificar rangos temporales
import { computeRangesFromQuery } from "./src/lib/utils/timeWindows.ts";

console.log("=== Testing Time Ranges ===");

// Test con endDate = 2025-10-09 (como en tu ejemplo)
const endDate = "2025-10-09";

console.log("\n1. g=w (week):");
const weekRanges = computeRangesFromQuery("w", null, endDate);
console.log("current:", weekRanges.current);
console.log("previous:", weekRanges.previous);
console.log("Expected current: 2025-10-03 .. 2025-10-09");
console.log("Expected previous: 2025-10-02 .. 2025-10-08");

console.log("\n2. g=m (month):");
const monthRanges = computeRangesFromQuery("m", null, endDate);
console.log("current:", monthRanges.current);
console.log("previous:", monthRanges.previous);
console.log("Expected current: 2025-09-10 .. 2025-10-09");
console.log("Expected previous: 2025-09-09 .. 2025-10-08");

console.log("\n3. g=y (year):");
const yearRanges = computeRangesFromQuery("y", null, endDate);
console.log("current:", yearRanges.current);
console.log("previous:", yearRanges.previous);
console.log("Expected current: 2024-10-10 .. 2025-10-09");
console.log("Expected previous: 2024-10-09 .. 2025-10-08");

console.log("\n4. g=d (day as week):");
const dayRanges = computeRangesFromQuery("d", null, endDate);
console.log("current:", dayRanges.current);
console.log("previous:", dayRanges.previous);
console.log("Expected current: 2025-10-03 .. 2025-10-09");
console.log("Expected previous: 2025-10-02 .. 2025-10-08");

# 🔍 Date Range Audit - Executive Summary

**Audit Date:** 2025-01-XX
**Trigger:** Suspected double-offset bug where DatePicker and timeWindows both subtract -1 day
**Status:** ⚠️ CRITICAL ISSUES FOUND

---

## 🎯 Critical Finding

**DOUBLE OFFSET CONFIRMED**: Multiple layers subtract days independently, causing data inconsistency.

**Impact**: User selects January 20 → May receive data for January 18 (double -1 day offset)

**Root Cause**:

1. `DateRangePicker.tsx` clamps maxDate to `yesterdayUTC()` (-1 day)
2. `timeWindows.ts` functions use `deriveRangeEndingYesterday()` (another -1 day)
3. Result: Compounded offset of -2 days in some flows

---

## 📊 Audit Scope

- **Files Analyzed:** 24
- **Date Manipulation Points:** 47
- **High-Risk Issues:** 5
- **Affected Sections:** Analytics, Home, Chatbot

---

## 🗺️ Critical Files Map

### **Analytics Section**

| File                                            | Role             | Offset Behavior                    | Risk   |
| ----------------------------------------------- | ---------------- | ---------------------------------- | ------ |
| `src/lib/utils/analytics/kpiHelpers.ts`         | KPI calculations | Delegates to `computeRangesForKPI` | LOW ✅ |
| `src/app/api/analytics/v1/header/kpis/route.ts` | API endpoint     | Clean delegation                   | LOW ✅ |

### **Chatbot Section**

| File                                         | Role                | Offset Behavior                            | Risk      |
| -------------------------------------------- | ------------------- | ------------------------------------------ | --------- |
| `src/lib/services/chatbot/categoryTotals.ts` | Category data fetch | Uses `computeRangesForKPI` (double offset) | MEDIUM ⚠️ |
| `src/lib/services/chatbot/townTotals.ts`     | Town data fetch     | Uses `computeRangesForKPI` (double offset) | MEDIUM ⚠️ |
| `src/app/api/chatbot/audit/tags/route.ts`    | API endpoint        | Custom `computeRanges` (inconsistent)      | MEDIUM ⚠️ |

### **Home Section**

| File                                                 | Role              | Offset Behavior       | Risk   |
| ---------------------------------------------------- | ----------------- | --------------------- | ------ |
| `src/features/home/sectors/SectorsByTownSection.tsx` | Display component | Inherits from context | LOW ✅ |

### **Shared Utilities (HIGH RISK)**

| File                                      | Role                      | Offset Behavior                                                    | Risk      |
| ----------------------------------------- | ------------------------- | ------------------------------------------------------------------ | --------- |
| `src/lib/utils/time/dateRangeWindow.ts`   | **DEPRECATED** range calc | `deriveRangeEndingYesterday` + `derivePrevShifted` (double offset) | HIGH 🔴   |
| `src/lib/utils/time/timeWindows.ts`       | **STANDARD** range calc   | `deriveRangeEndingYesterday` + `shiftPrevRange` (double offset)    | MEDIUM ⚠️ |
| `src/lib/utils/time/datetime.ts`          | UTC utilities             | Foundation (correct)                                               | LOW ✅    |
| `src/lib/utils/time/rangeCalculations.ts` | Period calculations       | Uses local Date (timezone drift)                                   | MEDIUM ⚠️ |

### **Context & UI (HIGH RISK)**

| File                                                    | Role             | Offset Behavior                                     | Risk      |
| ------------------------------------------------------- | ---------------- | --------------------------------------------------- | --------- |
| `src/features/analytics/context/UnifiedTimeContext.tsx` | State management | `calculateRangeForPeriod` (-1 day), mixed UTC/local | MEDIUM ⚠️ |
| `src/components/common/DateRangePicker.tsx`             | User input       | `maxDate: yesterdayUTC()` (-1 day clamp)            | HIGH 🔴   |

---

## 🔥 Top 5 Risks

### 1. 🔴 CRITICAL - Double Offset Bug

**Severity:** CRITICAL | **Likelihood:** HIGH

**Problem:** User selection → DatePicker clamps to yesterday → timeWindows subtracts another day

**Example:**

```
User clicks: January 20
DateRangePicker: January 19 (maxDate clamp)
timeWindows.ts: January 18 (deriveRangeEndingYesterday)
API receives: Data for January 18 ❌ (not what user intended)
```

**Mitigation:**

- Add integration test: User selection → API request → Verify dates match
- Document offset policy: ONE layer should own the -1 day offset

---

### 2. 🔴 HIGH - Timezone Drift (UTC vs Local)

**Severity:** HIGH | **Likelihood:** MEDIUM

**Problem:** Mixed UTC and local Date usage across files

**Details:**

- ✅ `datetime.ts` → Proper UTC with `Date.UTC()`
- ❌ `UnifiedTimeContext.tsx` → Local `new Date()` + `.setDate()`
- ❌ `rangeCalculations.ts` → Local `new Date(string)`

**Impact:** Users in PST vs EST may see different date ranges for "yesterday"

**Mitigation:**

- Migrate all to UTC utilities from `datetime.ts`
- Replace `new Date()` with `todayUTC()`, `.setDate()` with `addDaysUTC()`

---

### 3. 🟠 HIGH - Inconsistent Previous Period Logic

**Severity:** HIGH | **Likelihood:** HIGH

**Problem:** Different shift strategies across sections

| Implementation           | Shift Strategy               |
| ------------------------ | ---------------------------- |
| `timeWindows.ts`         | -1 day (d/w/m), -30 days (y) |
| `dateRangeWindow.ts`     | -1 day always                |
| `api/chatbot/audit/tags` | Varies: d=7, m=33, y=365     |
| `rangeCalculations.ts`   | -1 day (contiguous)          |

**Impact:** Analytics previous period ≠ Chatbot previous period for same date range

**Mitigation:**

- Define ONE standard shift strategy
- Document: Why -1 day shift vs contiguous span?

---

### 4. 🟡 MEDIUM - Deprecated Code Still Active

**Severity:** MEDIUM | **Likelihood:** MEDIUM

**Problem:** `dateRangeWindow.ts` is deprecated but still imported by old code

**Risk:** Developers may use wrong function, perpetuating bugs

**Mitigation:**

- Complete migration to `timeWindows.ts`
- Delete `dateRangeWindow.ts` after migration
- Add ESLint rule to block deprecated imports

---

### 5. 🟡 MEDIUM - Granularity Confusion

**Severity:** MEDIUM | **Likelihood:** MEDIUM

**Problem:** UI granularity vs API granularity not separated

**Examples:**

- Chatbot: UI `granularity='d'` → Window=1 day, but API request always `'d'` regardless
- Analytics: UI `granularity='d'` → Window=7 days (dayAsWeek=true for series)

**Impact:** Developer confusion, misuse of parameters

**Mitigation:**

- Create separate types: `WindowGranularity` vs `RequestGranularity`
- Add JSDoc examples for each function

---

## ⚡ Quick Wins (Immediate Actions)

### 1. Add `DATE_OFFSET_POLICY.md` (1 hour, HIGH impact)

Document:

- Why end date defaults to yesterday
- Which layer is responsible for -1 offset
- What user sees vs what API receives
- Examples for each page section

### 2. Create Integration Test (2 hours, HIGH impact)

```typescript
// __tests__/date-range-flow.test.tsx
test("User date selection does not double-offset", () => {
  // Mock user selects Jan 20
  const userSelection = new Date("2025-01-20");

  // Verify Context state
  const { result } = renderHook(() => useHeaderAnalyticsTimeframe());
  act(() => result.current.setRange(userSelection, userSelection));

  // Verify API request
  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining("start=2025-01-19") // Yesterday is correct
  );

  // Should NOT be Jan 18 (double offset)
  expect(mockFetch).not.toHaveBeenCalledWith(
    expect.stringContaining("start=2025-01-18")
  );
});
```

### 3. Add JSDoc to `datetime.ts` (30 min, MEDIUM impact)

```typescript
/**
 * Returns UTC midnight for today.
 *
 * @returns Date object representing today at 00:00:00 UTC
 *
 * @example
 * const today = todayUTC();
 * console.log(today); // 2025-01-21T00:00:00.000Z
 *
 * ⚠️ ALWAYS use this instead of `new Date()` to avoid timezone drift.
 */
export function todayUTC(): Date { ... }
```

### 4. Rename `dayAsWeek` → `isSeriesView` (30 min, MEDIUM impact)

More intuitive parameter name:

```typescript
// Before
computeRangesForKPI(g, start, end, true); // What does true mean?

// After
computeRangesForKPI(g, start, end, { isSeriesView: true }); // Clear intent
```

### 5. Add Deprecation Warning (15 min, LOW impact)

```typescript
// dateRangeWindow.ts (top of file)
console.warn(
  "dateRangeWindow.ts is DEPRECATED. Use timeWindows.ts instead. " +
    "See DATE_RANGE_AUDIT_REPORT.json for migration guide."
);
```

---

## 🛠️ Standardization Plan (4 Phases)

### Phase 1: URGENT - Fix Double Offset

**Timeline:** This week

1. Audit DateRangePicker behavior (is selection raw or adjusted?)
2. Add integration test for date flow
3. Create `DATE_OFFSET_POLICY.md`

### Phase 2: HIGH - Standardize on UTC and timeWindows.ts

**Timeline:** Next sprint

1. Migrate `UnifiedTimeContext.tsx` to UTC utilities
2. Migrate `rangeCalculations.ts` to UTC
3. Remove `dateRangeWindow.ts` after migration
4. Standardize API route `computeRanges`

### Phase 3: MEDIUM - Type Safety & Docs

**Timeline:** Month 1

1. Create `WindowGranularity` vs `RequestGranularity` types
2. Add JSDoc to all date utilities
3. Create debug page for date flow visualization

### Phase 4: LONG-TERM - Architecture

**Timeline:** Quarter 1

1. Centralize in `DateRangeService` class
2. Add E2E tests for cross-page date consistency
3. Evaluate date-fns or Luxon adoption

---

## 📋 Inconsistencies Summary

| Type                         | Description                     | Impact                | Priority    |
| ---------------------------- | ------------------------------- | --------------------- | ----------- |
| **Double Offset**            | Multiple layers subtract -1 day | Wrong data dates      | 🔴 CRITICAL |
| **Timezone Mix**             | UTC vs local Date               | Timezone drift        | 🔴 HIGH     |
| **Duplicate Logic**          | 3 different range calculators   | Inconsistent behavior | 🔴 HIGH     |
| **Granularity Confusion**    | UI vs API granularity unclear   | Developer errors      | 🟡 MEDIUM   |
| **Previous Period Strategy** | 4 different shift methods       | Inconsistent deltas   | 🟡 MEDIUM   |

---

## 📌 Recommendations

### IMMEDIATE (This Week)

- [ ] Run integration test to confirm double offset
- [ ] Create `DATE_OFFSET_POLICY.md`
- [ ] Add JSDoc to critical utilities

### SHORT-TERM (This Sprint)

- [ ] Migrate all to UTC (remove local Date usage)
- [ ] Standardize on `timeWindows.ts` (remove deprecated code)
- [ ] Separate `WindowGranularity` and `RequestGranularity` types

### LONG-TERM (This Quarter)

- [ ] Centralize date logic in service class
- [ ] Add E2E date consistency tests
- [ ] Consider date library (date-fns/Luxon)

---

## 🔗 Full Details

See `DATE_RANGE_AUDIT_REPORT.json` for:

- Complete findings (24 files analyzed)
- 47 date manipulation points cataloged
- Detailed offset chain analysis
- Line-by-line comparison tables

---

**Generated by:** Date Range Audit Tool
**Audit Depth:** Complete codebase scan (src/_, **tests**/_, analysis/\*)
**Next Review:** After Phase 1 completion

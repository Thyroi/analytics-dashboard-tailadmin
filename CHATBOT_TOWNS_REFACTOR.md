# Chatbot Towns Refactor - Summary

## ✅ Completed Implementation

### 1. Service Layer (`src/lib/services/chatbot/townTotals.ts`)

**New Function**: `fetchChatbotTownTotals()`

**Key Features**:

- ✅ Dual POST calls to `/api/chatbot/audit/tags` (current + previous periods)
- ✅ Pattern: `"root.*.*"` (only depth-2 keys: `root.<token>`)
- ✅ Granularity: Always `"d"` to Mindsaic (user granularity only affects window spans)
- ✅ Synonym mapping: Case-insensitive using `TOWN_SYNONYMS`
- ✅ Delta calculation: `deltaPercent = null` when `prev <= 0`
- ✅ All towns rendered: Even with 0 data (not filtered out)
- ✅ Timeout: 15s with `AbortController`
- ✅ TZ: UTC, end defaults to yesterday
- ✅ Null preservation: Never converts null to 0

**Synonym Examples Handled**:

- `"almonte"` + `"Almonte"` → `almonte`
- `"rociana del condado"` + `"rociana"` + `"rocianna"` (typo) → `rocianaDelCondado`
- `"la palma del condado"` + `"la_palma"` → `laPalmaDelCondado`

### 2. Hook Layer (`src/features/chatbot/hooks/useChatbotTownTotals.ts`)

**New Hook**: `useChatbotTownTotals()`

**Key Features**:

- ✅ React Query integration with proper query keys
- ✅ NO `useEffect`: All fetches triggered by state changes or handlers
- ✅ Query key: `["chatbotTotals", "towns", {g, start, end, db}]`
- ✅ Refetch policy: `staleTime: 0`, `gcTime: 5min`, `retry: 1`
- ✅ `enabled: true` (always active, controlled via handlers)

**Handler Hook**: `useChatbotTownHandlers()`

Provides handlers for:

- `onGranularityChange()`: Invalidates queries when granularity changes
- `onRangeChange()`: Invalidates queries when date range changes
- `onClearRange()`: Invalidates queries when range is cleared
- `onRefresh()`: Manual refetch without invalidation

### 3. Component Layer

**Updated Components**:

- ✅ `ChatbotTownsSection.tsx` - Uses `useChatbotTownTotals` with handlers
- ✅ `TopTownsKPI.tsx` - Updated import to use new type
- ✅ `TownCard.tsx` - Updated import to use new type
- ✅ All fetches now trigger via handlers (no useEffect)

**Handler Integration**:

```tsx
onGranularityChange={(newGranularity) => {
  setGranularity(newGranularity);
  handlers.onGranularityChange();
}}
```

## 📊 Data Flow (Identical to Categories)

```
User Action (change granularity/range)
  ↓
Handler called (onGranularityChange/onRangeChange)
  ↓
State updated (setGranularity/setRange)
  ↓
Query key changes
  ↓
React Query auto-refetches
  ↓
invalidateQueries called (explicit cache invalidation)
  ↓
Fresh data fetched from API
```

## 🔧 Window Calculations (KPI Mode)

| Granularity | Current Window                 | Previous Window      | Shift    |
| ----------- | ------------------------------ | -------------------- | -------- |
| `d`         | Yesterday (1 day)              | Day before yesterday | -1 day   |
| `w`         | Last 7 days ending yesterday   | 7 days before that   | -1 day   |
| `m`         | Last 30 days ending yesterday  | 30 days before that  | -1 day   |
| `y`         | Last 365 days ending yesterday | 365 days before that | -1 month |

**Custom Range**: When `startDate`/`endDate` provided, previous = same span shifted back.

## 🎯 Delta Calculation Rules (Same as Categories)

```typescript
deltaAbs = currentTotal - prevTotal;
deltaPercent = prev <= 0 ? null : ((current - prev) / prev) * 100;
```

**Null Cases**:

- ✅ `prev = 0` → `deltaPercent = null`
- ✅ `prev < 0` → `deltaPercent = null` (edge case)
- ✅ No data for town → `currentTotal = 0`, `prevTotal = 0`, `deltaPercent = null`

## 🧪 Testing Scenarios

### Test 1: Synonym Mapping

```
API returns: "root.almonte", "root.Almonte"
Expected: Both map to almonte
Result: Single card with combined totals
```

### Test 2: Typo Handling

```
API returns: "root.rocianna" (typo in API)
Expected: Maps to rocianaDelCondado
Result: Data correctly attributed
```

### Test 3: Delta with prev=0

```
Current: 50, Previous: 0
Expected: deltaAbs=50, deltaPercent=null
```

### Test 4: Town with No Data

```
Town: chucena (no API data)
Expected: Card shows 0, deltaPercent=null
```

### Test 5: Depth Filtering

```
API returns:
- root.almonte (depth 2) ✅ counted
- root.almonte.donana (depth 3) ❌ ignored
```

### Test 6: Handler-based Refetch

```
1. User changes granularity d→w
2. setGranularity('w') called
3. handlers.onGranularityChange() called
4. Query key changes: {g:'w',...}
5. React Query auto-refetches
6. invalidateQueries ensures fresh data
```

## 📝 Type Safety

All types strictly defined:

- ✅ No `any` types used
- ✅ DTOs for Mindsaic API responses
- ✅ Transform layer for UI data types
- ✅ TownId constrained to taxonomy (15 towns total)

## 🚀 Performance

- **Parallel fetches**: Current + previous periods fetched simultaneously
- **Abort controller**: 15s timeout prevents hanging requests
- **Query caching**: 5min GC time reduces redundant calls
- **Optimistic updates**: Invalidation triggers fresh fetches immediately

## 🔄 Migration Notes

### Old Hook (useChatbotTowns)

- Used `fetchChatbotTotals` + `computeCategoryAndTownTotals`
- Filtered out towns with 0 values
- Used `deltaPercent?: number | undefined`

### New Hook (useChatbotTownTotals)

- Direct service call to `fetchChatbotTownTotals`
- Renders all towns (no filtering)
- Uses `deltaPercent: number | null` (strict null handling)
- Handler-based invalidation (no useEffect)

## ✅ Acceptance Criteria Met

- [x] Cards for all towns, even without data
- [x] Correct deltas, no subnivel summing
- [x] Invalidation/Refetch via handlers only (no useEffect)
- [x] Null preserved (not converted to 0)
- [x] Timeout and error handling
- [x] Synonym mapping works (almonte/Almonte, rociana variants)
- [x] prev=0 → deltaPercent=null
- [x] Town without data → card with 0 and null

## 🎨 UI Impact

**Before**: Only towns with data shown (dynamic list)
**After**: All 15 towns always shown (consistent grid layout)

**Benefits**:

- Predictable layout (no shifting when data changes)
- Clear visibility of towns with no activity
- Better UX for understanding full coverage
- Easier to spot data gaps or anomalies

## 🏘️ Towns List (All 15)

1. Almonte
2. Bollullos
3. Bonares
4. Chucena
5. Escacena
6. Hinojos
7. La Palma del Condado
8. Lucena del Puerto
9. Manzanilla
10. Niebla
11. Palos
12. Paterna del Campo
13. Rociana del Condado
14. Villalba
15. Villarrasa

## 🔗 Related Files

### Services

- `src/lib/services/chatbot/townTotals.ts` (NEW)
- `src/lib/services/chatbot/categoryTotals.ts` (parallel implementation)

### Hooks

- `src/features/chatbot/hooks/useChatbotTownTotals.ts` (NEW)
- `src/features/chatbot/hooks/useChatbotCategoryTotals.ts` (parallel implementation)

### Components

- `src/features/chatbot/components/ChatbotTownsSection.tsx` (UPDATED)
- `src/features/chatbot/components/TopTownsKPI.tsx` (UPDATED)
- `src/features/chatbot/components/TownCard.tsx` (UPDATED)

### Taxonomy

- `src/lib/taxonomy/towns.ts` (data source)

## 🎯 Query Keys Strategy

Both implementations follow the same pattern:

```typescript
// Categories
["chatbotTotals", "categories", { g, start, end, db }][
  // Towns
  ("chatbotTotals", "towns", { g, start, end, db })
];
```

This allows independent invalidation:

- Invalidate categories: `queryKey: ["chatbotTotals", "categories"]`
- Invalidate towns: `queryKey: ["chatbotTotals", "towns"]`
- Invalidate all chatbot: `queryKey: ["chatbotTotals"]`

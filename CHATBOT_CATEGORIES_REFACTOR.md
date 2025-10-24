# Chatbot Categories Refactor - Summary

## ✅ Completed Implementation

### 1. Service Layer (`src/lib/services/chatbot/categoryTotals.ts`)

**New Function**: `fetchChatbotCategoryTotals()`

**Key Features**:

- ✅ Dual POST calls to `/api/chatbot/audit/tags` (current + previous periods)
- ✅ Pattern: `"root.*.*"` (only depth-2 keys: `root.<token>`)
- ✅ Granularity: Always `"d"` to Mindsaic (user granularity only affects window spans)
- ✅ Synonym mapping: Case-insensitive using `CATEGORY_SYNONYMS`
- ✅ Delta calculation: `deltaPercent = null` when `prev <= 0`
- ✅ All categories rendered: Even with 0 data (not filtered out)
- ✅ Timeout: 15s with `AbortController`
- ✅ TZ: UTC, end defaults to yesterday
- ✅ Null preservation: Never converts null to 0

**Synonym Examples Handled**:

- `"fiestas"` + `"fiestas_y_tradiciones"` → `fiestasTradiciones`
- `"espacios_museiticos"` (typo) → `espaciosMuseisticos`
- `"la-rabida"` → `laRabida`

### 2. Hook Layer (`src/features/chatbot/hooks/useChatbotCategoryTotals.ts`)

**New Hook**: `useChatbotCategoryTotals()`

**Key Features**:

- ✅ React Query integration with proper query keys
- ✅ NO `useEffect`: All fetches triggered by state changes or handlers
- ✅ Query key: `["chatbotTotals", "categories", {g, start, end, db}]`
- ✅ Refetch policy: `staleTime: 0`, `gcTime: 5min`, `retry: 1`
- ✅ `enabled: true` (always active, controlled via handlers)

**Handler Hook**: `useChatbotCategoryHandlers()`

Provides handlers for:

- `onGranularityChange()`: Invalidates queries when granularity changes
- `onRangeChange()`: Invalidates queries when date range changes
- `onClearRange()`: Invalidates queries when range is cleared
- `onRefresh()`: Manual refetch without invalidation

### 3. Component Layer (`src/features/chatbot/components/ChatbotCategoriesSection.tsx`)

**Updates**:

- ✅ Replaced `useChatbotCategories` with `useChatbotCategoryTotals`
- ✅ Integrated handlers into `StickyHeaderSection` callbacks
- ✅ Updated `TopCategoriesKPI` import to use new type
- ✅ All fetches now trigger via handlers (no useEffect)

**Handler Integration**:

```tsx
onGranularityChange={(newGranularity) => {
  setGranularity(newGranularity);
  handlers.onGranularityChange();
}}
```

## 📊 Data Flow

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

## 🎯 Delta Calculation Rules

```typescript
deltaAbs = currentTotal - prevTotal;
deltaPercent = prev <= 0 ? null : ((current - prev) / prev) * 100;
```

**Null Cases**:

- ✅ `prev = 0` → `deltaPercent = null`
- ✅ `prev < 0` → `deltaPercent = null` (edge case)
- ✅ No data for category → `currentTotal = 0`, `prevTotal = 0`, `deltaPercent = null`

## 🧪 Testing Scenarios

### Test 1: Synonym Mapping

```
API returns: "root.fiestas", "root.fiestas_y_tradiciones"
Expected: Both map to fiestasTradiciones
Result: Single card with combined totals
```

### Test 2: Delta with prev=0

```
Current: 100, Previous: 0
Expected: deltaAbs=100, deltaPercent=null
```

### Test 3: Category with No Data

```
Category: naturaleza (no API data)
Expected: Card shows 0, deltaPercent=null
```

### Test 4: Depth Filtering

```
API returns:
- root.playas (depth 2) ✅ counted
- root.playas.tarifa (depth 3) ❌ ignored
```

### Test 5: Handler-based Refetch

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
- ✅ CategoryId constrained to taxonomy

## 🚀 Performance

- **Parallel fetches**: Current + previous periods fetched simultaneously
- **Abort controller**: 15s timeout prevents hanging requests
- **Query caching**: 5min GC time reduces redundant calls
- **Optimistic updates**: Invalidation triggers fresh fetches immediately

## 🔄 Migration Notes

### Old Hook (useChatbotCategories)

- Used `fetchChatbotTotals` + `computeCategoryAndTownTotals`
- Filtered out categories with 0 values
- Used `deltaPercent?: number | undefined`

### New Hook (useChatbotCategoryTotals)

- Direct service call to `fetchChatbotCategoryTotals`
- Renders all categories (no filtering)
- Uses `deltaPercent: number | null` (strict null handling)
- Handler-based invalidation (no useEffect)

## ✅ Acceptance Criteria Met

- [x] Cards for all categories, even without data
- [x] Correct deltas, no subnivel summing
- [x] Invalidation/Refetch via handlers only (no useEffect)
- [x] Null preserved (not converted to 0)
- [x] Timeout and error handling
- [x] Synonym mapping works (fiestas + fiestas_y_tradiciones)
- [x] prev=0 → deltaPercent=null
- [x] Category without data → card with 0 and null

## 🎨 UI Impact

**Before**: Only categories with data shown (dynamic list)
**After**: All 13 categories always shown (consistent grid layout)

**Benefits**:

- Predictable layout (no shifting when data changes)
- Clear visibility of categories with no activity
- Better UX for understanding full taxonomy coverage

# Component Structure Refactoring Plan

## 🎯 Goals

- Move frequently reused components to `components/common/`
- Reduce import path complexity
- Eliminate code duplication
- Improve maintainability across features (analytics, home, chatbot)

## 📁 Proposed New Structure

### Move to `components/common/`:

1. **`ChartPair`**

   - From: `features/analytics/sectors/expanded/SectorExpandedCardDetailed/ChartPair.tsx`
   - To: `components/common/ChartPair.tsx`
   - Reason: Used across home, analytics, and chatbot features

2. **`StickyHeaderSection`**

   - From: `features/analytics/sectors/expanded/SectorExpandedCardDetailed/StickyHeaderSection.tsx`
   - To: `components/common/StickyHeaderSection.tsx`
   - Reason: Used in all major sections across features

3. **`SectorsGrid` (Unified)**
   - Merge: `features/home/sectors/SectorsGrid.tsx` + `features/analytics/sectors/SectorsGridDetailed.tsx`
   - To: `components/common/SectorsGrid.tsx`
   - Reason: Same core functionality, just different complexity levels

### Keep in Features (Feature-Specific):

1. **Section Components** - Keep in respective features

   - `AnalyticsByTagSection.tsx`
   - `SectorsByTownSection.tsx`
   - `ChatbotByTagSection.tsx`
   - Reason: Feature-specific business logic and context usage

2. **Expanded Cards** - Keep separate per feature
   - `SectorExpandedCard` (home) - Simple version
   - `SectorExpandedCardDetailed` (analytics) - Complex with drill-down
   - Reason: Different complexity requirements

## 🔄 Migration Steps

### Step 1: Move ChartPair

- Move file to `components/common/ChartPair.tsx`
- Update all imports across features
- Test home, analytics, and chatbot sections

### Step 2: Move StickyHeaderSection

- Move file to `components/common/StickyHeaderSection.tsx`
- Update imports in all section components
- Verify sticky behavior works consistently

### Step 3: Unify SectorsGrid

- Create enhanced `components/common/SectorsGrid.tsx`
- Add props to handle both simple and detailed modes
- Migrate home and analytics to use unified component
- Remove duplicate files

## 📈 Benefits Expected

1. **Reduced Import Complexity**:

   - Before: `@/features/analytics/sectors/expanded/SectorExpandedCardDetailed/ChartPair`
   - After: `@/components/common/ChartPair`

2. **Better Maintainability**:

   - Single source of truth for shared components
   - Easier to update behavior across all features

3. **Consistent UI**:

   - Same component behavior in home, analytics, and chatbot
   - Unified styling and interactions

4. **Easier Testing**:
   - Centralized components easier to unit test
   - Less duplication in test coverage

## ⚠️ Considerations

1. **Breaking Changes**: Will require updating imports across multiple files
2. **Feature Coupling**: Need to ensure common components don't become too complex
3. **Props Interface**: Unified components need flexible props for different use cases

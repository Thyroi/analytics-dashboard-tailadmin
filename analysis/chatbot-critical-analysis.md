# 🤖 CHATBOT FEATURES - ANÁLISIS DE USO CRÍTICO

## 📋 **COMPONENTES CRÍTICOS (MANTENER)**

### **app/(dashboard)/chatbot/page.tsx UTILIZA:**

1. ✅ `CategoryDrilldownView` - Vista drill-down categoría
2. ✅ `ChatbotCategoriesSection` - Sección principal categorías
3. ✅ `ChatbotTownsSection` - Sección principal towns

### **CategoryDrilldownView UTILIZA:**

- ✅ `useCategoryDrilldownReal` hook
- ✅ `ChartPair` (from components/common)

### **ChatbotCategoriesSection UTILIZA:**

- ✅ `DeltaCard` (from components/common)
- ✅ `StickyHeaderSection` (from components/common)
- ✅ `useChatbotCategories` hook
- ✅ `CategoryExpandedCard` (when expanded)
- ✅ `TopCategoriesKPI` (KPI grid)

### **ChatbotTownsSection UTILIZA:**

- ✅ `StickyHeaderSection` (from components/common)
- ✅ `useChatbotTowns` hook
- ✅ `TopTownsKPI` (KPI grid)
- ✅ `TownCard` (individual cards)
- ✅ `TownExpandedCard` (when expanded)

### **OTROS COMPONENTES CRÍTICOS:**

- ✅ `CategoryExpandedCard` - Expansión categoría
- ✅ `TopCategoriesKPI` - KPI grid categorías
- ✅ `TopTownsKPI` - KPI grid towns
- ✅ `TownCard` - Cards individuales towns
- ✅ `TownExpandedCard` - Expansión town

---

## 🗑️ **ARCHIVOS DEMO/DEBUG (ELIMINAR)**

### **components/ - DEMOS y DEBUG:**

- ❌ `CategorySectionWithExpandedDemo.tsx` - DEMO
- ❌ `CompleteIntegrationDemo.tsx` - DEMO
- ❌ `DateBasedGroupedBarDemo.tsx` - DEMO
- ❌ `RealCategoryDrilldownDemo.tsx` - DEMO
- ❌ `DebugDataSection.tsx` - DEBUG
- ❌ `ChatbotDrilldownPanel.tsx` - Posible demo
- ❌ `ChatbotByTagView.tsx` - Posible demo
- ❌ `ChatbotCard.tsx` - Posible sin uso
- ❌ `ChatbotCardSkeleton.tsx` - Posible sin uso
- ❌ `ChatbotDrilldownSkeleton.tsx` - Posible sin uso

### **examples/ - TODA LA CARPETA:**

- ❌ `ChatbotExample.tsx` - EXAMPLE

### **sections/ - VERIFICAR:**

- ⚠️ `ChatbotByTagSection.tsx` - Parece demo
- ⚠️ `ChatbotByTownSection.tsx` - Parece demo

---

## 🔍 **HOOKS CRÍTICOS (MANTENER)**

- ✅ `useCategoryDrilldownReal` - Drill-down categoría
- ✅ `useChatbotCategories` - Lista categorías
- ✅ `useChatbotTowns` - Lista towns
- ⚠️ `useTopCategories` - Verificar uso
- ⚠️ `useTownDetailsChatbot` - Verificar uso
- ⚠️ `useTownsTotalsChatbot` - Verificar uso

---

## 📊 **SERVICIOS Y UTILS - MANTENER SI SE USAN**

- ✅ Mantener servicios que usan los hooks críticos
- ✅ Mantener utils que usan los componentes críticos

---

## 🎯 **PLAN DE LIMPIEZA**

1. ✅ Eliminar carpeta `examples/` completa
2. ✅ Eliminar todos los componentes _Demo_
3. ✅ Eliminar `DebugDataSection`
4. ✅ Verificar uso de `sections/` - probablemente demos
5. ✅ Verificar skeletons y cards sin uso
6. ✅ Limpiar hooks sin uso
7. ✅ Limpiar servicios sin uso

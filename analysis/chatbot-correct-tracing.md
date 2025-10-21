# 🤖 CHATBOT PAGE - TRAZADO CORRECTO DEL FLUJO REAL

## 📋 **FLUJO PRINCIPAL (app/(dashboard)/chatbot/page.tsx)**

### **ESTADO 1: Vista Principal (selectedCategory = null)**

```tsx
<div className="space-y-8">
  <ChatbotCategoriesSection /> ✅ CRÍTICO
  <ChatbotTownsSection /> ✅ CRÍTICO
</div>
```

### **ESTADO 2: Vista Drill-down (selectedCategory != null)**

```tsx
<CategoryDrilldownView
  categoryId={selectedCategory}
  granularity="d"
  onBack={() => setSelectedCategory(null)}
/>
```

- ✅ `CategoryDrilldownView` - CRÍTICO

---

## 🔍 **TRAZADO PASO A PASO**

### **1. ChatbotCategoriesSection**

📁 `src/features/chatbot/components/ChatbotCategoriesSection.tsx`

**IMPORTA DIRECTAMENTE:**

- ✅ `DeltaCard` from "@/components/common/DeltaCard"
- ✅ `StickyHeaderSection` from "@/components/common/StickyHeaderSection"
- ✅ `TagTimeProvider, useTagTimeframe` from "@/features/analytics/context/TagTimeContext"
- ✅ `useChatbotCategories` from "../hooks/useChatbotCategories"
- ✅ `CategoryExpandedCard` from "./CategoryExpandedCard"
- ✅ `TopCategoriesKPI` from "./TopCategoriesKPI"

**COMPONENTES INTERNOS:**

- ✅ `CategoryExpandedCard` - Cuando se expande una categoría
- ✅ `TopCategoriesKPI` - Grid de KPIs en el header

### **2. ChatbotTownsSection**

📁 `src/features/chatbot/components/ChatbotTownsSection.tsx`

**IMPORTA DIRECTAMENTE:**

- ✅ `StickyHeaderSection` from "@/components/common/StickyHeaderSection"
- ✅ `TagTimeProvider, useTagTimeframe` from "@/features/analytics/context/TagTimeContext"
- ✅ `useChatbotTowns` from "../hooks/useChatbotTowns"
- ✅ `TopTownsKPI` from "./TopTownsKPI"
- ✅ `TownCard` from "./TownCard"
- ✅ `TownExpandedCard` from "./TownExpandedCard"

**COMPONENTES INTERNOS:**

- ✅ `TopTownsKPI` - Grid de KPIs towns
- ✅ `TownCard` - Cards individuales de towns
- ✅ `TownExpandedCard` - Cuando se expande un town

### **3. CategoryDrilldownView**

📁 `src/features/chatbot/components/CategoryDrilldownView.tsx`

**IMPORTA DIRECTAMENTE:**

- ✅ `ChartPair` from "@/components/common/ChartPair"
- ✅ `useCategoryDrilldown` from "../hooks/useCategoryDrilldownReal"

---

## ✅ **COMPONENTES CRÍTICOS CONFIRMADOS**

### **Componentes Principales:**

1. ✅ `CategoryDrilldownView` - Vista drill-down
2. ✅ `ChatbotCategoriesSection` - Sección categorías
3. ✅ `ChatbotTownsSection` - Sección towns

### **Componentes de Soporte:**

4. ✅ `CategoryExpandedCard` - Expansión categoría
5. ✅ `TopCategoriesKPI` - KPI grid categorías
6. ✅ `TopTownsKPI` - KPI grid towns
7. ✅ `TownCard` - Cards towns
8. ✅ `TownExpandedCard` - Expansión towns

### **Hooks Críticos:**

- ✅ `useChatbotCategories`
- ✅ `useChatbotTowns`
- ✅ `useCategoryDrilldownReal`

---

## ⚠️ **PENDIENTE DE VERIFICAR**

**Ahora necesito verificar:**

1. Qué hooks usan estos componentes internamente
2. Qué servicios llaman estos hooks
3. Qué otros archivos de chatbot NO están en este flujo

**NO ELIMINAR NADA hasta completar el trazado completo.**

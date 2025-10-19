"use client";

// Categorías de la taxonomía (hardcoded por ahora)
const CATEGORIES = [
  "naturaleza",
  "cultura", 
  "gastronomia",
  "deportes",
  "eventos",
  "alojamiento"
];

interface CategoryData {
  categoryId: string;
  ga4Value: number;
  ga4PrevValue: number;
  chatbotValue: number;
  chatbotPrevValue: number;
  delta: number | null; // null = sin datos suficientes
}

interface CategoryCardProps {
  data: CategoryData;
}

function CategoryCard({ data }: CategoryCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
      <h3 className="font-semibold mb-3 text-lg">{data.categoryId}</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>GA4 Value:</span>
          <span className="font-mono">{data.ga4Value}</span>
        </div>
        
        <div className="flex justify-between">
          <span>GA4 Prev Value:</span>
          <span className="font-mono">{data.ga4PrevValue}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Chatbot Value:</span>
          <span className="font-mono">{data.chatbotValue}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Chatbot Prev Value:</span>
          <span className="font-mono">{data.chatbotPrevValue}</span>
        </div>
        
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Delta:</span>
          {data.delta !== null ? (
            <span className={`font-mono ${data.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.delta > 0 ? '+' : ''}{data.delta}%
            </span>
          ) : (
            <span className="font-mono text-gray-500 text-sm">
              Sin datos suficientes
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface CategoryGridProps {
  categoriesData?: CategoryData[];
}

export default function CategoryGrid({ categoriesData = [] }: CategoryGridProps) {
  // Si no hay datos, crear estructura vacía con todas las categorías
  const displayData = categoriesData.length > 0 
    ? categoriesData 
    : CATEGORIES.map((categoryId: string) => ({
        categoryId,
        ga4Value: 0,
        ga4PrevValue: 0,
        chatbotValue: 0,
        chatbotPrevValue: 0,
        delta: 0
      }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {displayData.map((data: CategoryData) => (
        <CategoryCard key={data.categoryId} data={data} />
      ))}
    </div>
  );
}
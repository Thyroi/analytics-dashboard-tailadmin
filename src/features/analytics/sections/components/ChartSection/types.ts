export interface ChartSectionProps {
  selectedPaths: string[];
  chartData: {
    series: Array<{
      name: string;
      data: Array<{ x: string; y: number }>;
      color: string;
    }>;
    categories: string[];
  } | null;
  formatNumber: (value: number) => string;
  isLoading?: boolean;
}

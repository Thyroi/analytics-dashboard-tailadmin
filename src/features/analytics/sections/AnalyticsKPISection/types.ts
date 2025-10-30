export interface MetricItem {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color?: string;
  delay?: number;
}

export interface AnalyticsKPISectionProps {
  className?: string;
}

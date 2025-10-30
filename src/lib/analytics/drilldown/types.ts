/**
 * Tipos compartidos para URL drilldown
 */

export type DateRange = { start: string; end: string };

export type Totals = {
  activeUsers: number;
  userEngagementDuration: number; // seconds
  newUsers: number;
  eventCount: number;
  sessions: number;
  averageSessionDuration: number; // seconds (ponderado)
};

export type KPIs = Totals & {
  avgEngagementPerUser: number;
  eventsPerSession: number;
};

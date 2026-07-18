export type AnalyticsSourceScope =
  | 'site.neup.estate'
  | 'app.neup.estate'
  | 'site.custom.via.api'
  | 'app.custom.via.api';

export type AnalyticsLevel = 'root' | 'agency' | 'user';

export type AnalyticsMetricTotals = {
  reach: number;
  interactions: number;
  leads: number;
  inquiries: number;
};

export type AnalyticsDailyPoint = {
  date: string;
  Reach: number;
  Interactions: number;
  Leads: number;
  Inquiries: number;
};

export type AnalyticsScopeSummary = {
  scope: AnalyticsSourceScope;
  label: string;
  description: string;
  totals: AnalyticsMetricTotals;
  dailyData: AnalyticsDailyPoint[];
};

export type AnalyticsLevelSummary = {
  level: AnalyticsLevel;
  label: string;
  contextLabel: string;
  scopeSummaries: AnalyticsScopeSummary[];
  totals: AnalyticsMetricTotals;
};

export type AnalyticsDashboardData = {
  periodLabel: string;
  generatedAt: string;
  levels: AnalyticsLevelSummary[];
};

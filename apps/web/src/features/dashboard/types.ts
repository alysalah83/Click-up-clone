export interface DashboardSummary {
  total: number;
  overdue: number;
  completedThisWeek: number;
  timeTrackedThisWeekSec: number;
  timeByMember: { name: string; seconds: number }[];
  workload: { name: string; open: number; done: number }[];
  categories: { open: number; active: number; done: number };
}

export interface Burndown {
  points: { date: string; remaining: number }[];
  total: number;
}

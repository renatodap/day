export interface DailyLog {
  id: string;
  user_id: string;
  date: string;
  deficit: boolean;
  protein: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  logged_at: string;
  workout_type: string | null;
  created_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_value: number | null;
  target_date: string | null;
  achieved: boolean;
  achieved_at: string | null;
  created_at: string;
}

export interface RecurringTask {
  id: string;
  user_id: string;
  name: string;
  day_of_week: number;
  time_hint: string | null;
  weekly_target: number;
  active: boolean;
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  user_id: string;
  task_id: string;
  completed_at: string;
  week_start: string;
  created_at: string;
}

export interface TodayData {
  date: string;
  dayOfWeek: number;
  dailyLog: DailyLog | null;
  weeklyWorkoutCount: number;
  todayWeight: WeightLog | null;
  weekWeights: WeightLog[];
  weightAverage: number | null;
  weightGoal: Goal | null;
  todayTasks: RecurringTask[];
  taskCompletions: Map<string, number>;
  weekData: WeekDay[];
}

export interface WeekDay {
  date: string;
  dayOfWeek: number;
  won: boolean | null; // null = future or no data
  isToday: boolean;
}

export type WinStatus = 'won' | 'not-yet' | 'behind';

export interface PendingChange {
  table: string;
  action: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  timestamp: number;
}

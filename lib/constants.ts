export const WIN_CONDITIONS = {
  deficit: true,
  protein: true,
  weeklyWorkouts: 15,
} as const;

export const GOALS = {
  weight: {
    target: 178,
    targetDate: '2026-02-06',
  },
} as const;

export const DEFAULT_RECURRING_TASKS = [
  {
    name: 'Capstone: Agenda + Presentation',
    day_of_week: 4, // Thursday
    weekly_target: 1,
  },
  {
    name: 'Job Apps',
    day_of_week: 0, // Sunday
    weekly_target: 5,
  },
] as const;

export const WEIGHT_VALIDATION = {
  min: 100,
  max: 400,
  warningDelta: 5,
} as const;

export const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;
export const DAY_FULL_NAMES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

export const MONTH_NAMES = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
] as const;

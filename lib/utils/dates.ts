/**
 * Date utilities with proper timezone handling.
 * All dates stored as UTC in Supabase.
 * "Today" derived from user's local timezone on client.
 */

export function getLocalToday(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

export function getLocalWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  // Monday = 1, Sunday = 0
  // If Sunday (0), go back 6 days to get Monday
  // If Monday (1), stay on same day
  // If Tuesday (2), go back 1 day, etc.
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return monday.toLocaleDateString('en-CA');
}

export function getWeekDates(): string[] {
  const mondayStr = getLocalWeekStart();
  const monday = new Date(mondayStr + 'T00:00:00');

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toLocaleDateString('en-CA');
  });
}

export function getDayOfWeek(): number {
  return new Date().getDay(); // 0=Sun, 1=Mon, etc.
}

export function getDayOfWeekFromDate(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay();
}

export function getDateParts(dateStr: string): { day: number; month: number; year: number } {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    day: d.getDate(),
    month: d.getMonth(),
    year: d.getFullYear(),
  };
}

export function formatDateForDisplay(dateStr: string): {
  dayName: string;
  dayNumber: number;
  monthName: string;
} {
  const d = new Date(dateStr + 'T00:00:00');
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const monthNames = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  return {
    dayName: dayNames[d.getDay()],
    dayNumber: d.getDate(),
    monthName: monthNames[d.getMonth()],
  };
}

export function isToday(dateStr: string): boolean {
  return dateStr === getLocalToday();
}

export function isFuture(dateStr: string): boolean {
  return dateStr > getLocalToday();
}

export function isPast(dateStr: string): boolean {
  return dateStr < getLocalToday();
}

export function getExpectedWorkoutsForDay(dayOfWeek: number): number {
  // dayOfWeek: 0=Sun, 1=Mon, etc.
  // Week runs Mon-Sun
  // Days into week: Mon=1, Tue=2, ..., Sun=7
  const daysIntoWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
  return Math.floor((daysIntoWeek / 7) * 15);
}

export function getDaysUntil(targetDateStr: string): number {
  const today = new Date(getLocalToday() + 'T00:00:00');
  const target = new Date(targetDateStr + 'T00:00:00');
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getWeekStartForDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toLocaleDateString('en-CA');
}

export function getLast7Days(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toLocaleDateString('en-CA');
  });
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface DailyData {
  date: string;
  dayLabel: string;
  weight: number | null;
  deficit: boolean;
  protein: boolean;
  workout: boolean;
}

interface WeightData {
  todayWeight: number | null;
  weekAgoWeight: number | null;
  todayChecks: { deficit: boolean; protein: boolean; workout: boolean };
  weekData: DailyData[];
  isLoading: boolean;
  error: string | null;
  saveWeight: (weight: number) => Promise<void>;
  toggleCheck: (type: 'deficit' | 'protein' | 'workout') => Promise<void>;
}

// Get date in YYYY-MM-DD format
function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

// Get date from N days ago
function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getDateString(date);
}

// Get day label (TODAY, MON, TUE, etc.)
function getDayLabel(dateString: string): string {
  const today = getDateString();
  if (dateString === today) return 'TODAY';

  const date = new Date(dateString + 'T12:00:00');
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[date.getDay()];
}

export function useWeightData(): WeightData {
  const [todayWeight, setTodayWeight] = useState<number | null>(null);
  const [weekAgoWeight, setWeekAgoWeight] = useState<number | null>(null);
  const [todayChecks, setTodayChecks] = useState({ deficit: false, protein: false, workout: false });
  const [weekData, setWeekData] = useState<DailyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const today = getDateString();
  const weekAgo = getDaysAgo(7);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get last 7 days of dates
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        dates.push(getDaysAgo(i));
      }

      // Fetch weights for the week
      const { data: weights, error: weightsError } = await supabase
        .from('weights')
        .select('date, weight')
        .gte('date', dates[dates.length - 1])
        .lte('date', today)
        .order('date', { ascending: false });

      if (weightsError) throw weightsError;

      // Fetch checks for the week
      const { data: checks, error: checksError } = await supabase
        .from('daily_checks')
        .select('date, deficit, protein, workout')
        .gte('date', dates[dates.length - 1])
        .lte('date', today)
        .order('date', { ascending: false });

      if (checksError) throw checksError;

      // Create weight map
      const weightMap = new Map<string, number>();
      weights?.forEach(w => weightMap.set(w.date, w.weight));

      // Create checks map
      const checksMap = new Map<string, { deficit: boolean; protein: boolean; workout: boolean }>();
      checks?.forEach(c => checksMap.set(c.date, {
        deficit: c.deficit ?? false,
        protein: c.protein ?? false,
        workout: c.workout ?? false,
      }));

      // Set today's weight
      setTodayWeight(weightMap.get(today) ?? null);

      // Set 7 days ago weight
      setWeekAgoWeight(weightMap.get(weekAgo) ?? null);

      // Set today's checks
      const todayCheck = checksMap.get(today);
      setTodayChecks(todayCheck ?? { deficit: false, protein: false, workout: false });

      // Build week data
      const week: DailyData[] = dates.map(date => ({
        date,
        dayLabel: getDayLabel(date),
        weight: weightMap.get(date) ?? null,
        ...(checksMap.get(date) ?? { deficit: false, protein: false, workout: false }),
      }));
      setWeekData(week);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, today, weekAgo]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save weight
  const saveWeight = useCallback(async (weight: number) => {
    try {
      const { error } = await supabase
        .from('weights')
        .upsert(
          { date: today, weight },
          { onConflict: 'date' }
        );

      if (error) throw error;

      setTodayWeight(weight);

      // Update week data
      setWeekData(prev => prev.map(d =>
        d.date === today ? { ...d, weight } : d
      ));
    } catch (err) {
      console.error('Error saving weight:', err);
      throw err;
    }
  }, [supabase, today]);

  // Toggle check
  const toggleCheck = useCallback(async (type: 'deficit' | 'protein' | 'workout') => {
    const newValue = !todayChecks[type];
    const newChecks = { ...todayChecks, [type]: newValue };

    try {
      // Optimistic update
      setTodayChecks(newChecks);
      setWeekData(prev => prev.map(d =>
        d.date === today ? { ...d, [type]: newValue } : d
      ));

      const { error } = await supabase
        .from('daily_checks')
        .upsert(
          { date: today, ...newChecks },
          { onConflict: 'date' }
        );

      if (error) throw error;
    } catch (err) {
      // Rollback on error
      console.error('Error toggling check:', err);
      setTodayChecks(todayChecks);
      setWeekData(prev => prev.map(d =>
        d.date === today ? { ...d, [type]: todayChecks[type] } : d
      ));
    }
  }, [supabase, today, todayChecks]);

  return {
    todayWeight,
    weekAgoWeight,
    todayChecks,
    weekData,
    isLoading,
    error,
    saveWeight,
    toggleCheck,
  };
}

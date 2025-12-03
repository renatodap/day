'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getLocalToday, getLocalWeekStart, getDayOfWeek, getExpectedWorkoutsForDay } from '@/lib/utils/dates';
import type { DailyLog, WorkoutLog, WeightLog, Goal, RecurringTask, TaskCompletion, TodayData, WinStatus } from '@/lib/types';

interface UseTodayReturn {
  data: TodayData | null;
  isLoading: boolean;
  error: Error | null;
  winStatus: WinStatus;
  streak: number;
  toggleDeficit: () => Promise<void>;
  toggleProtein: () => Promise<void>;
  addWorkout: () => Promise<void>;
  removeWorkout: () => Promise<void>;
  updateWeight: (weight: number) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useToday(): UseTodayReturn {
  const [data, setData] = useState<TodayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [streak, setStreak] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();
  const today = getLocalToday();
  const weekStart = getLocalWeekStart();
  const dayOfWeek = getDayOfWeek();

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserId(user.id);

      // Fetch all data in parallel
      const [
        dailyLogRes,
        workoutsRes,
        todayWeightRes,
        weekWeightsRes,
        goalRes,
        tasksRes,
        completionsRes,
        weekLogsRes,
      ] = await Promise.all([
        // Today's daily log
        supabase
          .from('daily_logs')
          .select('*')
          .eq('date', today)
          .single(),
        // This week's workouts
        supabase
          .from('workout_logs')
          .select('*')
          .gte('logged_at', weekStart)
          .lt('logged_at', new Date(new Date(weekStart).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('logged_at', { ascending: false }),
        // Today's weight
        supabase
          .from('weight_logs')
          .select('*')
          .eq('date', today)
          .single(),
        // Last 7 days weights
        supabase
          .from('weight_logs')
          .select('*')
          .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date', { ascending: true }),
        // Weight goal
        supabase
          .from('goals')
          .select('*')
          .eq('name', 'weight')
          .single(),
        // Today's recurring tasks
        supabase
          .from('recurring_tasks')
          .select('*')
          .eq('active', true),
        // This week's task completions
        supabase
          .from('task_completions')
          .select('*')
          .eq('week_start', weekStart),
        // This week's daily logs for week ribbon
        supabase
          .from('daily_logs')
          .select('*')
          .gte('date', weekStart)
          .lte('date', new Date(new Date(weekStart).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      ]);

      const dailyLog = dailyLogRes.data as DailyLog | null;
      const workouts = (workoutsRes.data || []) as WorkoutLog[];
      const todayWeight = todayWeightRes.data as WeightLog | null;
      const weekWeights = (weekWeightsRes.data || []) as WeightLog[];
      const weightGoal = goalRes.data as Goal | null;
      const allTasks = (tasksRes.data || []) as RecurringTask[];
      const completions = (completionsRes.data || []) as TaskCompletion[];
      const weekLogs = (weekLogsRes.data || []) as DailyLog[];

      // Filter tasks for today (matching day_of_week or weekly tasks)
      const todayTasks = allTasks.filter(
        (task) => task.day_of_week === dayOfWeek || task.weekly_target > 1
      );

      // Build task completions map
      const taskCompletions = new Map<string, number>();
      completions.forEach((c) => {
        const count = taskCompletions.get(c.task_id) || 0;
        taskCompletions.set(c.task_id, count + 1);
      });

      // Calculate weight average
      const weightAverage =
        weekWeights.length > 0
          ? weekWeights.reduce((sum, w) => sum + Number(w.weight), 0) / weekWeights.length
          : null;

      // Build week data
      const weekDates = getWeekDates(weekStart);
      const weekData = weekDates.map((date) => {
        const log = weekLogs.find((l) => l.date === date);
        const isToday = date === today;
        const isFuture = date > today;

        let won: boolean | null = null;
        if (!isFuture && log) {
          // For past/today with log, check win conditions
          // Note: workout check is approximate for past days
          won = log.deficit && log.protein;
        } else if (!isFuture && !isToday) {
          // Past day without log = loss
          won = false;
        }

        return {
          date,
          dayOfWeek: new Date(date + 'T00:00:00').getDay(),
          won,
          isToday,
        };
      });

      setData({
        date: today,
        dayOfWeek,
        dailyLog,
        weeklyWorkoutCount: workouts.length,
        todayWeight,
        weekWeights,
        weightAverage,
        weightGoal,
        todayTasks,
        taskCompletions,
        weekData,
      });

      // Calculate streak
      try {
        const { data: streakLogs } = await supabase
          .from('daily_logs')
          .select('date, deficit, protein')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(30);

        if (!streakLogs || streakLogs.length === 0) {
          setStreak(0);
        } else {
          let count = 0;
          const todayDate = new Date(today + 'T00:00:00');

          for (let i = 0; i < streakLogs.length; i++) {
            const log = streakLogs[i];
            const expectedDate = new Date(todayDate);
            expectedDate.setDate(todayDate.getDate() - i);
            const expectedDateStr = expectedDate.toLocaleDateString('en-CA');

            if (log.date !== expectedDateStr) {
              break;
            }

            if (log.deficit && log.protein) {
              count++;
            } else {
              break;
            }
          }

          setStreak(count);
        }
      } catch {
        setStreak(0);
      }

    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, today, weekStart, dayOfWeek]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleDeficit = async () => {
    if (!data || !userId) return;

    const newValue = !data.dailyLog?.deficit;

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dailyLog: prev.dailyLog
          ? { ...prev.dailyLog, deficit: newValue }
          : {
              id: '',
              user_id: '',
              date: today,
              deficit: newValue,
              protein: false,
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
      };
    });

    try {
      const { error } = await supabase
        .from('daily_logs')
        .upsert(
          {
            user_id: userId,
            date: today,
            deficit: newValue,
            protein: data.dailyLog?.protein ?? false,
          },
          { onConflict: 'user_id,date' }
        );

      if (error) throw error;
    } catch {
      // Revert on error
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          dailyLog: prev.dailyLog
            ? { ...prev.dailyLog, deficit: !newValue }
            : null,
        };
      });
    }
  };

  const toggleProtein = async () => {
    if (!data || !userId) return;

    const newValue = !data.dailyLog?.protein;

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dailyLog: prev.dailyLog
          ? { ...prev.dailyLog, protein: newValue }
          : {
              id: '',
              user_id: '',
              date: today,
              deficit: false,
              protein: newValue,
              notes: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
      };
    });

    try {
      const { error } = await supabase
        .from('daily_logs')
        .upsert(
          {
            user_id: userId,
            date: today,
            deficit: data.dailyLog?.deficit ?? false,
            protein: newValue,
          },
          { onConflict: 'user_id,date' }
        );

      if (error) throw error;
    } catch {
      // Revert on error
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          dailyLog: prev.dailyLog
            ? { ...prev.dailyLog, protein: !newValue }
            : null,
        };
      });
    }
  };

  const addWorkout = async () => {
    if (!data || !userId) return;

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weeklyWorkoutCount: prev.weeklyWorkoutCount + 1,
      };
    });

    try {
      const { error } = await supabase
        .from('workout_logs')
        .insert({ user_id: userId, logged_at: new Date().toISOString() });

      if (error) throw error;
    } catch {
      // Revert on error
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          weeklyWorkoutCount: prev.weeklyWorkoutCount - 1,
        };
      });
    }
  };

  const removeWorkout = async () => {
    if (!data || !userId || data.weeklyWorkoutCount <= 0) return;

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weeklyWorkoutCount: prev.weeklyWorkoutCount - 1,
      };
    });

    try {
      // Delete most recent workout
      const { data: workouts, error: fetchError } = await supabase
        .from('workout_logs')
        .select('id')
        .gte('logged_at', weekStart)
        .order('logged_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;
      if (!workouts || workouts.length === 0) return;

      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', workouts[0].id);

      if (error) throw error;
    } catch {
      // Revert on error
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          weeklyWorkoutCount: prev.weeklyWorkoutCount + 1,
        };
      });
    }
  };

  const updateWeight = async (weight: number) => {
    if (!data || !userId) return;

    const oldWeight = data.todayWeight;

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const newWeightLog: WeightLog = {
        id: prev.todayWeight?.id || '',
        user_id: prev.todayWeight?.user_id || '',
        date: today,
        weight,
        created_at: prev.todayWeight?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Update week weights for average calculation
      const newWeekWeights = prev.weekWeights.filter((w) => w.date !== today);
      newWeekWeights.push(newWeightLog);
      newWeekWeights.sort((a, b) => a.date.localeCompare(b.date));

      const newAverage =
        newWeekWeights.length > 0
          ? newWeekWeights.reduce((sum, w) => sum + Number(w.weight), 0) / newWeekWeights.length
          : null;

      return {
        ...prev,
        todayWeight: newWeightLog,
        weekWeights: newWeekWeights,
        weightAverage: newAverage,
      };
    });

    try {
      const { error } = await supabase
        .from('weight_logs')
        .upsert({ user_id: userId, date: today, weight }, { onConflict: 'user_id,date' });

      if (error) throw error;
    } catch {
      // Revert on error
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          todayWeight: oldWeight,
        };
      });
    }
  };

  const completeTask = async (taskId: string) => {
    if (!data || !userId) return;

    const currentCount = data.taskCompletions.get(taskId) || 0;

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const newCompletions = new Map(prev.taskCompletions);
      newCompletions.set(taskId, currentCount + 1);
      return { ...prev, taskCompletions: newCompletions };
    });

    try {
      const { error } = await supabase
        .from('task_completions')
        .insert({ user_id: userId, task_id: taskId, week_start: weekStart });

      if (error) throw error;
    } catch {
      // Revert on error
      setData((prev) => {
        if (!prev) return prev;
        const newCompletions = new Map(prev.taskCompletions);
        newCompletions.set(taskId, currentCount);
        return { ...prev, taskCompletions: newCompletions };
      });
    }
  };

  const uncompleteTask = async (taskId: string) => {
    if (!data || !userId) return;

    const currentCount = data.taskCompletions.get(taskId) || 0;
    if (currentCount <= 0) return;

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const newCompletions = new Map(prev.taskCompletions);
      newCompletions.set(taskId, currentCount - 1);
      return { ...prev, taskCompletions: newCompletions };
    });

    try {
      // Delete most recent completion for this task
      const { data: completions, error: fetchError } = await supabase
        .from('task_completions')
        .select('id')
        .eq('task_id', taskId)
        .eq('week_start', weekStart)
        .order('completed_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;
      if (!completions || completions.length === 0) return;

      const { error } = await supabase
        .from('task_completions')
        .delete()
        .eq('id', completions[0].id);

      if (error) throw error;
    } catch {
      // Revert on error
      setData((prev) => {
        if (!prev) return prev;
        const newCompletions = new Map(prev.taskCompletions);
        newCompletions.set(taskId, currentCount);
        return { ...prev, taskCompletions: newCompletions };
      });
    }
  };

  // Calculate win status
  const expectedWorkouts = getExpectedWorkoutsForDay(dayOfWeek);
  const deficit = data?.dailyLog?.deficit ?? false;
  const protein = data?.dailyLog?.protein ?? false;
  const workoutCount = data?.weeklyWorkoutCount ?? 0;

  let winStatus: WinStatus = 'not-yet';
  if (deficit && protein && workoutCount >= expectedWorkouts) {
    winStatus = 'won';
  } else if (workoutCount < expectedWorkouts) {
    winStatus = 'behind';
  }

  return {
    data,
    isLoading,
    error,
    winStatus,
    streak,
    toggleDeficit,
    toggleProtein,
    addWorkout,
    removeWorkout,
    updateWeight,
    completeTask,
    uncompleteTask,
    refetch: fetchData,
  };
}

function getWeekDates(weekStart: string): string[] {
  const monday = new Date(weekStart + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toLocaleDateString('en-CA');
  });
}

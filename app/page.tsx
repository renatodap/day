'use client';

import { useToday } from '@/lib/hooks/use-today';
import { formatDateForDisplay, getExpectedWorkoutsForDay } from '@/lib/utils/dates';
import { LoadingSpinner } from '@/components/loading-spinner';
import { WinStatusCard } from '@/components/win-status';
import { WeekRibbon } from '@/components/week-ribbon';
import { CheckCard } from '@/components/check-card';
import { WorkoutCounter } from '@/components/workout-counter';
import { WeightInput } from '@/components/weight-input';
import { RecurringTaskCard } from '@/components/recurring-task';

export default function HomePage() {
  const {
    data,
    isLoading,
    winStatus,
    streak,
    toggleDeficit,
    toggleProtein,
    addWorkout,
    removeWorkout,
    updateWeight,
    completeTask,
    uncompleteTask,
  } = useToday();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5">
        <p className="text-text-muted">Unable to load data</p>
      </div>
    );
  }

  const { dayName, dayNumber, monthName } = formatDateForDisplay(data.date);
  const deficit = data.dailyLog?.deficit ?? false;
  const protein = data.dailyLog?.protein ?? false;
  const expectedWorkouts = getExpectedWorkoutsForDay(data.dayOfWeek);
  const workoutsOnTrack = data.weeklyWorkoutCount >= expectedWorkouts;

  // Filter tasks for display
  const tasksForToday = data.todayTasks.filter((task) => {
    // Show task if it matches today's day of week
    if (task.day_of_week === data.dayOfWeek) return true;
    // Show weekly tasks (target > 1) on any day if not complete
    if (task.weekly_target > 1) {
      const completions = data.taskCompletions.get(task.id) || 0;
      return completions < task.weekly_target;
    }
    return false;
  });

  return (
    <main className="min-h-screen p-5 safe-top safe-bottom">
      <div className="max-w-md mx-auto space-y-6">
        {/* Week Ribbon */}
        <WeekRibbon weekData={data.weekData} />

        {/* Date Header */}
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-widest text-text-muted">
            {dayName}
          </p>
          <h1 className="text-5xl font-bold my-1">{dayNumber}</h1>
          <p className="text-xs uppercase tracking-widest text-text-muted">
            {monthName}
          </p>
        </div>

        {/* Win Status */}
        <WinStatusCard
          status={winStatus}
          deficit={deficit}
          protein={protein}
          workoutsOnTrack={workoutsOnTrack}
          streak={streak}
        />

        {/* Deficit & Protein Cards */}
        <div className="flex gap-3">
          <CheckCard
            label="Deficit"
            checked={deficit}
            onToggle={toggleDeficit}
          />
          <CheckCard
            label="Protein"
            checked={protein}
            onToggle={toggleProtein}
          />
        </div>

        {/* Workout Counter */}
        <WorkoutCounter
          count={data.weeklyWorkoutCount}
          onAdd={addWorkout}
          onRemove={removeWorkout}
        />

        {/* Weight Input */}
        <WeightInput
          todayWeight={data.todayWeight}
          weekWeights={data.weekWeights}
          average={data.weightAverage}
          goal={data.weightGoal}
          onUpdate={updateWeight}
        />

        {/* Recurring Tasks */}
        {tasksForToday.length > 0 && (
          <>
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs uppercase tracking-widest text-text-subtle">
                Today
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="space-y-3">
              {tasksForToday.map((task) => (
                <RecurringTaskCard
                  key={task.id}
                  task={task}
                  completions={data.taskCompletions.get(task.id) || 0}
                  onComplete={() => completeTask(task.id)}
                  onUncomplete={() => uncompleteTask(task.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Bottom padding for safe area */}
        <div className="h-4" />
      </div>
    </main>
  );
}

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Initialize default data for new users
      await initializeUserData(supabase);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}

async function initializeUserData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check if user already has data
  const { data: existingGoal } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', 'weight')
    .single();

  if (existingGoal) return; // User already initialized

  // Create default weight goal
  await supabase.from('goals').insert({
    user_id: user.id,
    name: 'weight',
    target_value: 178,
    target_date: '2026-02-06',
  });

  // Create default recurring tasks
  await supabase.from('recurring_tasks').insert([
    {
      user_id: user.id,
      name: 'Capstone: Agenda + Presentation',
      day_of_week: 4, // Thursday
      weekly_target: 1,
    },
    {
      user_id: user.id,
      name: 'Job Apps',
      day_of_week: 0, // Sunday
      weekly_target: 5,
    },
  ]);
}

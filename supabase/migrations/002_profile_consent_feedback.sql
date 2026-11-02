alter table public.student_profiles
  add column if not exists guardian_email text,
  add column if not exists guardian_consent_at timestamptz;

alter table public.learning_events
  add column if not exists difficulty text;

create table if not exists public.student_feedback (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  feature text not null,
  rating smallint not null check (rating between 1 and 5),
  tags text[] not null default '{}',
  comment text not null default '',
  created_at timestamptz not null default now()
);

alter table public.student_feedback enable row level security;

drop policy if exists "Students manage their own feedback" on public.student_feedback;
create policy "Students manage their own feedback"
  on public.student_feedback for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

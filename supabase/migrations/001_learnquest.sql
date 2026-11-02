create table if not exists public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  grade smallint not null check (grade between 1 and 12),
  board text not null,
  selected_exams text[] not null default '{}',
  buddy text not null default 'panda',
  buddy_name text not null default 'Panda Professor',
  voice text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.student_notes (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  subject text not null default '',
  topic text not null default '',
  photo_path text,
  updated_at timestamptz not null default now()
);

create table if not exists public.learning_events (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('quiz', 'lesson', 'game')),
  title text not null,
  subject text not null default '',
  topic text not null default '',
  score numeric,
  correct_count integer,
  total_count integer,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

alter table public.student_profiles enable row level security;
alter table public.student_notes enable row level security;
alter table public.learning_events enable row level security;

create policy "Students manage their own profile"
  on public.student_profiles for all to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "Students manage their own notes"
  on public.student_notes for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Students manage their own learning events"
  on public.learning_events for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('note-photos', 'note-photos', false)
on conflict (id) do nothing;

create policy "Students manage their own note photos"
  on storage.objects for all to authenticated
  using (bucket_id = 'note-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'note-photos' and (storage.foldername(name))[1] = auth.uid()::text);

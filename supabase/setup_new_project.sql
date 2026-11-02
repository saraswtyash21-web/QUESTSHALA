
-- ===== supabase/migrations/001_learnquest.sql =====
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

-- ===== supabase/migrations/002_profile_consent_feedback.sql =====
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

-- ===== supabase/migrations/003_auth_profiles.sql =====
alter table public.student_profiles
  add column if not exists avatar_url text,
  add column if not exists preferred_language text not null default 'English',
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

create or replace function public.create_student_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_class text := new.raw_user_meta_data ->> 'class_level';
  requested_board text := new.raw_user_meta_data ->> 'board';
  requested_language text := new.raw_user_meta_data ->> 'preferred_language';
begin
  insert into public.student_profiles (
    id,
    display_name,
    grade,
    board,
    avatar_url,
    preferred_language,
    guardian_consent_at,
    created_at,
    updated_at
  )
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Learner'), 40),
    case
      when requested_class ~ '^(1[0-2]|[1-9])$' then requested_class::smallint
      else 4
    end,
    case
      when requested_board in ('CBSE', 'CISCE (ICSE / ISC)', 'Haryana Board (HBSE)', 'NIOS', 'Other State Board') then requested_board
      else 'CBSE'
    end,
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    case when requested_language in ('English', 'Hindi') then requested_language else 'English' end,
    case when new.raw_user_meta_data ->> 'guardian_consent' = 'true' then now() else null end,
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists create_student_profile_after_signup on auth.users;
create trigger create_student_profile_after_signup
  after insert on auth.users
  for each row execute function public.create_student_profile_for_new_user();

revoke all on function public.create_student_profile_for_new_user() from public, anon, authenticated;

-- ===== supabase/migrations/004_learning_characters.sql =====
alter table public.student_profiles
  add column if not exists selected_character_id text;

update public.student_profiles
set selected_character_id = 'berrus',
    onboarding_complete = true
where selected_character_id is null;

alter table public.student_profiles
  alter column selected_character_id set default 'berrus',
  alter column selected_character_id set not null;

do $$
begin
  alter table public.student_profiles
    drop constraint if exists student_profiles_selected_character_id_check;
  alter table public.student_profiles
    add constraint student_profiles_selected_character_id_check
    check (selected_character_id in (
      'berrus', 'wizzy', 'professor-nova', 'shadow', 'ember', 'astra'
    ));
end;
$$;

-- ===== supabase/migrations/005_expand_learning_characters.sql =====
alter table public.student_profiles
  drop constraint if exists student_profiles_selected_character_id_check;

alter table public.student_profiles
  add constraint student_profiles_selected_character_id_check
  check (selected_character_id in (
    'berrus', 'wizzy', 'professor-nova', 'shadow', 'ember', 'astra',
    'zen', 'luna', 'kai', 'sora', 'rex', 'miko'
  ));

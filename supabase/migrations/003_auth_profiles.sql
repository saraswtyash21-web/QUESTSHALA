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

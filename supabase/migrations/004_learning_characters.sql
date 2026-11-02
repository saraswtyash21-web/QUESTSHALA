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

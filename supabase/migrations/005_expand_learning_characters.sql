alter table public.student_profiles
  drop constraint if exists student_profiles_selected_character_id_check;

alter table public.student_profiles
  add constraint student_profiles_selected_character_id_check
  check (selected_character_id in (
    'berrus', 'wizzy', 'professor-nova', 'shadow', 'ember', 'astra',
    'zen', 'luna', 'kai', 'sora', 'rex', 'miko'
  ));

alter table public.goals
  drop constraint if exists goals_unit_check;

alter table public.goals
  add constraint goals_unit_check
  check (unit in ('atividades', '%', 'R$'));

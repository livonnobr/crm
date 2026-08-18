-- Ritmo CRM: modos de projeção para a Simulação de Metas.
alter table public.goal_simulation_stages
  add column if not exists projection_mode text not null default 'percentual',
  add column if not exists fixed_value numeric(14, 2) not null default 0,
  add column if not exists product_id uuid null references public.services(id) on delete set null,
  add column if not exists conversion_stage_id uuid null;

alter table public.goal_simulation_stages
  drop constraint if exists goal_simulation_stages_projection_mode_check;

alter table public.goal_simulation_stages
  add constraint goal_simulation_stages_projection_mode_check
  check (projection_mode in ('percentual', 'fixo', 'produto'));

alter table public.goal_simulation_stages
  drop constraint if exists goal_simulation_stages_fixed_value_check;

alter table public.goal_simulation_stages
  add constraint goal_simulation_stages_fixed_value_check
  check (fixed_value >= 0);

create index if not exists goal_simulation_stages_product_id_idx on public.goal_simulation_stages(product_id);
create index if not exists goal_simulation_stages_conversion_stage_id_idx on public.goal_simulation_stages(conversion_stage_id);

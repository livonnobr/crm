-- Ritmo CRM: campos monetários e de conversão para a Simulação de Metas.
alter table public.goal_simulation_stages
  add column if not exists conversion_rate numeric(5, 2) not null default 0,
  add column if not exists revenue_base text not null default 'produto',
  add column if not exists average_ticket numeric(14, 2) not null default 0;

alter table public.goal_simulation_stages
  drop constraint if exists goal_simulation_stages_conversion_rate_check;

alter table public.goal_simulation_stages
  add constraint goal_simulation_stages_conversion_rate_check
  check (conversion_rate >= 0 and conversion_rate <= 100);

alter table public.goal_simulation_stages
  drop constraint if exists goal_simulation_stages_revenue_base_check;

alter table public.goal_simulation_stages
  add constraint goal_simulation_stages_revenue_base_check
  check (revenue_base in ('produto', 'ticket'));

alter table public.goal_simulation_stages
  drop constraint if exists goal_simulation_stages_average_ticket_check;

alter table public.goal_simulation_stages
  add constraint goal_simulation_stages_average_ticket_check
  check (average_ticket >= 0);

create index if not exists goal_simulation_stages_revenue_base_idx on public.goal_simulation_stages(revenue_base);

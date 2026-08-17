-- Ritmo CRM: núcleo multiusuário com isolamento por proprietário.
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default 'Meu espaço comercial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  goal_type text not null check (goal_type in ('Prospecção', 'Vendas')),
  target numeric(14, 2) not null check (target > 0),
  actual numeric(14, 2) not null default 0 check (actual >= 0),
  unit text not null check (unit in ('atividades', 'R$')),
  period text not null check (char_length(period) between 1 and 80),
  color text not null default 'emerald' check (color in ('emerald', 'blue', 'amber', 'violet')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.funnels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  currency text not null default 'BRL' check (currency = 'BRL'),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table public.stages (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.funnels(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  color text not null default '#10A97A' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  probability integer not null default 0 check (probability between 0 and 100),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (funnel_id, name),
  unique (funnel_id, position)
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  funnel_id uuid not null references public.funnels(id) on delete cascade,
  stage_id uuid not null references public.stages(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 160),
  company text not null check (char_length(company) between 1 and 120),
  value numeric(14, 2) not null check (value >= 0),
  owner_initials text not null default 'EU' check (char_length(owner_initials) between 1 and 5),
  tag text not null default 'Sem origem' check (char_length(tag) between 1 and 50),
  next_activity text not null default '',
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index goals_workspace_id_idx on public.goals(workspace_id);
create index funnels_workspace_id_idx on public.funnels(workspace_id);
create index stages_funnel_id_idx on public.stages(funnel_id);
create index opportunities_funnel_id_idx on public.opportunities(funnel_id);
create index opportunities_stage_id_idx on public.opportunities(stage_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_set_updated_at before update on public.workspaces for each row execute procedure public.set_updated_at();
create trigger goals_set_updated_at before update on public.goals for each row execute procedure public.set_updated_at();
create trigger funnels_set_updated_at before update on public.funnels for each row execute procedure public.set_updated_at();
create trigger stages_set_updated_at before update on public.stages for each row execute procedure public.set_updated_at();
create trigger opportunities_set_updated_at before update on public.opportunities for each row execute procedure public.set_updated_at();

alter table public.workspaces enable row level security;
alter table public.goals enable row level security;
alter table public.funnels enable row level security;
alter table public.stages enable row level security;
alter table public.opportunities enable row level security;

create policy "workspace_owner_only" on public.workspaces for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "goals_in_owned_workspace" on public.goals for all to authenticated using (exists (select 1 from public.workspaces w where w.id = goals.workspace_id and w.owner_id = auth.uid())) with check (exists (select 1 from public.workspaces w where w.id = goals.workspace_id and w.owner_id = auth.uid()));
create policy "funnels_in_owned_workspace" on public.funnels for all to authenticated using (exists (select 1 from public.workspaces w where w.id = funnels.workspace_id and w.owner_id = auth.uid())) with check (exists (select 1 from public.workspaces w where w.id = funnels.workspace_id and w.owner_id = auth.uid()));
create policy "stages_in_owned_funnel" on public.stages for all to authenticated using (exists (select 1 from public.funnels f join public.workspaces w on w.id = f.workspace_id where f.id = stages.funnel_id and w.owner_id = auth.uid())) with check (exists (select 1 from public.funnels f join public.workspaces w on w.id = f.workspace_id where f.id = stages.funnel_id and w.owner_id = auth.uid()));
create policy "opportunities_in_owned_funnel" on public.opportunities for all to authenticated using (exists (select 1 from public.funnels f join public.workspaces w on w.id = f.workspace_id where f.id = opportunities.funnel_id and w.owner_id = auth.uid())) with check (exists (select 1 from public.funnels f join public.workspaces w on w.id = f.workspace_id and w.owner_id = auth.uid()));

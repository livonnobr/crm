-- Ritmo CRM: etapas próprias da Simulação de Metas, independentes dos funis.
create table if not exists public.goal_simulation_stages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  color text not null default '#10A97A' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  probability integer not null default 0 check (probability between 0 and 100),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goal_simulation_stages_workspace_id_idx on public.goal_simulation_stages(workspace_id);

create trigger goal_simulation_stages_set_updated_at
  before update on public.goal_simulation_stages
  for each row execute procedure public.set_updated_at();

alter table public.goal_simulation_stages enable row level security;

create policy "goal_simulation_stages_in_owned_workspace" on public.goal_simulation_stages
  for all to authenticated
  using (exists (select 1 from public.workspaces w where w.id = goal_simulation_stages.workspace_id and w.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspaces w where w.id = goal_simulation_stages.workspace_id and w.owner_id = auth.uid()));

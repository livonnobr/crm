-- Ritmo CRM: catálogo de serviços por workspace.
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 140),
  deliverables text not null default '',
  deadline integer not null default 1 check (deadline > 0 and deadline <= 3650),
  deadline_unit text not null default 'dias' check (deadline_unit in ('dias', 'semanas', 'meses')),
  price numeric(14, 2) not null default 0 check (price >= 0),
  pricing_type text not null default 'Fixo' check (pricing_type in ('Fixo', 'Mensal', 'A partir de')),
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_workspace_id_idx on public.services(workspace_id);

create trigger services_set_updated_at before update on public.services for each row execute procedure public.set_updated_at();

alter table public.services enable row level security;

create policy "services_in_owned_workspace" on public.services
  for all to authenticated
  using (exists (select 1 from public.workspaces w where w.id = services.workspace_id and w.owner_id = auth.uid()))
  with check (exists (select 1 from public.workspaces w where w.id = services.workspace_id and w.owner_id = auth.uid()));

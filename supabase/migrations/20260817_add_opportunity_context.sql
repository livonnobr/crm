-- Ritmo CRM: contexto operacional da oportunidade inspirado nos registros de negócio do Pipedrive.
alter table public.opportunities
  add column if not exists contact_name text not null default '' check (char_length(contact_name) <= 120),
  add column if not exists contact_role text not null default '' check (char_length(contact_role) <= 120),
  add column if not exists contact_email text not null default '' check (char_length(contact_email) <= 180),
  add column if not exists contact_phone text not null default '' check (char_length(contact_phone) <= 40),
  add column if not exists company_data jsonb not null default '{}'::jsonb,
  add column if not exists activities jsonb not null default '[]'::jsonb,
  add column if not exists notes jsonb not null default '[]'::jsonb;

alter table public.opportunities
  add constraint opportunities_company_data_object check (jsonb_typeof(company_data) = 'object'),
  add constraint opportunities_activities_array check (jsonb_typeof(activities) = 'array'),
  add constraint opportunities_notes_array check (jsonb_typeof(notes) = 'array');

create index if not exists opportunities_contact_email_idx on public.opportunities (contact_email) where contact_email <> '';

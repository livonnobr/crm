# Persistência Supabase — Ritmo CRM

Projeto Supabase conectado: `obusiikzxehefoemuciy` (`crmsupa`).

Tabelas confirmadas em 17/08/2026:

- `conversion_settings`
- `prospect_lists`
- `prospect_records`
- `funnels`
- `stages`
- `opportunities`

As tabelas de prospecção foram criadas com RLS por `workspace_id`, registros vinculados por `list_id`, campo `deleted_at` para a lixeira de 30 dias e `position` para preservar a ordem da planilha. O frontend hidrata os dados ao autenticar e espelha inclusões, edições, exclusões e restaurações no Supabase.

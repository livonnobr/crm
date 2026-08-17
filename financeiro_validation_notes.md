# Validação do Financeiro

## Fonte
A estrutura foi baseada na planilha Google compartilhada pelo usuário: https://docs.google.com/spreadsheets/d/1b8IIYZXtMb_DSOlAPdZoLEf6Z-MBfKL93iCxcNK8BII/edit?usp=sharing

## Persistência Supabase
Projeto: `obusiikzxehefoemuciy`.
Tabela confirmada: `public.finance_entries`.
Colunas verificadas: `id` text, `workspace_id` uuid, `expense` text, `amount` numeric, `installment` text, `due_date` date, `notes` text, `created_at` timestamptz e `updated_at` timestamptz.

## Caso manual de cálculo
Com lançamentos de R$ 100,00 e R$ 250,00, o total lançado esperado é R$ 350,00. O próximo vencimento deve ser a menor data preenchida entre os lançamentos. O indicador de despesas deve corresponder à quantidade de registros ativos. A tela vazia foi validada em desktop e viewport móvel estreita; o painel empilha os cartões e mantém o botão de novo lançamento acessível.

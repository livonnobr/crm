# Publicação externa do Ritmo CRM

- [x] Conferir o deploy ativo do Netlify e republicar a versão correta, se necessário.
- [x] Sincronizar a versão atual no GitHub e publicar a mesma compilação no Netlify.
- [ ] Manter GitHub e Netlify como destinos oficiais de publicação e remover a visibilidade pública no Manus, se a configuração permitir.
- [ ] Corrigir a defasagem entre a versão atual, a branch `ritmo-crm` do GitHub e o deploy do Netlify.
- [x] Reduzir o espaço superior do funil e exibir zonas de decisão Ganho e Perdido durante o arraste.
- [x] Ampliar o painel de detalhes da oportunidade para leitura e edição confortável em desktop.
- [x] Unificar os controles e indicadores do cabeçalho do funil em uma única linha no desktop.
- [x] Garantir a exibição de Ganho e Perdido como destinos ativos durante o arraste de um card.
- [x] Ativar a aba Atividades com uma visão de tarefas comerciais do funil.
- [x] Calibrar as probabilidades das etapas do funil conforme a conversão real de leads até contratos fechados.
- [x] Exibir o faturamento estimado em verde no cabeçalho de cada coluna do funil.

- [x] Implementar a barra lateral recolhível com expansão ao passar o mouse.
- [x] Reduzir o cabeçalho do funil para priorizar o quadro de oportunidades.
- [x] Ampliar o cadastro de oportunidades com atividades, observações e dados de empresa.
- [x] Mapear e priorizar os recursos do Pipedrive aplicáveis ao Ritmo CRM.
- [x] Publicar a evolução de navegação e contexto comercial no Netlify (deploy `6a8350d2315c537372f9964f`).

## Contexto comercial

- [x] Estender a tabela `opportunities` no Supabase com atividades, notas, contato e dados estruturados de empresa.

- [x] Remover a coluna de etapa `Ganho` do quadro de funil.
- [x] Criar uma zona de soltura `Ganhar oportunidade` no rodapé do funil.
- [x] Publicar o ajuste no Netlify.
- [x] Sincronizar a versão atual na branch `ritmo-crm` do GitHub usando a credencial temporária já fornecida e confirmar o commit remoto.

- [x] Criar e identificar o projeto Supabase para a persistência do CRM.
- [x] Migrar o modelo de metas, funis, etapas e oportunidades para o Supabase.
- [x] Integrar a interface do CRM ao Supabase com autenticação por e-mail.
- [x] Conectar a conta Netlify e criar o site do CRM.
- [x] Configurar o SPA e as URLs de redirecionamento de autenticação para o domínio Netlify.
- [x] Sincronizar o CRM na branch `ritmo-crm` do repositório existente `livonnobr/crm`.
- [x] Reenviar a branch `ritmo-crm` usando a credencial temporária fornecida pelo usuário, sem gravá-la no projeto.
- [x] Validar compilação, fluxo de dados e publicação externa no Netlify.
- [ ] Validar o retorno da autenticação por e-mail do Supabase para o domínio público do Netlify com um login real.
- [x] Remover a proteção de acesso do site Netlify para liberar o domínio publicamente, conforme confirmação do usuário.

## Histórico

- [ ] Fluxo de publicação no Vercel interrompido por decisão do usuário; não utilizar esse destino nas próximas etapas.
- [x] Conta Netlify conectada: equipe `livonnobr` (Livonno Time), com upload de arquivo `.zip` disponível na página de projetos.
- [ ] Finalizar o upload da versão `crm-metas-funil-netlify.zip`; o campo de arquivos do Netlify está oculto e não foi aceito pela automação de upload.
- [x] Publicação de produção concluída em `https://jocular-profiterole-c5dafc.netlify.app` (deploy `6a834270315c53ff38f996e7`).
- [x] A URL Netlify respondeu com o título `Ritmo — CRM de Metas e Funil`; falta validar o fluxo de autenticação após registrar o domínio no Supabase.
- [x] Visibilidade `Public` aplicada e confirmada no Netlify para produção e previews.
- [x] Conta GitHub identificada no navegador: `livonnobr`; a credencial local do GitHub CLI foi renovada por autorização de dispositivo.
- [x] Segunda ativação por dispositivo do GitHub CLI concluída, iniciada sem abertura de navegador local, para disponibilizar a credencial ao terminal.
- [x] Incluir `https://jocular-profiterole-c5dafc.netlify.app` nas URLs de redirecionamento de autenticação do projeto Supabase; configuração confirmada pelo usuário no painel Supabase.

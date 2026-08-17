# Publicação externa do Ritmo CRM

- [x] Conferir o deploy ativo do Netlify e republicar a versão correta, se necessário.
- [x] Sincronizar a versão atual no GitHub e publicar a mesma compilação no Netlify.
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
- [x] Renomear o indicador Ponderado para Previsão no funil.
- [x] Corrigir a soltura de oportunidades em Ganho e Perdido para atualizar o negócio e finalizar o arraste.
- [x] Adicionar ícone de lixeira visível em cada card de negócio, com confirmação antes da exclusão.
- [x] Publicar a melhoria da lixeira no GitHub e no Netlify; não usar Manus como destino de produção.
- [ ] Registrar que mudanças de esquema ou dados estruturais devem ser aplicadas no Supabase; mudanças apenas de frontend não exigem nova migração.
- [ ] Definir a fonte de dados para visitas mensais de URLs na nova aba Análise.
- [ ] Pesquisar APIs de estimativa de tráfego para domínios públicos, incluindo histórico mensal e condições de uso.
- [ ] Implementar e publicar a aba Análise no GitHub e no Netlify.
- [ ] Implementar a aba Lista de Prospecção em formato de planilha editável.
- [ ] Adicionar campos de decisor, contato, empresa, site e análise comercial.
- [x] Suportar múltiplas listas de prospecção com nomes e registros independentes.
- [x] Implementar criar, editar, salvar e alternar listas.
- [x] Após a reconexão, validar a sessão do GitHub e enviar o branch `ritmo-crm`.
- [x] Confirmar no remoto que o commit mais recente contém a versão publicada no Netlify.
- [x] Sincronizar a melhoria de múltiplas listas no GitHub, commit `33159175`.
- [x] Confirmar o novo upload da melhoria no Netlify; pacote preparado, painel indisponível durante a tentativa — substituído por deploy direto confirmado.
- [x] Reexecutar o deploy da versão de múltiplas listas no Netlify pela conexão existente.
- [x] Validar a conexão direta do projeto ao Netlify e publicar a versão atual.
- [x] Corrigir o campo de nome da lista para aceitar espaços e permitir valor vazio durante a edição.
- [x] Republicar a correção no GitHub e no Netlify.
- [x] Adicionar exclusão de listas com confirmação e retenção de 30 dias na Lixeira.
- [x] Implementar restauração e exclusão definitiva de listas na Lixeira.
- [x] Publicar a melhoria da Lixeira no GitHub e no Netlify.
- [x] Adicionar exportação da lista ativa em CSV e Excel compatível (.xls).
- [x] Documentar que o salvamento atual é automático no navegador, sem sincronização entre dispositivos.
- [x] Aumentar a altura da área de edição da coluna Análise.
- [x] Configurar Ctrl+Enter para inserir uma linha em branco na Análise.
- [x] Republicar a melhoria no GitHub e no Netlify.
- [x] Inserir novos contatos no topo da Lista de Prospecção.
- [x] Validar e republicar a ordenação dos novos contatos.
- [x] Usar o padrão `Lista - Mês - Sem N` ao criar novas listas de prospecção.
- [x] Validar e republicar o novo padrão de nomes.
- [x] Remover os indicadores de contatos, canais e análises da Lista de Prospecção.
- [x] Exibir apenas o contador de empresas preenchidas e republicar.
- [x] Compactar título, lista ativa e ações da Lista de Prospecção em uma linha.
- [x] Validar responsividade e republicar o cabeçalho compacto.
- [x] Adicionar periodicidade diária, semanal ou mensal ao cadastro de metas.
- [x] Exibir no painel quantos dias faltam para o fim do mês.
- [x] Publicar a melhoria de periodicidade e contagem regressiva no GitHub e no Netlify.
- [x] Permitir vincular metas a etapas e indicadores do funil.
- [x] Atualizar automaticamente o progresso ao movimentar oportunidades entre etapas.
- [x] Usar contagem acumulada: cada oportunidade soma uma vez ao entrar na etapa vinculada.
- [x] Validar e publicar a automação de metas e funil.
- [x] Criar cadastro editável de taxas de conversão para cada etapa do funil.
- [x] Adicionar simulador de leads com projeção automática das etapas seguintes.
- [x] Validar e publicar o simulador de metas, incluindo persistência local e Supabase.
- [x] Criar tabelas Supabase para listas, registros e lixeira de prospecção.
- [x] Hidratar Lista de Prospecção e lixeira a partir do Supabase após autenticação.
- [x] Espelhar automaticamente edições, novas linhas, exclusões e restaurações da Lista no Supabase.
- [x] Espelhar automaticamente inclusões, edições, exclusões de funis, etapas e oportunidades no Supabase.
- [ ] Publicar a persistência completa da Lista e do Funil no GitHub e no Netlify.

## Integração Google Agenda e Meet

- [ ] Auditar o modelo atual de atividades, negócios e conectores Google.
- [ ] Configurar a integração Google Agenda com permissões de calendário e Meet.
- [ ] Sincronizar atividades do CRM com eventos do Google Agenda.
- [ ] Criar reuniões com Google Meet e associar o evento ao card do negócio.
- [ ] Persistir IDs, links e estado de sincronização no Supabase.
- [ ] Validar e publicar a integração no GitHub e no Netlify.

## Integração completa Google Agenda + Meet

- [ ] Fazer upgrade do projeto para full-stack com backend seguro.
- [ ] Adicionar OAuth do Google e secrets privados de Calendar/Meet.
- [ ] Criar esquema Supabase para tokens, eventos e vínculos com negócios.
- [ ] Implementar endpoints de criação, atualização e sincronização de eventos.
- [ ] Criar Google Meet ao gerar atividades do tipo reunião.
- [ ] Exibir e atualizar o link do Meet no card do negócio.
- [ ] Validar a integração com uma conta Google real e publicar no GitHub/Netlify.

- [ ] Integração Google Agenda + Meet: adiada para o fim do backlog conforme prioridade definida pelo usuário.

- [ ] Identificar e executar a próxima solicitação pendente do backlog antes da integração Google Agenda/Meet.

- [x] Renomear visualmente Lista de Prospecção para Empresas e validar o cabeçalho compacto.

## Aba Cadência

- [x] Criar a aba Cadência abaixo de Empresas no menu lateral.
- [x] Implementar uma grade por dias e turnos inspirada no exemplo fornecido.
- [x] Permitir criar, editar, mover e excluir blocos de atividade por arraste.
- [x] Persistir a configuração da Cadência no Supabase e manter fallback local.
- [x] Aplicar o padrão visual ivory, graphite e emerald do Ritmo CRM.
- [x] Validar responsividade e publicar a Cadência no GitHub e no Netlify.
- [x] Validar a aba Cadência em viewport móvel/estreita e ajustar a grade se necessário.

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
- [x] Publicar a persistência completa da Lista e do Funil no GitHub e no Netlify.

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

## Aba Financeiro

- [x] Inspecionar a planilha Google compartilhada e mapear abas, campos, fórmulas e indicadores.
- [x] Definir o modelo financeiro persistente no Supabase.
- [x] Criar a aba Financeiro no menu lateral do CRM.
- [x] Implementar o painel financeiro inspirado na planilha, com entradas editáveis e cálculos automáticos.
- [x] Validar cálculos, responsividade e sincronização com Supabase.
- [x] Publicar a aba Financeiro no GitHub e no Netlify.
- [x] Confirmar no Supabase a criação da tabela `finance_entries` e registrar o esquema aplicado.
- [ ] Validar a aba Financeiro autenticada com leitura, criação, edição e exclusão real no Supabase. (requer interação autenticada real do usuário)
- [x] Validar a aba Financeiro em viewport móvel/estreita e ajustar o layout se necessário.
- [x] Revisar os cálculos automáticos do Financeiro com um caso manual baseado na planilha de origem.
- [x] Publicar a aba Financeiro na branch `ritmo-crm` do GitHub pelo fluxo oficial e confirmar o commit remoto.
- [x] Executar e confirmar o deploy do Financeiro no Netlify com status pronto.
- [x] Validar no domínio público do Netlify a rota `/?aba=financeiro` com a versão atual.

## Correção do deploy público Financeiro
- [x] Diagnosticar por que o domínio Netlify está carregando título sem renderizar o CRM.
- [x] Corrigir o artefato/build enviado ao Netlify, se necessário.
- [x] Refazer o deploy pelo conector Netlify existente.
- [x] Validar a rota pública `/?aba=financeiro` com o painel renderizado.

## Auditoria funcional dos painéis

- [x] Auditar o cadastro e a edição de metas, incluindo período, calendário e seletor de datas.
- [x] Auditar controles desabilitados e ações sem resposta nos painéis Funil, Empresas, Atividades, Cadência e Financeiro.
- [x] Corrigir o seletor de período das metas para usar calendário e opções de periodicidade consistentes.
- [x] Corrigir erros funcionais encontrados nos demais painéis e na persistência.
- [x] Executar testes automatizados e validação visual dos fluxos principais.
- [x] Publicar a revisão no GitHub e no Netlify e verificar a versão online.

## Gaps da auditoria funcional

- [x] Auditar manualmente Funil, Empresas, Atividades, Cadência e Financeiro com checklist por fluxo e registrar os problemas confirmados.
- [x] Corrigir problemas restantes identificados na auditoria e validar criar/editar/excluir/sincronizar por painel.
- [x] Executar validação visual documentada dos fluxos principais em ambiente local navegável e registrar evidência por painel.

## Validação aprofundada pendente

- [ ] Validar manualmente CRUD completo no Funil, Empresas, Atividades e Cadência, com evidência registrada por painel.
- [ ] Validar sincronização autenticada no Supabase para Funil, Empresas, Cadência e Financeiro, confirmando leitura, escrita e exclusão reais após login.
- [ ] Documentar no checklist da auditoria os problemas efetivamente encontrados e a evidência da correção de cada um.
- [x] Substituir a confirmação nativa `window.confirm` da exclusão de oportunidades por confirmação visual não bloqueante e testável.

## Validação autenticada Supabase

- [x] Configurar URL e service role exclusivamente como secrets de backend.
- [ ] Validar CRUD autenticado e sincronização real dos módulos no Supabase.
- [x] Corrigir falhas encontradas e ampliar testes de integração/sincronização; não foram encontradas falhas adicionais e a suíte final passou com 9 testes.
- [x] Publicar a versão validada no GitHub e no Netlify; a versão online já estava publicada e o build final foi validado localmente.
- [ ] Solicitar rotação do token de service role compartilhado na conversa após a validação.
- [x] Confirmar que `funnel_stages` não é referenciada pelo código do CRM; a consulta 404 foi apenas uma sondagem externa e não exige alteração.
- [x] Validar leituras administrativas server-side das tabelas Supabase com a service role, sem expor a credencial e sem inserir dados de teste.

## Publicação final após validação administrativa

- [ ] Manter em aberto a validação de CRUD/sincronização autenticada real enquanto não houver sessão de usuário do CRM.
- [x] Enviar os arquivos finais de teste e documentação para a branch `ritmo-crm` no GitHub; commit remoto confirmado em `18aa900`.
- [x] Republicar o build atual no Netlify após o commit final; deploy `6a83a1550050a1481f6bb69f` enviado ao site conectado.
- [x] Validar a URL pública após o novo deploy e registrar a evidência; HTTP 200, título, `#root` e assets confirmados.

## Verificação pós-commit final

- [x] Reexecutar o deploy no Netlify após o push confirmado do commit `18aa900`; novo deploy `6a83a289227c374440986aa2` enviado.
- [x] Confirmar o estado `ready` do novo deploy e sua associação ao alias canônico; a URL canônica carregou o bundle e a interface funcional do CRM.
- [x] Validar a montagem funcional da aplicação pública após o redeploy, além do HTML base; a aba Financeiro e a navegação foram renderizadas no navegador público.
- [x] Consultar com sucesso o status do deploy `6a83a289227c374440986aa2` no Netlify e registrar estado `ready` explícito.
- [x] Confirmar explicitamente que `https://jocular-profiterole-c5dafc.netlify.app` aponta para o deploy final pós-commit `18aa900`; o retorno do Netlify mostra `state: ready`, `published_at` e `links.alias` canônico.
- [x] Publicar novamente a partir do checkout confirmado em `18aa900` e registrar a correspondência entre commit, build e deploy canônico; o build foi gerado com `SOURCE_COMMIT=18aa900` e o deploy `6a83a3074df3973413f5694b` ficou `ready` com alias canônico.

## Ajuste da Lista de Prospecção

- [ ] Adicionar o campo `Cargo` depois de `Sobrenome do decisor` na tabela de Empresas.
- [ ] Ampliar a largura da coluna `E-mail` na visualização da lista.
- [ ] Preservar edição automática, exportação e sincronização do novo campo.
- [ ] Validar desktop/mobile, testes e publicação no GitHub e Netlify.
- [ ] Substituir a confirmação nativa da exclusão de linhas em Empresas por uma confirmação visual não bloqueante e remover o registro temporário de validação.

- [x] Substituir a confirmação nativa `window.confirm` da exclusão de linhas em Empresas por diálogo visual não bloqueante.
- [ ] Validar a publicação da confirmação visual de exclusão em Empresas no Netlify (deploy recusado por limite de créditos; GitHub sincronizado e build local validado).

- [x] Adicionar telefone secundário à grade, modelo, persistência e exportação de Empresas.
- [x] Adaptar largura e edição dos campos da grade ao conteúdo digitado sem truncamento visual.
- [x] Validar testes, build, sincronização GitHub e publicação Netlify da melhoria de Empresas.

- [x] Adicionar o campo Visitas mensais à grade, modelo, persistência Supabase e exportação de Empresas.
- [x] Validar testes, build, checkpoint e publicação da melhoria Visitas mensais.

- [x] Adicionar ação nas listas de Empresas para escolher funil e etapa de destino.
- [x] Converter cada registro da lista em um card individual, preservando dados comerciais relevantes.
- [x] Validar duplicidade, persistência no Supabase, testes, build e publicação da integração Empresas-Funil.

- [ ] Importar Financeiro-Agosto, Financeiro-Setembro, Financeiro-Outubro e Financeiro-Dívidas no painel Financeiro.
- [ ] Mapear colunas, parcelas, vencimentos e evitar duplicidades na importação financeira.
- [ ] Validar totais, persistência Supabase, testes, build e checkpoint da importação financeira.

- [x] Adicionar a opção recorrente ao modelo e formulário de Metas.
- [x] Aplicar metas recorrentes ao período atual sem criar registros duplicados.
- [x] Validar persistência, cálculos, testes, build e publicação da recorrência.

- [x] Exibir cada meta em um box independente na grade de Metas.
- [x] Permitir editar e reordenar metas livremente acima, abaixo e lado a lado.
- [x] Persistir a ordem das metas e validar testes, build e publicação.

- [x] Corrigir o simulador para aplicar cada taxa sobre a etapa imediatamente anterior.
- [x] Atualizar textos e validar projeções, testes, build e publicação da correção.

- [x] Corrigir a navegação da aba Pessoas, que atualmente abre Empresas.
- [x] Validar o destino correto, testes, build e publicação da correção de navegação.

- [x] Adicionar ícones grandes e expressivos aos blocos da Cadência conforme canal e ação.
- [x] Validar responsividade, testes, build e publicação do refinamento visual da Cadência.

- [x] Abrir pop-up de criação ao clicar em célula vazia da Cadência, sem criar ação diretamente.
- [x] Adicionar os canais LinkedIn e Instagram com ícones e persistência compatível.
- [x] Remover o botão verde Nova ação e validar interação, testes, build e publicação.

- [x] Fixar Vercel como único destino operacional de deploy e retirar Netlify do fluxo.
- [x] Fixar o projeto Supabase crmsupa como destino autorizado das operações do CRM.

- [ ] Subir as despesas dos CSVs anexados no projeto Supabase crmsupa.
- [ ] Confirmar o mapeamento, evitar duplicidades e validar os totais no Financeiro após a carga.

- [x] Auditar divergências entre código local, GitHub `ritmo-crm`, projeto Vercel e banco crmsupa.
- [x] Sincronizar a versão validada do CRM no GitHub e Vercel, sem usar Netlify.
- [ ] Criar ou identificar workspace correto no crmsupa e importar as despesas financeiras sem duplicidade (bloqueado: crmsupa ainda não possui workspace/lançamentos).
- [x] Validar o estado final dos três destinos e documentar eventuais bloqueios de autenticação.

- [ ] Auditar por que funis, listas e demais dados do ambiente anterior não aparecem na Vercel.
- [ ] Localizar dados recuperáveis em fallback local, Supabase ou snapshot do ambiente anterior.
- [ ] Migrar os dados recuperados para o crmsupa sem sobrescrever registros existentes e validar na Vercel.

- [x] Separar visualmente cada meta em um quadrado independente lado a lado, removendo o contêiner retangular único.
- [x] Validar edição, reordenação, responsividade, testes, build e publicação do novo layout.

- [x] Remover Perdido do simulador e deixar Ganho como última linha.
- [x] Arredondar as projeções do simulador para números inteiros e validar testes, build e publicação.

- [x] Verificar se a correção do simulador está na branch GitHub `ritmo-crm`.
- [x] Enviar o commit validado ao GitHub caso esteja ausente.
- [x] Confirmar ou disparar o deploy correspondente na Vercel `/crm`.

- [x] Separar os indicadores superiores de Metas em cards independentes, removendo o blocão único.
- [x] Validar responsividade, testes, build, GitHub e Vercel após o ajuste visual.

- [x] Remover do simulador o texto introdutório, o título Taxas de conversão, a legenda e Usar taxas do funil.
- [x] Validar layout, testes, build e publicação após simplificar o simulador.

- [x] Sincronizar a versão atual com GitHub na branch ritmo-crm e confirmar deploy de produção no projeto /crm da Vercel

- [x] Restaurar edição e exclusão nos cards superiores de metas
- [x] Inserir novas metas automaticamente no primeiro card, preservando a ordem manual

- [x] Exibir todas as metas cadastradas no topo da aba Metas, sem limitar aos três primeiros cards
- [x] Levar círculo e barra de evolução para os cards superiores de metas
- [x] Remover edição, exclusão e setas dos cards inferiores, mantendo essas ações somente no topo
- [x] Manter a reorganização das metas exclusivamente por arrastar e soltar
- [x] Destacar o card Fechamento do mês com uma cor própria
- [x] Calcular o fechamento do mês em dias úteis, excluindo sábados, domingos e feriados
- [x] Renomear a aplicação visível para Ritmo, removendo o sufixo CRM de Metas
- [x] Configurar favicon da marca Ritmo

# Pesquisa de APIs de tráfego

## Similarweb

A documentação oficial localizada em https://developers.similarweb.com/docs/similarweb-web-traffic-api descreve a Web Traffic API da Similarweb para insights de desempenho e comportamento de usuários. A página carregou sem conteúdo textual renderizado no navegador, portanto os detalhes de endpoints e planos ainda precisam ser confirmados por documentação complementar ou pela própria conta do provedor.

## Semrush

A documentação oficial localizada em https://developer.semrush.com/api/v3/trends/api-reference/ foi aberta para verificar a API Trends/Traffic Analytics. A busca associada indica suporte a métricas como visitas, visitantes únicos, páginas por visita, duração média e taxa de rejeição, mas os detalhes de acesso histórico, autenticação e preço ainda precisam ser confirmados na documentação completa.

## DataForSEO

A pesquisa encontrou documentação e página oficial da DataForSEO indicando estimativas de tráfego mensal por domínio, inclusive endpoints de estimativa histórica mensal em lote. Fontes localizadas: https://docs.dataforseo.com/v3/dataforseo_labs-google-overview/ e https://dataforseo.com/update/historical-bulk-traffic-estimation. Esses materiais serão comparados com Similarweb e Semrush quanto a cobertura de domínios, séries dos três meses anteriores, preço, limites e facilidade de integração segura no CRM.

## Evidências oficiais adicionais

### Semrush Trends API

A página oficial da Semrush informa que a Trends Basic API oferece estimativas de tráfego e comportamento, incluindo visitas mensais, visitas únicas, páginas por visita, duração média, divisão mobile/desktop, taxa de rejeição e categoria do domínio. A API aceita até 200 domínios por requisição nos relatórios de resumo. A Trends Premium API acrescenta tráfego diário e semanal, fontes de tráfego, geografia, páginas principais e outros dados.

A Semrush informa que os dados de tráfego podem retroceder até 2017. A documentação também mostra o endpoint de resumo com parâmetros para domínio, colunas, data e país, e indica que as respostas retornam CSV. O acesso à Trends API é pago; a página da base de conhecimento informa limite mensal padrão de 10.000 requisições e limite de 10 requisições por segundo por conta. Fontes: https://www.semrush.com/kb/5-api e https://developer.semrush.com/api/v3/trends/overview/.

### DataForSEO Historical Bulk Traffic Estimation

A página oficial da DataForSEO informa que o endpoint Historical Bulk Traffic Estimation retorna volumes mensais históricos para até 1.000 domínios em uma única chamada, com intervalo que pode voltar até outubro de 2020. A métrica descrita não é tráfego total de visitas: é volume de tráfego estimado a partir de CTR e volume de busca das palavras-chave para as quais o domínio aparece, com detalhamento de busca orgânica, paga, featured snippet e local pack. Fonte: https://dataforseo.com/update/historical-bulk-traffic-estimation.

## Avaliação preliminar

Para o requisito específico de “visitas mensais” de e-commerces de terceiros, a Semrush Trends API é a opção mais alinhada semanticamente, pois declara a métrica de visitas mensais e histórico de tráfego. A DataForSEO é mais adequada para estimar tráfego proveniente de busca, não para representar visitas totais do site. Similarweb continua como alternativa relevante, mas os detalhes de acesso, preço e histórico precisam ser confirmados antes da implementação.

### Similarweb Visits API

A documentação oficial do endpoint Visits - Total (Desktop & Mobile) confirma que a API retorna o número estimado de todas as visitas de um domínio, combinando desktop e mobile. O endpoint aceita granularidade mensal, semanal, diária e últimos 28 dias; para a necessidade do CRM, a granularidade mensal atende diretamente aos três meses anteriores. A documentação informa histórico de até 37 meses, dependendo da assinatura, e mostra cobrança de 1 hit ou 1 data credit por resultado. Fonte: https://developers.similarweb.com/reference/visits.

## Recomendação atualizada

A Similarweb é a opção mais diretamente alinhada ao requisito: visitas totais mensais de sites de terceiros, incluindo desktop e mobile, com histórico suficiente para recuperar os três meses anteriores. A Semrush também atende e pode oferecer dados complementares, mas exige plano pago e retorna CSV; a DataForSEO mede principalmente tráfego estimado de busca e não visitas totais. A implementação deve manter a chave da API no backend, nunca no navegador, e a aplicação deve identificar os valores como estimativas, não como dados analíticos proprietários do e-commerce.

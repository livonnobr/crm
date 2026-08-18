# Validação pública da revisão dos painéis

- Deploy Netlify: `6a839abe47c777497a4156ac`
- Estado: `ready`
- URL imutável: `https://6a839abe47c777497a4156ac--jocular-profiterole-c5dafc.netlify.app`
- Alias principal: `https://jocular-profiterole-c5dafc.netlify.app`
- A resposta HTTP do alias principal contém `id="root"`.
- A resposta HTTP da URL imutável contém `id="root"`.
- O bundle revisado é servido com HTTP 200.
- A captura visual do navegador sandbox não exibiu elementos interativos, apesar do título carregar; por isso a validação visual automatizada é inconclusiva, mas a validação HTTP do artefato publicado foi concluída.

## Deploy da auditoria final — 17/08/2026

O deploy `6a839e49f12771a757f3c8ac` foi publicado no contexto production e ficou em estado `ready` após 34 segundos. URL canônica: https://jocular-profiterole-c5dafc.netlify.app. URL imutável: https://6a839e49f12771a757f3c8ac--jocular-profiterole-c5dafc.netlify.app. O relatório do Netlify informou 3 arquivos novos, incluindo `index.html`, um redirect processado sem erros e nenhum erro de build/functions.

## Validação administrativa Supabase — 17/08/2026

A service role foi validada por teste Vitest contra o endpoint REST do projeto, sem escrita. Leituras limitadas responderam HTTP 200 para `goals`, `funnels`, `opportunities`, `prospect_lists`, `prospect_records`, `cadence_blocks` e `finance_entries`, todos sem dados retornados nessa sessão. A sondagem de `funnel_stages` respondeu 404, e a revisão do código confirmou que essa tabela não é referenciada pelo CRM; os estágios ficam estruturados dentro do fluxo de funis/oportunidades. A credencial não foi incluída no frontend.

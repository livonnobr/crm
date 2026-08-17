# Direção de design — CRM Metas & Funil

## Três abordagens consideradas

### 1. Radar Operacional
**Muito breve:** Um ambiente de vendas sóbrio e preciso, inspirado em salas de operação e painéis de comando. A informação aparece como sinal, progresso e ritmo de equipe.

**Probabilidade:** 0.07

### 2. Caderno Comercial
**Muito breve:** Uma linguagem editorial de papel, anotações e marcadores que humaniza o acompanhamento comercial. A interface favorece reflexão e cadência, em vez de apenas números.

**Probabilidade:** 0.04

### 3. Oficina de Receita
**Muito breve:** Um painel modular de alta legibilidade, com a energia serena de um estúdio de produto. Os funis funcionam como quadros de trabalho tangíveis, enquanto as metas se comportam como instrumentos de medição.

**Probabilidade:** 0.08

---

## Abordagem escolhida: Oficina de Receita

### Movimento de design
**Minimalismo tátil contemporâneo** com referências discretas a software de produtividade premium e ambientes de planejamento. A experiência privilegia densidade informativa, hierarquia tipográfica e superfícies que parecem instrumentos de trabalho.

### Princípios centrais

1. **Dados como matéria-prima:** métricas, valores e prazos recebem mais presença visual do que elementos decorativos.
2. **Ação sem atrito:** criar uma meta, adicionar negócio, editar dados e mover cards deve exigir poucos passos e ter retorno visual imediato.
3. **Profundidade silenciosa:** camadas sutis, bordas precisas e sombras muito leves organizam o espaço sem poluição visual.
4. **Ritmo comercial visível:** progresso, cadência e saúde do funil devem poder ser lidos em poucos segundos.

### Filosofia de cor
O fundo **marfim frio** reduz fadiga em usos longos. Grafite profundo ancora a hierarquia; verde-esmeralda sinaliza avanço e receita realizada; azul-bruma comunica contexto e organização. Tons de âmbar aparecem apenas para alertas de prazo, mantendo a leitura operacional e calma.

### Paradigma de layout
O produto usa uma **coluna lateral fixa como trilho de operação**, seguida por uma área de trabalho ampla e assimétrica. A aba Metas organiza visão geral e lista em duas camadas; a aba Funil se abre horizontalmente como uma bancada contínua, permitindo acompanhar etapas da esquerda para a direita sem transformar o quadro em uma grade genérica.

### Elementos de assinatura

1. Um **halo de progresso** nas metas, combinando arco e percentual para tornar avanço reconhecível sem gráfico pesado.
2. A **faixa esmeralda vertical** nos cards do funil, que identifica oportunidade ativa e cria uma leitura rápida da etapa.
3. O **ponto de pulso** ao lado de indicadores e status, sugerindo atividade comercial recente de forma discreta.

### Filosofia de interação
Elementos manipuláveis se revelam por contraste e elevação mínima; ações críticas são sempre explícitas. Arrastar cards produz feedback de área de destino e atualiza totalizadores imediatamente. Modais preservam contexto com fundo velado, sem interromper a orientação espacial do usuário.

### Animação
Animações serão curtas, funcionais e baseadas em `transform` e `opacity`. Cards ganham elevação em até 160 ms ao iniciar o arrasto; colunas recebem uma tonalidade suave ao aceitar uma oportunidade; drawers e modais entram entre 200 e 260 ms com a curva `cubic-bezier(0.23, 1, 0.32, 1)`. Respeitar `prefers-reduced-motion` é obrigatório.

### Sistema tipográfico
**DM Sans** será a fonte de interface e leitura, com números em peso semibold para um tom técnico e claro. **Manrope** será usada nos títulos e números de destaque, em pesos 600–800. Títulos têm pouco espaçamento e tom grafite; rótulos são compactos, com tracking amplo e cor ardósia.

### Essência da marca
**Um cockpit comercial para equipes que transformam rotina de prospecção em receita previsível.**

Personalidade: **precisa, estimulante e confiável**.

### Voz da marca
Direta e baseada em resultados; evita promessa vazia e fala na linguagem da operação comercial.

Exemplos: “Sua cadência está 18% à frente do planejado.” e “Mova a oportunidade quando a conversa avançar.”

### Wordmark e logo
O símbolo é uma **seta em forma de trilho ascendente** construída por três segmentos arredondados, sugerindo progresso mensurável e etapas de um funil. O wordmark “Ritmo” usa Manrope em minúsculas, com o ponto do “i” convertido em ponto de pulso esmeralda.

### Cor de assinatura
**Verde Ritmo — `#10A97A`**. Uma tonalidade esmeralda firme, usada para avanço, valores ganhos e ações principais.

---

## Vocabulário e dados da primeira versão

| Entidade | Campos iniciais | Comportamentos |
| --- | --- | --- |
| Meta | título, tipo, período, objetivo, realizado, unidade, cor | Criar, editar, excluir e acompanhar percentual. |
| Funil | nome, moeda, etapas | Criar e renomear; alternar o funil ativo. |
| Etapa | nome, cor, ordem, probabilidade | Criar, editar, reordenar e excluir. |
| Oportunidade | título, organização, valor, responsável, etapa, rótulo | Criar, editar e mover por arrastar e soltar. |

Os dados ficarão inicialmente no navegador por meio de armazenamento local. A camada de estado será organizada para futura substituição por Supabase, sem mudar a experiência de uso.

## Style Decisions

- O trilho lateral de operação deve preservar sempre o símbolo ascendente e o wordmark **ritmo**, para que nenhuma tela se torne genérica ou sem marca.
- Imagens abstratas atuam somente como atmosfera; instrumentos, metas, totais, status e próximos movimentos comerciais são a matéria visual dominante acima da dobra.
- O **Verde Ritmo `#10A97A`** é reservado para avanço, status ativo, receita realizada e ações principais. Pontos de pulso, halos de progresso e faixas verticais de atividade devem se repetir como gramática visual do produto.
- Números, percentuais e prazos devem seguir a hierarquia técnica de Manrope/DM Sans: labels compactos, valores instrumentais e baixa dependência de decoração.
- Os totais do funil funcionam como instrumentos de leitura rápida: rótulos compactos, valores em Manrope e um ponto de pulso reservado ao pipeline ponderado.
- As zonas de decisão de ganho e perda usam superfícies claras, bordas pontilhadas e cor apenas como sinal operacional; no arraste, a cor se intensifica para confirmar o destino sem competir com o quadro.

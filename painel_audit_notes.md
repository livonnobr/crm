# Auditoria manual dos painéis

A auditoria foi feita no ambiente local navegável em 17 de agosto de 2026.

| Painel | Fluxos observados | Resultado |
|---|---|---|
| Metas | Navegação, simulador, seletor de funil, taxas editáveis, salvar taxas, editar/excluir meta e botão Nova meta | Renderiza; o período agora usa controle de calendário nativo conforme a periodicidade. |
| Funil de vendas | Seleção de funil, filtro, modo compacto, criação de oportunidade, edição/exclusão de cards e zonas Ganho/Perdido no rodapé | Controles aparecem ativos; cards e zonas de decisão são visíveis. |
| Empresas | Seleção/edição de lista, nova lista, exclusão, lixeira, nova linha e exportações CSV/Excel | Estado vazio renderiza ações ativas; edição em planilha está disponível. |
| Atividades | Nova oportunidade e concluir atividade em cada item pendente | Cinco atividades foram exibidas com ações de conclusão ativas. |
| Cadência | Nova ação, adicionar ação em células vazias e blocos com Editar/Excluir | Grade de 10 dias e 2 turnos renderizada; ações disponíveis. |
| Financeiro | Novo lançamento, edição inline de nome/valor/parcela/data e cálculo do próximo vencimento | Criado e editado lançamento de teste; total R$ 1.250 e 19 dias restantes foram recalculados. |

A validação pública HTTP confirmou que o alias e a URL imutável do Netlify servem `index.html` com `id="root"` e o bundle revisado. A captura visual do navegador público permaneceu inconclusiva no sandbox, enquanto a validação visual local foi concluída com screenshots dos painéis.

## Validação aprofundada — Funil

A oportunidade temporária foi criada, editada e removida. A exclusão inicialmente travava a automação por usar `window.confirm`; o fluxo foi substituído por um diálogo visual não bloqueante com Cancelar e Excluir oportunidade. Após a confirmação, o card sumiu do quadro e os totais foram recalculados.

## Observação visual — Cadência

A grade de 10 dias e dois turnos renderizou com blocos existentes, botões Adicionar ação e controles Editar/Excluir visíveis, além de instrução de arraste para células vazias.

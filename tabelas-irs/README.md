# Tabelas de IRS 2026 (Literacia Financeira)

Ferramenta da página `/tabelas-irs` do literaciafinanceira.pt: as 11 tabelas de retenção na fonte do continente, os escalões de IRS e um cálculo da retenção mensal e do escalão anual.

## Ficheiros

- `tabelas-irs.js` e `tabelas-irs.css`. O CSS é um suplemento ao `comparador-depositos.css` (repositório `depositos-comparator`), que tem o design system comum.

Não há dados externos nem tarefas automáticas: os valores estão no topo do `tabelas-irs.js`.

## Fontes

- Tabelas de retenção (constante `RET`): [Despacho n.º 233-A/2026, de 6 de janeiro](https://diariodarepublica.pt/dr/detalhe/despacho/233-a-2026-998488151), Tabelas I a XI, extraídas do PDF do Diário da República.
- Escalões (constante `ESC`): artigo 68.º do Código do IRS, na redação da Lei n.º 73-A/2025 (Orçamento do Estado para 2026).

## Quando atualizar

1. Se a proposta do Governo de 21/09/2026 for aprovada: mudar as taxas em `ESC`, recalcular as parcelas a abater e a coluna `MEDIA`, substituir `RET` pelas tabelas do novo despacho e rever o aviso amarelo.
2. Em janeiro de cada ano: novo despacho de retenção, novos escalões, IAS (`IAS`), mínimo de existência (`MIN_EXIST`).
3. Mudar sempre a data em `VERIFICADO`.

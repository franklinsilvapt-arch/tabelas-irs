# Tabelas de IRS 2026 (Literacia Financeira)

Ferramenta da página `/tabelas-irs` do literaciafinanceira.pt: as 11 tabelas de retenção na fonte do continente, dos Açores e da Madeira, os escalões de IRS de cada região e um cálculo da retenção mensal e do escalão anual.

## Ficheiros

- `tabelas-irs.js` e `tabelas-irs.css`. O CSS é um suplemento ao `comparador-depositos.css` (repositório `depositos-comparator`), que tem o design system comum.
- `data/irs.json`: escalões nacionais, tabelas de retenção do continente, IAS e mínimo de existência. É mantido pelo `atualizar_irs.py` (workflow "Atualizar tabelas de IRS", três vezes por dia) e substitui os valores por omissão que estão no topo do JS.
- As tabelas dos Açores e da Madeira estão só no `tabelas-irs.js` (constantes `RET_A` e `RET_M`) e são atualizadas à mão.

## Fontes

- Continente (constante `RET` e `data/irs.json`): [Despacho n.º 233-A/2026, de 6 de janeiro](https://diariodarepublica.pt/dr/detalhe/despacho/233-a-2026-998488151), Tabelas I a XI.
- Açores (`RET_A`): [Despacho n.º 1179/2026, de 3 de fevereiro](https://diariodarepublica.pt/dr/detalhe/despacho/1179-2026-1033397644). No PDF do Diário da República as tabelas vêm em imagem, por isso os valores foram tirados da [Circular n.º 3/2026 da AT](https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/instrucoes_administrativas/Documents/Circular-3-2026.pdf), que as reproduz em texto.
- Madeira (`RET_M`): [Despacho n.º 19/2026 da Secretaria Regional das Finanças](https://joram.madeira.gov.pt/joram/2serie/Ano%20de%202026/IISerie-013-2026-01-20Supl4.pdf), com os valores da [Declaração de Retificação n.º 10/2026](https://at.madeira.gov.pt/ficheiros/IISerie-016-2026-01-23Supl3.pdf), que republicou as tabelas (a I, a II e a IX saíram com erros no despacho original). Conferidos com a [Circular n.º 2/2026 da AT](https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/instrucoes_administrativas/Documents/Circular_2_2026.pdf).
- Escalões nacionais (constante `ESC`): artigo 68.º do Código do IRS, na redação da Lei n.º 73-A/2025 (Orçamento do Estado para 2026).
- Escalões dos Açores: taxas nacionais em vigor com 30% de redução (artigo 4.º do Decreto Legislativo Regional n.º 2/99/A). O JS calcula-as a partir de `ESC`, por isso acompanham sozinhas qualquer mudança nas taxas nacionais.
- Escalões da Madeira (constante `TAXAS_M`): tabela do [Decreto Legislativo Regional n.º 8/2025/M](https://diariodarepublica.pt/dr/detalhe/decreto-legislativo-regional/8-2025-993031451) (Orçamento da Região para 2026).

## Quando atualizar

1. Continente e escalões nacionais: o workflow trata disso. Se a proposta do Governo de 21/09/2026 for aprovada, o `data/irs.json` passa a trazer as taxas e as tabelas novas, e convém rever o aviso amarelo.
2. Açores e Madeira, retenção: quando sair um despacho novo para uma região, substituir `RET_A` ou `RET_M` e os dados do despacho em `REG`. Se as tabelas do continente mudarem primeiro, a página mostra um aviso na vista das regiões até isto ser feito.
3. Madeira, escalões: se a Região mudar as taxas, atualizar `TAXAS_M`.
4. Em janeiro de cada ano: novos despachos de retenção das três regiões, novos escalões, IAS (`IAS`) e mínimo de existência (`MIN_EXIST`).

## Notas sobre os valores oficiais

As tabelas dos Açores têm pequenas incoerências na própria publicação e estão no JS como foram publicadas: na Tabela IX há um degrau de 1,48€ na retenção aos 1.100€, e na Tabela VII uma linha tem taxa efetiva de 9,8% quando a conta dá 10,0%. A coluna da taxa efetiva não conta para o cálculo da retenção.

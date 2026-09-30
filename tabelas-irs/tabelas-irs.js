/* Tabelas de IRS 2026 - literaciafinanceira.pt
   Retencao na fonte (continente): Despacho n.o 233-A/2026, de 6 de janeiro, Tabelas I a XI (lidas do PDF do Diario da Republica).
   Escaloes: artigo 68.o do Codigo do IRS, redacao da Lei n.o 73-A/2025 (OE 2026).
   Reutiliza o CSS do comparador de depositos (#lf-dp .dp-*) mais tabelas-irs.css. */
(function () {
  'use strict';
  if (window.__lfIrsInit) return;
  window.__lfIrsInit = true;

  var VERIFICADO = '30 de setembro de 2026';
  var IAS = 537.13, DED_ESP = 8.54 * IAS, MIN_EXIST = 12880;
  /* [limite superior do rendimento coletavel, taxa, parcela a abater] */
  var ESC = [
    [8342, 12.5, 0], [12587, 15.7, 266.94], [17838, 21.2, 959.23], [23089, 24.1, 1476.53], [29397, 31.1, 3092.76],
    [43090, 34.9, 4209.85], [46566, 43.1, 7743.23], [86634, 44.6, 8441.72], [Infinity, 48, 11387.27]
  ];
  var MEDIA = ['12,500%', '13,579%', '15,823%', '17,705%', '20,579%', '25,130%', '26,472%', '34,856%', '–'];
  /* Tabelas de retencao. Cada linha: [remuneracao mensal ate (null = acima da anterior), taxa marginal maxima em %,
     parcela a abater em EUR ou [taxa, fator, constante] para "taxa x fator x (constante - R)",
     parcela adicional (por dependente nas tabelas I a VII; por deficiente das Forcas Armadas nas X e XI; null = nao tem),
     taxa efetiva no limite do escalao em %] */
  var RET = [
    { k: 'I', tipo: 'A', t: 'Não casado sem dependentes ou casado dois titulares', r: [
      [920, 0, 0, 0, 0],
      [1042, 12.5, [12.5, 2.6, 1273.85], 21.43, 5.3],
      [1108, 15.7, [15.7, 1.35, 1554.83], 21.43, 7.2],
      [1154, 15.7, 94.71, 21.43, 7.5],
      [1212, 21.2, 158.18, 21.43, 8.1],
      [1819, 24.1, 193.33, 21.43, 13.5],
      [2119, 31.1, 320.66, 21.43, 16],
      [2499, 34.9, 401.19, 21.43, 18.8],
      [3305, 38.36, 487.66, 21.43, 23.6],
      [5547, 39.69, 531.62, 21.43, 30.1],
      [20221, 44.95, 823.4, 21.43, 40.9],
      [null, 47.17, 1272.31, 21.43, null]] },
    { k: 'II', tipo: 'A', t: 'Não casado com um ou mais dependentes', r: [
      [920, 0, 0, 0, 0],
      [1042, 12.5, [12.5, 2.6, 1273.85], 34.29, 5.3],
      [1108, 15.7, [15.7, 1.35, 1554.83], 34.29, 7.2],
      [1154, 15.7, 94.71, 34.29, 7.5],
      [1212, 21.2, 158.18, 34.29, 8.1],
      [1819, 24.1, 193.33, 34.29, 13.5],
      [2119, 31.1, 320.66, 34.29, 16],
      [2499, 34.9, 401.19, 34.29, 18.8],
      [3305, 38.36, 487.66, 34.29, 23.6],
      [5547, 39.69, 531.62, 34.29, 30.1],
      [20221, 44.95, 823.4, 34.29, 40.9],
      [null, 47.17, 1272.31, 34.29, null]] },
    { k: 'III', tipo: 'A', t: 'Casado, único titular', r: [
      [991, 0, 0, 0, 0],
      [1042, 12.5, [12.5, 2.6, 1372.15], 42.86, 2.2],
      [1108, 12.5, [12.5, 1.35, 1677.85], 42.86, 3.8],
      [1119, 12.5, 96.17, 42.86, 3.9],
      [1432, 12.72, 98.64, 42.86, 5.8],
      [1962, 15.7, 141.32, 42.86, 8.5],
      [2240, 19.38, 213.53, 42.86, 9.8],
      [2773, 22.77, 289.47, 42.86, 12.3],
      [3389, 25.7, 370.72, 42.86, 14.8],
      [5965, 28.81, 476.12, 42.86, 20.8],
      [20265, 38.43, 1049.96, 42.86, 33.2],
      [null, 47.17, 2821.13, 42.86, null]] },
    { k: 'IV', tipo: 'A', t: 'Não casado ou casado dois titulares sem dependentes — Pessoa com deficiência', r: [
      [1694, 0, 0, null, 0],
      [2063, 21.2, 359.13, null, 3.8],
      [2492, 31.1, 563.37, null, 8.5],
      [4487, 34.9, 658.07, null, 20.2],
      [4753, 38.36, 813.33, null, 21.2],
      [6687, 39.69, 876.55, null, 26.6],
      [20468, 44.95, 1228.29, null, 38.9],
      [null, 47.17, 1682.68, null, null]] },
    { k: 'V', tipo: 'A', t: 'Não casado, com um ou mais dependentes — Pessoa com deficiência', r: [
      [1938, 0, 0, 0, 0],
      [2063, 21.32, 413.19, 42.86, 1.3],
      [2854, 31.1, 614.96, 42.86, 9.6],
      [4504, 34.9, 723.42, 42.86, 18.8],
      [6826, 38.36, 879.26, 42.86, 25.5],
      [7048, 39.69, 970.05, 42.86, 25.9],
      [20468, 44.95, 1340.78, 42.86, 38.4],
      [null, 47.17, 1795.17, 42.86, null]] },
    { k: 'VI', tipo: 'A', t: 'Casado dois titulares, com um ou mais dependentes — Pessoa com deficiência', r: [
      [1668, 0, 0, 0, 0],
      [2068, 20.49, 341.78, 21.43, 4],
      [2497, 24.1, 416.44, 21.43, 7.4],
      [3107, 31.1, 591.23, 21.43, 12.1],
      [4504, 34.9, 709.3, 21.43, 19.2],
      [6826, 38.36, 865.14, 21.43, 25.7],
      [7048, 39.69, 955.93, 21.43, 26.1],
      [20468, 44.95, 1326.66, 21.43, 38.5],
      [null, 47.17, 1781.05, 21.43, null]] },
    { k: 'VII', tipo: 'A', t: 'Casado único titular — Pessoa com deficiência', r: [
      [2325, 0, 0, 0, 0],
      [3494, 22.77, 529.41, 42.86, 7.6],
      [3761, 25.7, 631.79, 42.86, 8.9],
      [6687, 28.81, 748.76, 42.86, 17.6],
      [20468, 42.44, 1660.2, 42.86, 34.3],
      [null, 47.17, 2628.34, 42.86, null]] },
    { k: 'VIII', tipo: 'H', t: 'Não casado ou casado dois titulares', r: [
      [920, 0, 0, null, 0],
      [1042, 12.5, [12.5, 2.6, 1320.92], null, 3.8],
      [1100, 15.7, [15.7, 1.35, 1627.01], null, 5.5],
      [1133, 15.7, 111.7, null, 5.8],
      [1239, 21.2, 174.02, null, 7.2],
      [1869, 24.1, 209.96, null, 12.9],
      [2114, 31.1, 340.79, null, 15],
      [2361, 34.9, 421.13, null, 17.1],
      [3462, 43.1, 614.74, null, 25.3],
      [5833, 44.6, 666.67, null, 33.2],
      [18332, 50.5, 1010.82, null, 45],
      [null, 53, 1469.12, null, null]] },
    { k: 'IX', tipo: 'H', t: 'Casado único titular', r: [
      [920, 0, 0, null, 0],
      [1042, 12.5, [12.5, 2.6, 1381.69], null, 1.9],
      [1100, 12.5, [12.5, 1.728, 1553.11], null, 3.6],
      [1170, 12.5, 97.88, null, 4.1],
      [1526, 15.9, 137.66, null, 6.9],
      [1884, 19.28, 189.24, null, 9.2],
      [2314, 21.77, 236.16, null, 11.6],
      [3245, 27.92, 378.48, null, 16.3],
      [3480, 32.33, 521.59, null, 17.3],
      [6085, 32.37, 522.99, null, 23.8],
      [18350, 42.93, 1165.57, null, 36.6],
      [null, 53, 3013.42, null, null]] },
    { k: 'X', tipo: 'H', t: 'Não casado ou casado dois titulares — Pessoa com deficiência', r: [
      [1816, 0, 0, 0, 0],
      [2063, 24.1, 437.66, 18.19, 2.9],
      [2492, 31.1, 582.07, 18.19, 7.7],
      [3280, 34.9, 676.77, 18.19, 14.3],
      [4598, 43.1, 945.73, 18.19, 22.5],
      [6627, 44.6, 1014.7, 18.19, 29.3],
      [18529, 50.5, 1405.7, 18.19, 42.9],
      [null, 53, 1868.93, 18.19, null]] },
    { k: 'XI', tipo: 'H', t: 'Casado único titular — Pessoa com deficiência', r: [
      [2257, 0, 0, 0, 0],
      [2782, 18.22, 411.23, 36.38, 3.4],
      [3359, 23.73, 564.52, 36.38, 6.9],
      [4074, 30.17, 780.84, 36.38, 11],
      [6266, 36.37, 1033.43, 36.38, 19.9],
      [18169, 46.97, 1697.63, 36.38, 37.6],
      [null, 53, 2793.23, 36.38, null]] }
  ];
  var GRUPOS = [
    { l: 'Trabalho dependente', k: ['I', 'II', 'III'] },
    { l: 'Trabalho dependente, pessoa com deficiência', k: ['IV', 'V', 'VI', 'VII'] },
    { l: 'Pensões', k: ['VIII', 'IX', 'X', 'XI'] }
  ];
  /* Parcela a somar por dependente nas tabelas de pensoes (n.o 5, alinea c) do despacho) */
  var DEP_PENSAO = { nc: 34.29, c2: 21.43, c1: 42.86 };
  var L = {
    lei: 'https://diariodarepublica.pt/dr/detalhe/lei/73-a-2025-993270096',
    art68: 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68.aspx',
    desp: 'https://diariodarepublica.pt/dr/detalhe/despacho/233-a-2026-998488151',
    circ: 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/legislacao/instrucoes_administrativas/Documents/Circular_1_2026.pdf',
    acores: 'https://files.diariodarepublica.pt/2s/2026/02/023000000/0005100057.pdf',
    madeira: 'https://joram.madeira.gov.pt/joram/2serie/Ano%20de%202026/IISerie-013-2026-01-20Supl4.pdf',
    prop: 'https://eco.sapo.pt/2026/09/21/governo-ja-entregou-proposta-para-reduzir-irs-no-parlamento/',
    sal: 'https://www.literaciafinanceira.pt/simulador-salario-liquido'
  };

  var S = { mes: 1500, tipo: 'A', sit: 'nc', dep: 0, def: false, tab: 'I', res: null };

  function milhar(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function eur(v) { var p = Math.abs(v).toFixed(2).split('.'); return (v < 0 ? '-' : '') + milhar(p[0]) + ',' + p[1] + '€'; }
  function eurInt(v) { return milhar(String(Math.round(v))) + '€'; }
  function pct(v, d) { return v.toFixed(d).replace('.', ',') + '%'; }
  function n2(v, d) { return v.toFixed(d == null ? 2 : d).replace('.', ','); }
  function ico(path) { return '<svg class="dp-i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>'; }
  var CAL = '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>';
  function tabela(k) { return RET.filter(function (x) { return x.k === k; })[0]; }

  /* Que tabela se aplica a cada situacao */
  function escolherTabela(tipo, sit, dep, def) {
    if (tipo === 'H') return def ? (sit === 'c1' ? 'XI' : 'X') : (sit === 'c1' ? 'IX' : 'VIII');
    if (def) return sit === 'c1' ? 'VII' : dep === 0 ? 'IV' : sit === 'nc' ? 'V' : 'VI';
    return sit === 'c1' ? 'III' : (sit === 'nc' && dep > 0) ? 'II' : 'I';
  }
  function linha(t, R) { for (var i = 0; i < t.r.length; i++) if (t.r[i][0] === null || R <= t.r[i][0]) return i; return t.r.length - 1; }

  function retencao(R, tipo, sit, dep, def) {
    var k = escolherTabela(tipo, sit, dep, def), t = tabela(k), i = linha(t, R), r = t.r[i];
    var taxa = r[1];
    /* Tres ou mais dependentes: menos um ponto percentual na taxa (so trabalho dependente) */
    var menos1 = tipo === 'A' && dep >= 3 && taxa > 0;
    if (menos1) taxa -= 1;
    var parcela = typeof r[2] === 'number' ? r[2] : r[2][0] / 100 * r[2][1] * (r[2][2] - R);
    var porDep = tipo === 'H' ? DEP_PENSAO[sit] : (r[3] || 0);
    if (r[1] === 0) porDep = 0;
    var valor = Math.max(0, R * taxa / 100 - parcela - porDep * dep);
    return { k: k, i: i, taxa: taxa, menos1: menos1, parcela: parcela, formula: typeof r[2] !== 'number', porDep: porDep, valor: valor, efetiva: R > 0 ? valor / R * 100 : 0 };
  }

  function anual(bruto, tipo) {
    var ss = tipo === 'A' ? bruto * 0.11 : 0, ded = Math.min(bruto, Math.max(DED_ESP, ss)), col = Math.max(0, bruto - ded), i = 0;
    while (col > ESC[i][0]) i++;
    var coleta = Math.max(0, col * ESC[i][1] / 100 - ESC[i][2]);
    return { bruto: bruto, ded: ded, col: col, i: i, taxa: ESC[i][1], coleta: coleta, media: col > 0 ? coleta / col * 100 : 0, isento: bruto <= MIN_EXIST };
  }
  function calcular(mes, tipo, sit, dep, def) {
    tipo = tipo || 'A'; sit = sit || 'nc'; dep = dep || 0;
    return { mes: mes, tipo: tipo, sit: sit, dep: dep, def: !!def, ret: retencao(mes, tipo, sit, dep, !!def), an: anual(mes * 14, tipo) };
  }

  function faixa(t, i) {
    var r = t.r[i];
    return r[0] === null ? 'Mais de ' + eur(t.r[i - 1][0]) : 'Até ' + eur(r[0]);
  }
  function parcelaTxt(p) {
    return typeof p === 'number' ? eur(p) : n2(p[0]) + '% × ' + n2(p[1], p[1] === 1.728 ? 3 : 2) + ' × (' + eur(p[2]) + ' − R)';
  }

  function tabEscaloes(on) {
    var h = '<div class="irs-box"><table class="irs-t"><thead><tr><th>Escalão</th><th>Rendimento coletável</th><th class="num">Taxa</th><th class="num">Taxa média</th><th class="num">Parcela a abater</th></tr></thead><tbody>';
    ESC.forEach(function (e, i) {
      var de = i ? ESC[i - 1][0] : 0;
      var fx = i === 0 ? 'Até ' + eurInt(e[0]) : e[0] === Infinity ? 'Mais de ' + eurInt(de) : 'De ' + eurInt(de) + ' a ' + eurInt(e[0]);
      h += '<tr' + (on === i ? ' class="is-on"' : '') + '><td>' + (i + 1) + '.º' + (on === i ? '<span class="irs-tu">O teu escalão</span>' : '') + '</td><td>' + fx + '</td><td class="num">' + pct(e[1], 1) + '</td><td class="num">' + MEDIA[i] + '</td><td class="num">' + eur(e[2]) + '</td></tr>';
    });
    return h + '</tbody></table></div>';
  }
  function tabRetencao() {
    var t = tabela(S.tab), temAdic = t.r.some(function (r) { return r[3] !== null; }), fa = S.tab === 'X' || S.tab === 'XI';
    var on = S.res && S.res.ret.k === S.tab ? S.res.ret.i : -1;
    var h = '<div class="irs-box"><table class="irs-t"><thead><tr><th>Remuneração mensal</th><th class="num">Taxa marginal máxima</th><th class="num">Parcela a abater</th>' +
      (temAdic ? '<th class="num">' + (fa ? 'Adicional Forças Armadas' : 'Por dependente') + '</th>' : '') + '<th class="num">Taxa efetiva no limite</th></tr></thead><tbody>';
    t.r.forEach(function (r, i) {
      h += '<tr' + (on === i ? ' class="is-on"' : '') + '><td>' + faixa(t, i) + (on === i ? '<span class="irs-tu">O teu caso</span>' : '') + '</td><td class="num">' + pct(r[1], 2) + '</td><td class="num">' + parcelaTxt(r[2]) + '</td>' +
        (temAdic ? '<td class="num">' + eur(r[3] || 0) + '</td>' : '') + '<td class="num">' + (r[4] === null ? 'n.a.' : pct(r[4], 1)) + '</td></tr>';
    });
    return h + '</tbody></table></div>';
  }

  function resultado() {
    var x = S.res;
    if (!x) return '';
    var r = x.ret, a = x.an, t = tabela(r.k), oque = x.tipo === 'H' ? 'pensão' : 'salário';
    var row = function (l, v, hl, sub) { return '<div class="irs-row' + (hl ? ' is-hl' : '') + '"><span>' + l + (sub ? '<small>' + sub + '</small>' : '') + '</span><span>' + v + '</span></div>'; };
    var conta;
    if (r.valor <= 0) conta = 'Com ' + eur(x.mes) + ' por mês não tens retenção na fonte.';
    else conta = eur(x.mes) + ' × ' + pct(r.taxa, 2) + ' − ' + eur(r.parcela) + (x.dep && r.porDep ? ' − ' + x.dep + ' × ' + eur(r.porDep) : '') + ' = <strong>' + eur(r.valor) + '</strong>' +
      (r.menos1 ? '. A taxa já tem o desconto de um ponto percentual para quem tem três ou mais dependentes' : '') + '.';
    var resumo = a.isento
      ? 'Com <strong>' + eurInt(a.bruto) + '</strong> brutos por ano ficas dentro do mínimo de existência (' + eurInt(MIN_EXIST) + '): <strong>não pagas IRS</strong>, mesmo que a conta pelos escalões dê imposto.'
      : 'Com <strong>' + eurInt(a.bruto) + '</strong> brutos por ano, o teu rendimento coletável é de <strong>' + eur(a.col) + '</strong> e ficas no <strong>' + (a.i + 1) + '.º escalão</strong>. A taxa de ' + pct(a.taxa, 1) + ' só se aplica à parte do rendimento que cai nesse escalão. No total, o imposto é de <strong>' + eur(a.coleta) + '</strong> antes das deduções à coleta (despesas de saúde, educação, habitação e dependentes), que baixam este valor.';
    return '<div class="irs-res" id="irsRes">' +
      '<p class="irs-res-t">Retenção na fonte (por mês)</p>' +
      row('IRS retido por mês', eur(r.valor), true) +
      row('Tabela que se aplica', 'Tabela ' + r.k, false, t.t.replace(' — ', ', ').toLowerCase().replace(/^./, function (c) { return c.toUpperCase(); })) +
      row('Linha da tabela', faixa(t, r.i)) +
      row('Taxa efetiva de retenção', pct(r.efetiva, 1)) +
      '<p class="irs-resumo"><strong>A conta:</strong> ' + conta + '</p>' +
      '<p class="irs-res-t">Escalão de IRS (por ano)</p>' +
      row('Escalão de IRS', a.isento ? 'Sem IRS a pagar' : (a.i + 1) + '.º escalão', true) +
      row('Taxa do escalão (marginal)', pct(a.taxa, 1)) +
      row('Rendimento bruto anual', eur(a.bruto), false, '14 meses de ' + oque) +
      row('Dedução específica', eur(a.ded)) +
      row('Rendimento coletável', eur(a.col)) +
      row('IRS antes das deduções à coleta', eur(a.isento ? 0 : a.coleta)) +
      row('Taxa média sobre o rendimento coletável', pct(a.isento ? 0 : a.media, 2)) +
      '<p class="irs-resumo">' + resumo + '</p>' +
      '<p class="dp-foot">A retenção segue a fórmula do Despacho n.º 233-A/2026 para residentes no continente e pode diferir em cêntimos do teu recibo. O escalão anual é calculado para um titular, só com este rendimento e sem tributação conjunta' + (x.def ? ', e não conta com os benefícios fiscais das pessoas com deficiência no IRS anual' : '') + '. A dedução específica é o maior valor entre ' + eur(DED_ESP) + ' (8,54 × IAS) e os descontos para a Segurança Social. Não é aconselhamento fiscal.</p></div>';
  }

  function render() {
    var root = document.getElementById('lf-dp');
    if (!root) return;
    var op = function (v, sel, txt) { return '<option value="' + v + '"' + (String(sel) === String(v) ? ' selected' : '') + '>' + txt + '</option>'; };
    var tabs = GRUPOS.map(function (g) {
      return '<div class="irs-grp"><span class="irs-grp-l">' + g.l + '</span><div class="irs-tabs">' + g.k.map(function (k) {
        return '<button type="button" class="dp-tab' + (S.tab === k ? ' is-active' : '') + '" data-tab="' + k + '">Tabela ' + k + '</button>';
      }).join('') + '</div></div>';
    }).join('');
    var atual = tabela(S.tab), temDep = ['I', 'II', 'III', 'V', 'VI', 'VII'].indexOf(S.tab) > -1, pens = atual.tipo === 'H', fa = S.tab === 'X' || S.tab === 'XI';
    var formula = 'Retenção = R × taxa marginal máxima − parcela a abater' + (temDep ? ' − (parcela por dependente × número de dependentes)' : '') + ', em que R é ' + (pens ? 'a pensão mensal bruta' : 'a remuneração mensal bruta') + '. ';
    var nota = pens
      ? 'Nas pensões, por cada dependente a cargo soma-se à parcela a abater 42,86€ (casado, único titular), 21,43€ (casado, dois titulares) ou 34,29€ (não casado).' + (fa ? ' Os deficientes das Forças Armadas têm ainda a parcela adicional da tabela.' : '')
      : (temDep ? 'Com três ou mais dependentes, a taxa marginal máxima baixa um ponto percentual. ' : '') + 'A taxa efetiva no limite é a retenção a dividir pela remuneração no topo de cada linha, sem dependentes.';

    root.innerHTML =
      '<div class="max-width-37-5 dp-lead"><div class="text-color-secondary"><div class="text-size-large"><div class="text-align-center">As 11 tabelas de retenção na fonte e os escalões de IRS em vigor em 2026, com os valores oficiais. Indica o teu salário ou pensão e vê quanto te retêm por mês e em que escalão ficas.</div></div></div></div>' +
      '<div class="dp-meta"><div class="dp-authors">' +
      '<a class="dp-author" href="https://www.literaciafinanceira.pt/autores/franklin-silva"><img class="dp-author-img" src="https://cdn.prod.website-files.com/67922c46c9da6bf5d9bfdf20/683ee0ae5bc67fe0ef48466e_franklin-silva.avif" alt="Franklin Silva"><span><span class="dp-author-l">Autor</span><span class="dp-author-n">Franklin Silva</span></span></a>' +
      '<a class="dp-author" href="https://www.literaciafinanceira.pt/autores/pedro-braz"><img class="dp-author-img" src="https://cdn.prod.website-files.com/67922c46c9da6bf5d9bfdf20/683ee0f9b80a20ec1767fab5_Pedro-Braz.avif" alt="Pedro Braz"><span><span class="dp-author-l">Revisor</span><span class="dp-author-n">Pedro Braz</span></span></a>' +
      '<span class="dp-author dp-author-date"><span class="dp-author-ico">' + ico(CAL) + '</span><span><span class="dp-author-l">Última verificação</span><span class="dp-author-n">' + VERIFICADO + '</span></span></span>' +
      '</div></div>' +

      '<div class="irs-card"><p class="irs-card-t">Quanto IRS te retêm e em que escalão estás?</p><p class="irs-card-s">Preenche só um dos valores. O outro é calculado por nós, a contar com 14 meses por ano.</p>' +
      '<div class="irs-form">' +
      '<div><label class="dp-label" for="irsMes">Valor bruto por mês</label><div class="dp-input-wrap"><input id="irsMes" class="dp-input" type="text" inputmode="numeric" autocomplete="off" value="' + milhar(String(Math.round(S.mes))) + '"><span class="dp-input-unit">€</span></div></div>' +
      '<div class="irs-ou" aria-hidden="true"><span>ou</span></div>' +
      '<div><label class="dp-label" for="irsBruto">Valor bruto por ano</label><div class="dp-input-wrap"><input id="irsBruto" class="dp-input" type="text" inputmode="numeric" autocomplete="off" value="' + milhar(String(Math.round(S.mes * 14))) + '"><span class="dp-input-unit">€</span></div></div>' +
      '</div><div class="irs-form2">' +
      '<div><label class="dp-label" for="irsTipo">Rendimento</label><select class="dp-input dp-input-select" id="irsTipo">' + op('A', S.tipo, 'Salário') + op('H', S.tipo, 'Pensão') + '</select></div>' +
      '<div><label class="dp-label" for="irsSit">Situação</label><select class="dp-input dp-input-select" id="irsSit">' + op('nc', S.sit, 'Não casado') + op('c2', S.sit, 'Casado, dois titulares') + op('c1', S.sit, 'Casado, único titular') + '</select></div>' +
      '<div><label class="dp-label" for="irsDep">Dependentes</label><select class="dp-input dp-input-select" id="irsDep">' + [0, 1, 2, 3, 4, 5, 6].map(function (d) { return op(d, S.dep, d === 0 ? 'Nenhum' : String(d)); }).join('') + '</select></div>' +
      '<label class="irs-check"><input type="checkbox" id="irsDef"' + (S.def ? ' checked' : '') + '><span>Tenho deficiência (incapacidade de 60% ou mais)</span></label>' +
      '<button type="button" class="dp-btn" id="irsCalc">Calcular</button></div>' + resultado() + '</div>' +

      '<div class="irs-sec"><h2 class="irs-h2">Tabelas de retenção na fonte de IRS 2026</h2>' +
      '<p class="irs-p">A retenção na fonte é o IRS que a entidade patronal ou a Segurança Social desconta todos os meses no teu salário ou pensão, por conta do imposto final. As tabelas de 2026 para o continente estão no <a href="' + L.desp + '" target="_blank" rel="noopener">Despacho n.º 233-A/2026, de 6 de janeiro</a>, e aplicam-se desde 1 de janeiro. São 11: três para trabalho dependente, quatro para trabalhadores com deficiência e quatro para pensões.</p>' +
      tabs + '<p class="irs-p irs-tab-t"><strong>Tabela ' + atual.k + ':</strong> ' + (pens ? 'pensões, ' : 'trabalho dependente, ') + atual.t.replace(' — ', ', ').toLowerCase() + '.</p>' +
      tabRetencao() +
      '<p class="dp-foot">' + formula + nota + ' Exemplo na Tabela I, com 1.500€ e sem dependentes: 1.500€ × 24,10% − 193,33€ = 168,17€. Para o valor exato do teu salário líquido, usa o <a href="' + L.sal + '">simulador de salário líquido</a>.</p>' +
      '<p class="irs-p irs-ra"><strong>Açores e Madeira:</strong> as regiões autónomas têm tabelas próprias, com retenções mais baixas. Estão no <a href="' + L.acores + '" target="_blank" rel="noopener">Despacho n.º 1179/2026</a> (Açores) e no <a href="' + L.madeira + '" target="_blank" rel="noopener">Despacho n.º 19/2026 da Secretaria Regional das Finanças</a> (Madeira).</p></div>' +

      '<div class="irs-sec"><h2 class="irs-h2">Escalões de IRS 2026</h2>' +
      '<p class="irs-p">Os escalões aplicam-se ao rendimento coletável de 2026, que declaras em 2027. Foram fixados pelo <a href="' + L.lei + '" target="_blank" rel="noopener">Orçamento do Estado para 2026 (Lei n.º 73-A/2025)</a>, que alterou o <a href="' + L.art68 + '" target="_blank" rel="noopener">artigo 68.º do Código do IRS</a>: os limites subiram 3,51% e as taxas do 2.º ao 5.º escalão desceram 0,3 pontos percentuais.</p>' +
      tabEscaloes(S.res && !S.res.an.isento ? S.res.an.i : -1) +
      '<p class="dp-foot">IRS = rendimento coletável × taxa do escalão − parcela a abater. A parcela a abater é calculada por nós a partir das taxas da lei e dá o mesmo resultado que aplicar cada taxa à sua fatia de rendimento. Rendimentos coletáveis acima de 80.000€ pagam ainda a taxa adicional de solidariedade (2,5% até 250.000€ e 5% acima).</p>' +
      '<div class="irs-aviso"><div><strong>Pode mudar ainda em 2026:</strong> o Governo entregou no Parlamento, a 21 de setembro de 2026, uma proposta para baixar as taxas do 1.º ao 6.º escalão (para 12,2%, 15,2%, 20,7%, 23,6%, 30,6% e 34,6%), com efeitos em todo o ano de 2026 e novas tabelas de retenção a partir de novembro. À data da última verificação ainda não era lei. <a href="' + L.prop + '" target="_blank" rel="noopener">Fonte: ECO</a>.</div></div>' +
      '<ul class="irs-fontes"><li><a href="' + L.desp + '" target="_blank" rel="noopener">Despacho n.º 233-A/2026, de 6 de janeiro</a>: tabelas de retenção na fonte do continente.</li><li><a href="' + L.circ + '" target="_blank" rel="noopener">Circular n.º 1/2026 da Autoridade Tributária</a>: instruções de aplicação das tabelas.</li><li><a href="' + L.lei + '" target="_blank" rel="noopener">Lei n.º 73-A/2025, de 30 de dezembro</a> (Orçamento do Estado para 2026): escalões de IRS.</li></ul></div>';
  }

  function num(id) { var el = document.getElementById(id); return el ? parseInt(String(el.value).replace(/\D/g, ''), 10) || 0 : 0; }
  function lerForm() {
    S.mes = Math.min(num('irsMes'), 10000000);
    var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    S.tipo = g('irsTipo') || 'A'; S.sit = g('irsSit') || 'nc'; S.dep = parseInt(g('irsDep'), 10) || 0;
    var d = document.getElementById('irsDef'); S.def = !!(d && d.checked);
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest || !t.closest('#lf-dp')) return;
    var tab = t.closest('[data-tab]');
    if (tab) { lerForm(); S.tab = tab.getAttribute('data-tab'); render(); return; }
    if (t.closest('#irsCalc')) {
      lerForm();
      S.res = calcular(S.mes, S.tipo, S.sit, S.dep, S.def);
      S.tab = S.res.ret.k;
      render();
      var r = document.getElementById('irsRes');
      if (r && r.scrollIntoView) r.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  document.addEventListener('input', function (e) {
    var id = e.target && e.target.id;
    if (id !== 'irsBruto' && id !== 'irsMes') return;
    var v = parseInt(String(e.target.value).replace(/\D/g, ''), 10);
    e.target.value = isNaN(v) ? '' : milhar(String(v));
    var outro = document.getElementById(id === 'irsBruto' ? 'irsMes' : 'irsBruto');
    if (outro) outro.value = isNaN(v) ? '' : milhar(String(id === 'irsBruto' ? Math.round(v / 14) : v * 14));
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && (e.target.id === 'irsBruto' || e.target.id === 'irsMes')) { var b = document.getElementById('irsCalc'); if (b) b.click(); }
  });

  function montar() {
    if (!document.getElementById('lf-dp')) {
      var h1 = document.querySelector('h1.heading-style-h2'), div = document.createElement('div');
      div.id = 'lf-dp';
      if (h1 && h1.parentNode) h1.parentNode.appendChild(div); else return;
    }
    render();
  }
  window.__lfIrsCalc = calcular;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();

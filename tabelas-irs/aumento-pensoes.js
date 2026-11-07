/* Simulador do aumento das pensoes em 2027 - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/). Monta-se em #lf-pensoes (embed dentro do artigo aumento-pensoes-2027).
   Regras:
   - Lei n.o 53-B/2006, art. 6.o: escaloes em multiplos do IAS do ano da atualizacao. Com PIB entre 2% e 3%:
     ate 2 IAS = inflacao + 20% do PIB (minimo 0,5 p.p.), arredondado a 1 casa; 2 a 6 IAS = inflacao;
     6 a 12 IAS = inflacao - 0,25 p.p.; acima de 12 IAS sem atualizacao.
   - Aumentos minimos (como no art. 3.o da Portaria n.o 480-B/2025/1): no escalao 2-6 IAS, pelo menos o aumento
     de uma pensao de 2 IAS; no escalao 6-12 IAS, pelo menos o aumento de uma pensao de 6 IAS.
   - Valores de 2027 PREVISTOS: estimativa do Governo de 6/11/2026 (dados do INE de 30/10/2026): 3,3% e 2,79%.
     IAS 2027 = 537,13 x 1,033 = 554,86. ATUALIZAR quando sair a portaria de dezembro de 2026 (so mudar CONFIG).
   - Suplemento extraordinario de dezembro de 2026: Decreto-Lei n.o 201/2026, art. 3.o (200/150/100 euros ate 1, 2 e 3 IAS de 2026).
   - CGA: paga no dia 19 ou no dia util anterior (abc.portal.cga.pt/pagamentos). Seguranca Social: calendario mensal. */
(function () {
  'use strict';
  if (window.__lfPensoesInit) return;
  window.__lfPensoesInit = true;

  var CONFIG = {
    ano: 2027,
    final: false,                 /* true quando a portaria for publicada */
    ias: 554.86,
    taxas: [0.033, 0.0279, 0.0254],
    ias2026: 537.13,
    suplemento: [[1, 200], [2, 150], [3, 100]]
  };

  function el(id) { return document.getElementById(id); }
  function radio(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function f(v) { return window.LFK && LFK.fmt ? LFK.fmt(v) : (Math.round(v * 100) / 100) + '€'; }
  function pct(v) { return (window.LFK && LFK.fmt ? LFK.fmt(Math.round(v * 10000) / 100, { currency: false }) : String(Math.round(v * 10000) / 100)) + '%'; }
  function c(v) { return Math.round(v * 100) / 100; }
  function kv(a, b, total) { return '<div class="lfk-kv' + (total ? ' is-total' : '') + '"><span>' + a + '</span><span>' + b + '</span></div>'; }

  /* Exposto para testes. p = pensao bruta mensal em 2026 (soma de todas as pensoes). */
  function simular(p) {
    var K = CONFIG, I = K.ias, t = K.taxas;
    var l2 = c(2 * I), l6 = c(6 * I), l12 = c(12 * I);
    var esc, taxa, aum, minimo = 0;
    if (p <= l2) { esc = 1; taxa = t[0]; aum = c(p * taxa); }
    else if (p <= l6) { esc = 2; taxa = t[1]; minimo = c(l2 * t[0]); aum = Math.max(c(p * taxa), minimo); }
    else if (p <= l12) { esc = 3; taxa = t[2]; minimo = c(l6 * t[1]); aum = Math.max(c(p * taxa), minimo); }
    else { esc = 4; taxa = 0; aum = 0; }
    var sup = 0;
    for (var i = 0; i < K.suplemento.length; i++) {
      if (p > 0 && p <= c(K.suplemento[i][0] * K.ias2026)) { sup = K.suplemento[i][1]; break; }
    }
    return {
      esc: esc, taxa: taxa, aumento: aum, usouMinimo: minimo > 0 && aum === minimo && c(p * taxa) < minimo,
      nova: c(p + aum), ano: c(aum * 14), pct: p > 0 ? aum / p : 0, sup: sup, l2: l2, l6: l6, l12: l12
    };
  }
  window.__lfPensoesSimular = simular;
  window.__lfPensoesConfig = CONFIG;

  function html() {
    var ajuda = function (t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; };
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Quanto sobe a tua pensão em ' + CONFIG.ano + '</div>' +
      '<form class="lfk-stack" id="pen-form" onsubmit="return false">' +
      '<div class="lfk-field"><label class="lfk-label" for="pen-valor">Pensão bruta por mês em 2026' + ajuda('O valor antes de descontos de IRS que recebes hoje por mês. Se tens mais do que uma pensão, soma-as: o escalão é decidido pelo valor total.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="pen-valor" name="pensao" inputmode="decimal" value="800"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><span class="lfk-label">Quem paga a pensão' + ajuda('A Caixa Geral de Aposentações paga as pensões dos funcionários públicos que entraram no Estado até 2005. Os aumentos são iguais, mudam as datas de pagamento.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="pen-ent" value="ss" checked> <span>Segurança Social</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="pen-ent" value="cga"> <span>Caixa Geral de Aposentações</span></label>' +
      '</div></div>' +
      '<button type="button" class="lfk-btn is-block" id="pen-calcular">Calcular</button>' +
      '</form></div></div>' +
      '<div class="lfk-calc-results" id="pen-area">' +
      '<div id="pen-resultados" hidden>' +
      '<div class="lfk-card">' +
      '<div class="lfk-card-head"><div class="lfk-h-sm">Resultados</div></div>' +
      '<div id="pen-r-linhas"></div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="pen-r-frase"></p>' +
      '<div id="pen-r-alerta"></div>' +
      '</div></div>' +
      '<div class="lfk-empty" id="pen-placeholder"><p>Escreve o valor da tua pensão e clica em <b>Calcular</b> para veres o aumento.</p></div>' +
      '</div>' +
      '</div>';
  }

  var NOMES = ['', 'até 2 IAS', 'de 2 a 6 IAS', 'de 6 a 12 IAS', 'acima de 12 IAS'];

  function calcular() {
    var p = LFK.num(el('pen-valor').value);
    if (!(p > 0)) return false;
    var cga = radio('pen-ent') === 'cga';
    var r = simular(p), K = CONFIG;

    var linhas = kv('Pensão em ' + K.ano + ', por mês', f(r.nova), true);
    linhas += kv('Aumento por mês', f(r.aumento) + (r.esc < 4 ? ' (' + pct(r.pct) + ')' : ''));
    linhas += kv('Aumento por ano (14 pagamentos)', f(r.ano));
    linhas += kv('Escalão', NOMES[r.esc]);
    linhas += kv('Suplemento em dezembro de 2026', f(r.sup));
    el('pen-r-linhas').innerHTML = linhas;

    var frase;
    if (r.esc === 4) {
      frase = 'A tua pensão passa os ' + f(r.l12) + ' (12 IAS) e por isso não é atualizada em ' + K.ano + ', tal como em 2026.';
    } else if (r.usouMinimo) {
      frase = 'A taxa do teu escalão (' + pct(r.taxa) + ') daria menos do que o aumento mínimo, por isso recebes ' + f(r.aumento) + ' por mês, o mesmo que uma pensão no limite do escalão anterior.';
    } else {
      frase = 'A tua pensão está no escalão ' + NOMES[r.esc] + ' e sobe ' + pct(r.taxa) + ': mais ' + f(r.aumento) + ' por mês, a partir da pensão de janeiro.';
    }
    if (r.esc < 4) frase += cga
      ? ' A CGA paga no dia 19 de cada mês ou no dia útil anterior, por isso o primeiro pagamento com o aumento deve chegar a 19 de janeiro.'
      : ' A Segurança Social paga as pensões no início do mês, normalmente perto do dia 8, na data do calendário de pagamentos.';
    el('pen-r-frase').textContent = frase;

    var alerta = '';
    if (r.sup > 0) alerta += '<div class="lfk-alert is-ok" style="margin-top:1rem">Antes do aumento, recebes ' + f(r.sup) + ' de suplemento extraordinário com a pensão de dezembro de 2026, sem pedido e sem retenção de IRS. É um pagamento único, que não fica na pensão.</div>';
    if (!K.final) alerta += '<div class="lfk-alert is-warn" style="margin-top:1rem">Estimativa com os dados da inflação de outubro. Os valores finais só ficam fixados na portaria de atualização, no fim de dezembro de 2026.</div>';
    el('pen-r-alerta').innerHTML = alerta;
  }

  function montar() {
    var root = el('lf-pensoes');
    if (!root) return;
    root.className = 'lfk';
    root.innerHTML = html();
    var calcEl = root.querySelector('.lfk-calc');
    if (calcEl && root.closest('.w-richtext')) { calcEl.style.width = '100%'; calcEl.style.minWidth = '0'; }
    // Mesmo espaço depois do simulador que o do parágrafo antes dele (o embed não tem margem própria)
    var bloco = root.closest('[data-rt-embed-type]') || root;
    var antes = bloco.previousElementSibling;
    if (antes) bloco.style.marginBottom = getComputedStyle(antes).marginBottom;
    if (LFK.selects) LFK.selects(root);
    if (LFK.numInputs) LFK.numInputs(root);
    if (LFK.theme) LFK.theme(root);
    LFK.calc(el('pen-calcular'), { results: '#pen-resultados', empty: '#pen-placeholder', run: calcular });
  }

  function iniciar() {
    if (window.LFK && LFK.calc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

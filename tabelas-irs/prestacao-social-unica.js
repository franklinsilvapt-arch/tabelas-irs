/* Calculadora da Prestacao Social Unica (PSU) - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/). Monta-se em #lf-psu (embed dentro do artigo).
   Regras: Decreto-Lei n.o 166/2026, de 13 de agosto (efeitos a 31/12/2026).
   - Valor de referencia (VRP) = 50% do IAS (art. 7.o). IAS 2026 = 537,13€ -> 268,57€.
   - Adultos equivalentes (art. 24.o): 1 pelo titular, 0,7 por cada outro adulto, 0,5 por cada menor.
     PSU base = VRP x AE.
   - Rendimentos (art. 10.o a 17.o), por mes: trabalho liquido (apos contribuicoes e retencao de IRS) com
     duodecimos dos subsidios, pensoes com duodecimos, outras prestacoes continuadas (exceto abono, deficiencia
     e dependencia), rendas ou 5% do VPT de imoveis que nao sejam a habitacao permanente, e juros:
     se os ativos financeiros passarem 15 x IAS, conta pelo menos a taxa Euribor 12m + 1 p.p. (minimo 3%).
   - Acesso (art. 8.o): R < PSU base; patrimonio mobiliario e bens moveis sujeitos a registo <= 60 x IAS cada.
   - CIT (art. 28.o): rendimentos de trabalho ate 20% do IAS contam por inteiro + 50% do excesso.
   - PSU global = PSU base + CIT - R (art. 25.o). Majoracao por parentalidade (art. 26.o): 80% IAS - peso x VRP.
     Majoracao por desemprego (art. 27.o): completa ate 80% do IAS, nos primeiros 6 meses.
     Teto: 6 x IAS. Abaixo de 10€ nao ha pagamento. */
(function () {
  'use strict';
  if (window.__lfPsuInit) return;
  window.__lfPsuInit = true;

  var IAS = 537.13;
  var VRP = 268.57;
  var TAXA_JUROS = 0.04225; /* Euribor 12m (3,225% a 28/10/2026) + 1 p.p.; a oficial e a do fim de dezembro */

  function el(id) { return document.getElementById(id); }
  function radio(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function f(v) { return window.LFK && LFK.fmt ? LFK.fmt(v) : (Math.round(v * 100) / 100) + '€'; }
  function c(v) { return Math.round(v * 100) / 100; }
  function kv(a, b) { return '<div class="lfk-kv"><span>' + a + '</span><span>' + b + '</span></div>'; }
  function opts(n, sel) { var s = ''; for (var i = 0; i <= n; i++) s += '<option value="' + i + '"' + (i === sel ? ' selected' : '') + '>' + i + '</option>'; return s; }

  function html() {
    var ajuda = function (t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; };
    var num = function (id, label, help, val) {
      return '<div class="lfk-field"><label class="lfk-label" for="' + id + '">' + label + ajuda(help) + '</label>' +
        '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="' + id + '" inputmode="decimal" value="' + val + '"><span class="lfk-unit">€</span></div></div>';
    };
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Calculadora da prestação social única</div>' +
      '<form class="lfk-stack" id="psu-form" onsubmit="return false">' +
      '<div class="lfk-field"><label class="lfk-label" for="psu-adultos">Outros adultos em casa' + ajuda('Pessoas com 18 anos ou mais que vivem contigo e partilham despesas: cônjuge, filhos maiores, pais, irmãos e outros familiares até ao 3.º grau. Se já tens a idade da reforma, só conta o cônjuge.') + '</label>' +
      '<select class="lfk-input" id="psu-adultos">' + opts(5, 0) + '</select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="psu-menores">Menores em casa' + ajuda('Filhos e outros menores que vivem contigo, incluindo adotados e crianças confiadas por decisão judicial.') + '</label>' +
      '<select class="lfk-input" id="psu-menores">' + opts(6, 0) + '</select></div>' +
      num('psu-trab', 'Salários líquidos por mês', 'Soma do que recebem por mês todas as pessoas da casa que trabalham, já sem descontos para a Segurança Social e sem retenção de IRS. Inclui recibos verdes.', '0') +
      '<div class="lfk-field"><span class="lfk-label">Subsídios de férias e de Natal' + ajuda('Se recebem 14 salários por ano, a Segurança Social soma 1/12 de cada subsídio ao salário de cada mês.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="psu-sub" value="14" checked> <span>14 salários por ano</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="psu-sub" value="12"> <span>12 ou já em duodécimos</span></label>' +
      '</div></div>' +
      num('psu-pens', 'Pensões por mês', 'Pensões de todas as pessoas da casa, de Portugal ou do estrangeiro, incluindo pensões de alimentos. Contamos 14 pagamentos por ano.', '0') +
      num('psu-outros', 'Outros rendimentos por mês', 'Outras prestações sociais que recebam de forma continuada, apoios à renda e rendas de imóveis. O abono de família e as prestações por deficiência ou dependência não contam.', '0') +
      num('psu-poup', 'Poupanças e investimentos', 'Depósitos, certificados de aforro, ações, fundos e outras aplicações de todas as pessoas da casa. Acima de 60 vezes o IAS (32.227,80€) não há direito à PSU.', '0') +
      num('psu-imo', 'Valor patrimonial de outros imóveis', 'O valor patrimonial tributário de casas e terrenos que não sejam a casa onde vives. Conta 5% por ano como rendimento. Se as rendas que recebes forem mais altas, põe as rendas em outros rendimentos e deixa este campo a 0.', '0') +
      num('psu-moveis', 'Carros e outros bens registados', 'Valor de carros, motas e barcos. Acima de 60 vezes o IAS (32.227,80€) não há direito à PSU.', '0') +
      '<div class="lfk-field"><span class="lfk-label">Situação especial' + ajuda('Desemprego: alguém da casa ficou sem trabalho sem ser por vontade própria e não tem subsídio de desemprego, por não ter descontos suficientes ou por já o ter esgotado. Parentalidade: alguém está de licença parental sem subsídio, por não ter descontos suficientes.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="psu-maj" value="nenhuma" checked> <span>Nenhuma</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="psu-maj" value="desemprego"> <span>Desemprego sem subsídio</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="psu-maj" value="par-tu"> <span>Licença parental, eu</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="psu-maj" value="par-outro"> <span>Licença parental, outro adulto</span></label>' +
      '</div></div>' +
      '<button type="button" class="lfk-btn is-block" id="psu-calcular">Calcular</button>' +
      '</form></div></div>' +
      '<div class="lfk-calc-results" id="psu-area">' +
      '<div id="psu-resultados" hidden>' +
      '<div class="lfk-card">' +
      '<div class="lfk-card-head"><div class="lfk-h-sm">Resultados</div></div>' +
      '<div id="psu-r-linhas"></div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="psu-r-frase"></p>' +
      '<div id="psu-r-alerta"></div>' +
      '</div>' +
      '<div class="lfk-card" style="margin-top:1.5rem">' +
      '<div class="lfk-card-head"><div class="lfk-h-sm">Como é calculado, por mês</div></div>' +
      '<div id="psu-r-passos"></div>' +
      '</div></div>' +
      '<div class="lfk-empty" id="psu-placeholder"><p>Preenche os dados e clica em <b>Calcular</b> para veres se tens direito e quanto recebes.</p></div>' +
      '</div>' +
      '</div>';
  }

  /* Exposto para testes. o: { adultos, menores, trab, meses (12|14), pens, outros, poup, imo, moveis, maj } */
  function simular(o) {
    var r = {};
    var AE = 1 + 0.7 * (o.adultos || 0) + 0.5 * (o.menores || 0);
    r.AE = c(AE);
    r.base = c(VRP * AE);
    r.W = c((o.trab || 0) * ((o.meses || 14) / 12));
    r.P = c((o.pens || 0) * 14 / 12);
    r.O = c(o.outros || 0);
    r.cap = (o.poup || 0) > 15 * IAS ? c((o.poup || 0) * TAXA_JUROS / 12) : 0;
    r.imo = c((o.imo || 0) * 0.05 / 12);
    r.R = c(r.W + r.P + r.O + r.cap + r.imo);
    r.patrimonio = (o.poup || 0) > 60 * IAS;
    r.moveis = (o.moveis || 0) > 60 * IAS;
    r.rendimentos = !(r.R < r.base);
    r.direito = !r.patrimonio && !r.moveis && !r.rendimentos;
    var lim = 0.2 * IAS;
    r.CIT = c(Math.min(r.W, lim) + 0.5 * Math.max(0, r.W - lim));
    r.global = r.direito ? c(r.base + r.CIT - r.R) : 0;
    r.maj = 0;
    if (r.direito) {
      if (o.maj === 'desemprego' && r.global < 0.8 * IAS) r.maj = c(0.8 * IAS - r.global);
      else if (o.maj === 'par-tu') r.maj = c(0.8 * IAS - VRP);
      else if (o.maj === 'par-outro' && (o.adultos || 0) > 0) r.maj = c(0.8 * IAS - 0.7 * VRP);
    }
    var total = r.global + r.maj;
    r.teto = total > 6 * IAS;
    if (r.teto) total = 6 * IAS;
    r.minimo = r.direito && total < 10;
    r.psu = r.minimo ? 0 : c(total);
    return r;
  }
  window.__lfPsuSimular = simular;

  function calcular() {
    var o = {
      adultos: +el('psu-adultos').value, menores: +el('psu-menores').value,
      trab: LFK.num(el('psu-trab').value) || 0, meses: +radio('psu-sub') || 14,
      pens: LFK.num(el('psu-pens').value) || 0, outros: LFK.num(el('psu-outros').value) || 0,
      poup: LFK.num(el('psu-poup').value) || 0, imo: LFK.num(el('psu-imo').value) || 0,
      moveis: LFK.num(el('psu-moveis').value) || 0, maj: radio('psu-maj')
    };
    var r = simular(o);
    el('psu-r-linhas').innerHTML = '<div class="lfk-kv is-total"><span>PSU por mês</span><span>' + f(r.psu) + '</span></div>' + kv('Por ano', f(c(r.psu * 12)));

    var frase;
    if (r.patrimonio) frase = 'Não tens direito à PSU: as poupanças e investimentos da casa passam 60 vezes o IAS (' + f(c(60 * IAS)) + ').';
    else if (r.moveis) frase = 'Não tens direito à PSU: o valor dos carros e outros bens registados passa 60 vezes o IAS (' + f(c(60 * IAS)) + ').';
    else if (r.rendimentos) frase = 'Não tens direito à PSU: os rendimentos da casa (' + f(r.R) + ' por mês) não ficam abaixo do montante base, de ' + f(r.base) + ' por mês para a tua casa.';
    else if (r.minimo) frase = 'A conta dá menos de 10€ por mês e, abaixo desse valor, a PSU não é paga.';
    else frase = 'Tens direito a cerca de ' + f(r.psu) + ' por mês. É o montante base da tua casa mais o incentivo ao trabalho, menos os rendimentos' + (r.maj ? ', com a majoração somada no fim.' : '.');
    el('psu-r-frase').textContent = frase;

    var alerta = '<div class="lfk-alert is-warn" style="margin-top:1rem">Valores com o IAS de 2026 (537,13€). A PSU começa a 31 de dezembro de 2026 e, em 2027, os valores sobem com o novo IAS, publicado no fim de dezembro.</div>';
    if (r.cap) alerta += '<div class="lfk-alert" style="margin-top:1rem">Como as poupanças passam 15 vezes o IAS (' + f(c(15 * IAS)) + '), contam juros de pelo menos 4,2% ao ano, mesmo que recebas menos. A taxa oficial é a Euribor a 12 meses do fim de dezembro mais 1 ponto.</div>';
    if (r.direito && !r.minimo && r.W + r.P + r.O + r.cap + r.imo < r.base) {
      if (o.maj === 'desemprego' && !r.maj) alerta += '<div class="lfk-alert" style="margin-top:1rem">A majoração por desemprego não se aplica porque a PSU já chega a 80% do IAS (' + f(c(0.8 * IAS)) + ').</div>';
      if (o.maj === 'desemprego' && r.maj) alerta += '<div class="lfk-alert" style="margin-top:1rem">A majoração por desemprego só é paga nos primeiros 6 meses. Depois, a PSU volta a ' + f(r.global) + ' por mês.</div>';
      if (o.maj === 'par-outro' && !o.adultos) alerta += '<div class="lfk-alert" style="margin-top:1rem">Indica pelo menos um outro adulto em casa para contar a majoração por parentalidade de outra pessoa.</div>';
    }
    if (r.teto) alerta += '<div class="lfk-alert" style="margin-top:1rem">A PSU não pode passar 6 vezes o IAS (' + f(c(6 * IAS)) + ') por mês.</div>';
    el('psu-r-alerta').innerHTML = alerta;

    var passos = kv('Adultos equivalentes', String(r.AE).replace('.', ','));
    passos += kv('Montante base', f(r.base));
    if (r.W) passos += kv('Incentivo ao trabalho', '+' + f(r.CIT));
    passos += kv('Rendimentos da casa', '-' + f(r.R));
    if (r.maj) passos += kv('Majoração', '+' + f(r.maj));
    passos += kv('PSU', f(r.psu));
    var nota = 'O montante base é 268,57€ (metade do IAS) vezes os adultos equivalentes: 1 por ti, 0,7 por cada outro adulto e 0,5 por cada menor.';
    if (r.W) nota += ' No incentivo ao trabalho, os primeiros ' + f(c(0.2 * IAS)) + ' de salário contam por inteiro e o resto conta metade.';
    el('psu-r-passos').innerHTML = passos + '<p class="lfk-table-note">' + nota + '</p>';
  }

  function montar() {
    var root = el('lf-psu');
    if (!root) return;
    root.className = 'lfk';
    root.innerHTML = html();
    var calcEl = root.querySelector('.lfk-calc');
    if (calcEl && root.closest('.w-richtext')) { calcEl.style.width = '100%'; calcEl.style.minWidth = '0'; }
    if (LFK.selects) LFK.selects(root);
    if (LFK.numInputs) LFK.numInputs(root);
    if (LFK.theme) LFK.theme(root);
    LFK.calc(el('psu-calcular'), { results: '#psu-resultados', empty: '#psu-placeholder', run: calcular });
  }

  function iniciar() {
    if (window.LFK && LFK.calc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

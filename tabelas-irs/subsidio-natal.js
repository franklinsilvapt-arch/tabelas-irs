/* Simulador de subsidio de Natal 2026 - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/) e o motor de retencao do tabelas-irs.js (mesmo repositorio),
   que traz as tabelas do continente (data/irs.json, atualizado pelo workflow), dos Acores e da Madeira.
   Regras:
   - Valor: um mes de retribuicao, proporcional ao tempo de servico no ano de admissao, de cessacao ou de suspensao
     do contrato (artigo 263.o do Codigo do Trabalho). Pago ate 15 de dezembro.
   - IRS: retencao autonoma, a tabela aplica-se ao valor do subsidio (artigo 99.o-C, n.o 5, do CIRS). Pago em
     duodecimos ou em partes, cada pagamento leva a parte proporcional desse imposto (n.o 6).
   - Seguranca Social: 11% a cargo do trabalhador.
   - Novembro de 2026: retencao a metade no continente (Despacho n.o 12523-A/2026) e nos Acores (Despacho
     n.o 12610-A/2026), tambem no subsidio de Natal pago nesse mes. Ficam de fora os rendimentos mensais acima do
     limite superior do penultimo escalao da tabela. A Madeira anunciou a 27/10/2026 uma descida propria, que so conta quando publicar as novas tabelas. */
(function () {
  'use strict';
  if (window.__lfSnInit) return;
  window.__lfSnInit = true;

  var NOV_ATIVO = new Date() < new Date(2026, 11, 1);
  var NOV_REG = { C: 'No continente', A: 'Nos Açores' };
  var SS = 0.11;

  function el(id) { return document.getElementById(id); }
  function radio(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function f(v) { return window.LFK && LFK.fmt ? LFK.fmt(v) : (Math.round(v * 100) / 100) + '€'; }
  function pct(v) { return (window.LFK && LFK.fmt ? LFK.fmt(v, { currency: false }) : String(Math.round(v * 100) / 100)) + '%'; }
  function c(v) { return Math.round(v * 100) / 100; }

  function html() {
    var meses = '';
    for (var m = 12; m >= 1; m--) meses += '<option value="' + m + '">' + (m === 12 ? 'O ano todo (12 meses)' : m + (m === 1 ? ' mês' : ' meses')) + '</option>';
    var dep = '';
    for (var d = 0; d <= 6; d++) dep += '<option value="' + d + '">' + (d === 0 ? 'Nenhum' : d) + '</option>';
    var ajuda = function (t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; };
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Calculadora de subsídio de Natal</div>' +
      '<form class="lfk-stack" id="sn-form" onsubmit="return false">' +
      '<div class="lfk-field"><label class="lfk-label" for="sn-salario">Salário base bruto por mês' + ajuda('A tua retribuição base mensal, antes de impostos, mais as diuturnidades se as tiveres. Não incluas o subsídio de refeição nem prémios.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="sn-salario" name="salario" inputmode="decimal" value="1.500"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sn-meses">Tempo de trabalho em 2026' + ajuda('No ano em que entras ou sais da empresa, ou se o contrato esteve suspenso (por exemplo, numa baixa longa), o subsídio é proporcional ao tempo de trabalho. Nos outros casos, escolhe o ano todo.') + '</label>' +
      '<select class="lfk-input" id="sn-meses" name="meses">' + meses + '</select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sn-regiao">Morada fiscal</label>' +
      '<select class="lfk-input" id="sn-regiao" name="regiao"><option value="C">Portugal continental</option><option value="A">Região Autónoma dos Açores</option><option value="M">Região Autónoma da Madeira</option></select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sn-sit">Estado civil' + ajuda('Para o IRS, quem vive em união de facto conta como casado. Escolhe "um titular" se só um dos dois tem rendimentos, ou se um deles ganha 95% ou mais do total.') + '</label>' +
      '<select class="lfk-input" id="sn-sit" name="sit"><option value="nc">Não casado</option><option value="c2">Casado, dois titulares</option><option value="c1">Casado, um titular</option></select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sn-dep">Dependentes</label>' +
      '<select class="lfk-input" id="sn-dep" name="dep">' + dep + '</select></div>' +
      '<div class="lfk-field"><label class="lfk-check"><input type="checkbox" id="sn-def" name="def"> <span>Tenho um grau de incapacidade de 60% ou mais</span></label></div>' +
      '<div class="lfk-field"><span class="lfk-label">Como recebes o subsídio de Natal' + ajuda('Por acordo com a empresa, podes receber parte do subsídio ao longo do ano, junto com o salário (duodécimos). O resto é pago de uma vez, até 15 de dezembro.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="duo" value="0" checked> <span>Por inteiro</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="duo" value="0.5"> <span>Metade em duodécimos</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="duo" value="1"> <span>Todo em duodécimos</span></label>' +
      '</div></div>' +
      '<div class="lfk-field" id="sn-mes-wrap"><span class="lfk-label">Mês em que é pago' + ajuda('Em novembro de 2026, no continente e nos Açores, a retenção de IRS é metade da normal, também no subsídio de Natal pago nesse mês.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="mes" value="11" checked> <span>Novembro</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="mes" value="12"> <span>Dezembro</span></label>' +
      '</div></div>' +
      '<button type="button" class="lfk-btn is-block" id="sn-calcular">Calcular</button>' +
      '</form></div></div>' +
      '<div class="lfk-calc-results"><div class="lfk-empty" id="sn-placeholder"><p>Preenche os dados e clica em <b>Calcular</b> para veres os resultados.</p></div></div>' +
      '<div class="lfk-calc-results" id="sn-resultados" hidden>' +
      '<div class="lfk-card">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Resultados</h2></div>' +
      '<div class="lfk-kv is-total"><span id="sn-r-titulo">Subsídio de Natal líquido</span><span id="sn-r-liquido">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Subsídio de Natal bruto</span><span id="sn-r-bruto">0,00€</span></div>' +
      '<div class="lfk-kv"><span id="sn-r-irs-l">Retenção de IRS</span><span id="sn-r-irs">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Segurança Social (11%)</span><span id="sn-r-ss">0,00€</span></div>' +
      '<div id="sn-r-extra"></div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="sn-r-frase"></p>' +
      '<div id="sn-r-alerta"></div>' +
      '</div></div>' +
      '</div>';
  }

  function atualizarMes() {
    var w = el('sn-mes-wrap');
    if (w) w.hidden = radio('duo') === '1';
  }

  function calcular() {
    var calc = window.__lfIrsCalc, tabelas = window.__lfIrsTabelas;
    var sal = LFK.num(el('sn-salario').value);
    if (!(sal > 0) || !calc || !tabelas) return false;
    var meses = parseInt(el('sn-meses').value, 10) || 12;
    var reg = el('sn-regiao').value, sit = el('sn-sit').value, dep = parseInt(el('sn-dep').value, 10) || 0;
    var def = el('sn-def').checked, p = parseFloat(radio('duo')) || 0, mes = radio('mes') === '12' ? 12 : 11;

    var bruto = c(sal * meses / 12);
    var x = calc(bruto, 'A', sit, dep, def, reg).ret;
    var efetiva = bruto > 0 ? x.valor / bruto : 0;
    var t = tabelas[reg].filter(function (q) { return q.k === x.k; })[0];
    var limite = t && t.r.length > 1 ? t.r[t.r.length - 2][0] : null;
    var acima = limite !== null && sal > limite;
    var novPode = NOV_ATIVO && NOV_REG[reg] && !acima;

    /* Parte paga de uma vez e parte em duodecimos; cada pagamento leva a parte proporcional do IRS e da SS */
    var parteFinal = c(bruto * (1 - p)), duoMes = c(bruto * p / 12);
    var irsFinalNormal = c(parteFinal * efetiva);
    var irsFinal = novPode && mes === 11 ? c(irsFinalNormal / 2) : irsFinalNormal;
    var ssFinal = c(parteFinal * SS);
    var liqFinal = c(parteFinal - irsFinal - ssFinal);
    var irsDuo = c(duoMes * efetiva), ssDuo = c(duoMes * SS), liqDuo = c(duoMes - irsDuo - ssDuo);
    var irsTotal = c(bruto * efetiva), ssTotal = c(bruto * SS);

    var extra = '';
    if (p === 1) {
      el('sn-r-titulo').textContent = 'Recebes por mês, junto com o salário';
      el('sn-r-liquido').textContent = f(liqDuo);
      el('sn-r-bruto').textContent = f(bruto);
      el('sn-r-irs-l').textContent = 'Retenção de IRS no ano';
      el('sn-r-irs').textContent = f(irsTotal);
      el('sn-r-ss').textContent = f(ssTotal);
      extra += '<div class="lfk-kv"><span>Subsídio líquido no ano</span><span>' + f(c(bruto - irsTotal - ssTotal)) + '</span></div>';
    } else {
      el('sn-r-titulo').textContent = p === 0.5 ? 'Recebes em ' + (mes === 11 ? 'novembro' : 'dezembro') + ' (a outra metade)' : 'Subsídio de Natal líquido';
      el('sn-r-liquido').textContent = f(liqFinal);
      el('sn-r-bruto').textContent = f(parteFinal);
      el('sn-r-irs-l').textContent = 'Retenção de IRS' + (novPode && mes === 11 ? ' (metade em novembro)' : '');
      el('sn-r-irs').textContent = f(irsFinal);
      el('sn-r-ss').textContent = f(ssFinal);
      if (p === 0.5) extra += '<div class="lfk-kv"><span>Já recebes por mês em duodécimos</span><span>' + f(liqDuo) + '</span></div>';
      if (novPode && irsFinalNormal > 0) {
        var outro = mes === 11 ? c(parteFinal - irsFinalNormal - ssFinal) : c(parteFinal - c(irsFinalNormal / 2) - ssFinal);
        extra += '<div class="lfk-kv"><span>Se for pago em ' + (mes === 11 ? 'dezembro' : 'novembro') + '</span><span>' + f(outro) + '</span></div>';
      }
    }
    el('sn-r-extra').innerHTML = extra;

    var tabelaTxt = 'Tabela ' + x.k + ' ' + (reg === 'C' ? 'do continente' : reg === 'A' ? 'dos Açores' : 'da Madeira');
    var frase = meses < 12
      ? 'Com ' + meses + (meses === 1 ? ' mês' : ' meses') + ' de trabalho em 2026, tens direito a ' + meses + '/12 do salário base: ' + f(bruto) + ' brutos. '
      : 'O subsídio de Natal é igual a um mês de salário base: ' + f(bruto) + ' brutos. ';
    frase += 'A retenção de IRS é calculada à parte do salário, com a ' + tabelaTxt + ', e dá uma taxa de ' + pct(c(efetiva * 100)) + '.';
    if (p > 0 && p < 1) frase += ' Metade do subsídio vem em duodécimos ao longo do ano e a outra metade é paga de uma vez.';
    el('sn-r-frase').textContent = frase;

    var alerta = '';
    if (NOV_ATIVO && p < 1) {
      if (novPode && irsFinalNormal > 0) alerta = '<div class="lfk-alert is-ok" style="margin-top:1rem">' + NOV_REG[reg] + ', o IRS retido em novembro de 2026 é metade do normal, também no subsídio de Natal pago nesse mês. É um adiantamento da descida do IRS de 2026: o acerto final faz-se na declaração de IRS de 2027.</div>';
      else if (acima && NOV_REG[reg]) alerta = '<div class="lfk-alert is-warn" style="margin-top:1rem">A retenção a metade de novembro não se aplica a salários acima de ' + f(limite) + ' por mês, por isso a tua retenção não muda.</div>';
      else if (reg === 'M') alerta = '<div class="lfk-alert" style="margin-top:1rem">Na Madeira, a retenção de novembro só muda quando o Governo Regional publicar as novas tabelas de retenção. Até lá, o simulador usa as tabelas da Madeira em vigor.</div>';
    }
    el('sn-r-alerta').innerHTML = alerta;
  }

  function montar() {
    var root = el('lf-sn');
    if (!root) return;
    root.className = 'lfk';
    root.innerHTML = html();
    /* O tabelas-irs.js precisa de um #lf-dp escondido (data-sn-sink) para nao criar um novo junto ao h1; o simulador so usa o motor de calculo */
    if (LFK.selects) LFK.selects(root);
    /* O site usa o Lenis (scroll suave), que apanha a roda do rato e impede o scroll dentro das listas: data-lenis-prevent devolve o scroll nativo a cada lista */
    Array.prototype.forEach.call(root.querySelectorAll('.lfk-dd-list'), function (l) { l.setAttribute('data-lenis-prevent', ''); });
    if (LFK.numInputs) LFK.numInputs(root);
    if (LFK.theme) LFK.theme(root);
    root.addEventListener('change', function (e) { if (e.target && e.target.name === 'duo') atualizarMes(); });
    atualizarMes();
    LFK.calc(el('sn-calcular'), { results: '#sn-resultados', empty: '#sn-placeholder', run: calcular });
  }

  function iniciar() {
    if (window.LFK && LFK.calc && window.__lfIrsCalc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

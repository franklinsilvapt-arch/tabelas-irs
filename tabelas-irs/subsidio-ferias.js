/* Simulador de subsidio de ferias 2026 - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/) e o motor de retencao do tabelas-irs.js (mesmo repositorio).
   Regras:
   - Valor: retribuicao base mais as prestacoes que pagam o modo especifico de execucao do trabalho (isencao de
     horario, turnos, trabalho noturno), correspondentes a duracao minima das ferias, 22 dias uteis
     (artigos 238.o e 264.o do Codigo do Trabalho). Dias acima de 22 nao aumentam o subsidio.
   - Ano de admissao: 2 dias uteis por cada mes completo, ate 20 dias (artigo 239.o). Subsidio = salario x dias / 22.
   - Ano da cessacao: proporcional ao tempo de servico nesse ano (artigo 245.o). Subsidio = salario x meses / 12.
   - IRS: retencao autonoma, a tabela aplica-se ao valor do subsidio (artigo 99.o-C, n.o 5, do CIRS). Em
     duodecimos, cada pagamento leva a parte proporcional (n.o 6).
   - Seguranca Social: 11% a cargo do trabalhador. */
(function () {
  'use strict';
  if (window.__lfSfInit) return;
  window.__lfSfInit = true;

  var SS = 0.11;

  function el(id) { return document.getElementById(id); }
  function radio(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function f(v) { return window.LFK && LFK.fmt ? LFK.fmt(v) : (Math.round(v * 100) / 100) + '€'; }
  function pct(v) { return (window.LFK && LFK.fmt ? LFK.fmt(v, { currency: false }) : String(Math.round(v * 100) / 100)) + '%'; }
  function c(v) { return Math.round(v * 100) / 100; }

  function html() {
    var meses = '';
    for (var m = 12; m >= 1; m--) meses += '<option value="' + m + '">' + m + (m === 1 ? ' mês' : ' meses') + '</option>';
    var dep = '';
    for (var d = 0; d <= 6; d++) dep += '<option value="' + d + '">' + (d === 0 ? 'Nenhum' : d) + '</option>';
    var ajuda = function (t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; };
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Calculadora de subsídio de férias</div>' +
      '<form class="lfk-stack" id="sf-form" onsubmit="return false">' +
      '<div class="lfk-field"><label class="lfk-label" for="sf-salario">Salário base bruto por mês' + ajuda('A tua retribuição base mensal, antes de impostos, mais as diuturnidades se as tiveres. Não incluas o subsídio de refeição.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="sf-salario" name="salario" inputmode="decimal" value="1.500"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sf-outras">Outras prestações por mês' + ajuda('Subsídio de isenção de horário, de turno ou de trabalho noturno, se os recebes todos os meses. Também entram no subsídio de férias. Ajudas de custo, subsídio de transporte e de refeição não entram.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="sf-outras" name="outras" inputmode="decimal" value="0"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><span class="lfk-label">Situação' + ajuda('No ano em que entras na empresa tens 2 dias úteis de férias por cada mês completo, até 20 dias. No ano em que sais, as férias e o subsídio são proporcionais aos meses trabalhados nesse ano.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="sit-ano" value="0" checked> <span>Ano completo</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="sit-ano" value="1"> <span>Entrei este ano</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="sit-ano" value="2"> <span>Saio este ano</span></label>' +
      '</div></div>' +
      '<div class="lfk-field" id="sf-meses-wrap"><label class="lfk-label" for="sf-meses" id="sf-meses-l">Meses completos de trabalho</label>' +
      '<select class="lfk-input" id="sf-meses" name="meses">' + meses + '</select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sf-regiao">Morada fiscal</label>' +
      '<select class="lfk-input" id="sf-regiao" name="regiao"><option value="C">Portugal continental</option><option value="A">Região Autónoma dos Açores</option><option value="M">Região Autónoma da Madeira</option></select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sf-sit">Estado civil' + ajuda('Para o IRS, quem vive em união de facto conta como casado. Escolhe "um titular" se só um dos dois tem rendimentos, ou se um deles ganha 95% ou mais do total.') + '</label>' +
      '<select class="lfk-input" id="sf-sit" name="sit"><option value="nc">Não casado</option><option value="c2">Casado, dois titulares</option><option value="c1">Casado, um titular</option></select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sf-dep">Dependentes</label>' +
      '<select class="lfk-input" id="sf-dep" name="dep">' + dep + '</select></div>' +
      '<div class="lfk-field"><label class="lfk-check"><input type="checkbox" id="sf-def" name="def"> <span>Tenho um grau de incapacidade de 60% ou mais</span></label></div>' +
      '<div class="lfk-field"><span class="lfk-label">Como recebes o subsídio de férias' + ajuda('Por acordo com a empresa, podes receber parte do subsídio ao longo do ano, junto com o salário (duodécimos). O resto é pago de uma vez, em regra antes das férias.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="duo" value="0" checked> <span>Por inteiro</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="duo" value="0.5"> <span>Metade em duodécimos</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="duo" value="1"> <span>Todo em duodécimos</span></label>' +
      '</div></div>' +
      '<button type="button" class="lfk-btn is-block" id="sf-calcular">Calcular</button>' +
      '</form></div></div>' +
      '<div class="lfk-calc-results" id="sf-area">' +
      '<div id="sf-resultados" hidden>' +
      '<div class="lfk-card">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Resultados</h2></div>' +
      '<div class="lfk-kv is-total"><span id="sf-r-titulo">Subsídio de férias líquido</span><span id="sf-r-liquido">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Subsídio de férias bruto</span><span id="sf-r-bruto">0,00€</span></div>' +
      '<div class="lfk-kv"><span id="sf-r-irs-l">Retenção de IRS</span><span id="sf-r-irs">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Segurança Social (11%)</span><span id="sf-r-ss">0,00€</span></div>' +
      '<div id="sf-r-extra"></div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="sf-r-frase"></p>' +
      '<div id="sf-r-alerta"></div>' +
      '</div></div>' +
      '<div class="lfk-empty" id="sf-placeholder"><p>Preenche os dados e clica em <b>Calcular</b> para veres os resultados.</p></div>' +
      '</div>' +
      '</div>';
  }

  function atualizarMeses() {
    var s = radio('sit-ano'), w = el('sf-meses-wrap');
    if (w) w.hidden = s === '0';
    var l = el('sf-meses-l');
    if (l) l.textContent = s === '2' ? 'Meses de trabalho no ano em que sais' : 'Meses completos de trabalho este ano';
  }

  /* Exposto para testes */
  function bruto(o) {
    var base = o.sal + (o.outras || 0);
    if (o.sitAno === 1) { var dias = Math.min(2 * o.meses, 20); return { bruto: c(base * dias / 22), dias: dias }; }
    if (o.sitAno === 2) return { bruto: c(base * o.meses / 12), dias: c(22 * o.meses / 12) };
    return { bruto: c(base), dias: 22 };
  }
  window.__lfSfBruto = bruto;

  function calcular() {
    var calc = window.__lfIrsCalc;
    var sal = LFK.num(el('sf-salario').value), outras = LFK.num(el('sf-outras').value) || 0;
    if (!(sal > 0) || !calc) return false;
    var sitAno = parseInt(radio('sit-ano'), 10) || 0, meses = parseInt(el('sf-meses').value, 10) || 12;
    var reg = el('sf-regiao').value, sit = el('sf-sit').value, dep = parseInt(el('sf-dep').value, 10) || 0;
    var def = el('sf-def').checked, p = parseFloat(radio('duo')) || 0;

    var b = bruto({ sal: sal, outras: outras, sitAno: sitAno, meses: meses });
    var total = b.bruto;
    var x = calc(total, 'A', sit, dep, def, reg).ret;
    var efetiva = total > 0 ? x.valor / total : 0;

    var parteFinal = c(total * (1 - p)), duoMes = c(total * p / 12);
    var irsFinal = c(parteFinal * efetiva), ssFinal = c(parteFinal * SS), liqFinal = c(parteFinal - irsFinal - ssFinal);
    var irsDuo = c(duoMes * efetiva), ssDuo = c(duoMes * SS), liqDuo = c(duoMes - irsDuo - ssDuo);
    var irsTotal = c(total * efetiva), ssTotal = c(total * SS);

    var extra = '';
    if (p === 1) {
      el('sf-r-titulo').textContent = 'Recebes por mês, junto com o salário';
      el('sf-r-liquido').textContent = f(liqDuo);
      el('sf-r-bruto').textContent = f(total);
      el('sf-r-irs-l').textContent = 'Retenção de IRS no ano';
      el('sf-r-irs').textContent = f(irsTotal);
      el('sf-r-ss').textContent = f(ssTotal);
      extra += '<div class="lfk-kv"><span>Subsídio líquido no ano</span><span>' + f(c(total - irsTotal - ssTotal)) + '</span></div>';
    } else {
      el('sf-r-titulo').textContent = p === 0.5 ? 'Recebes de uma vez (a outra metade)' : 'Subsídio de férias líquido';
      el('sf-r-liquido').textContent = f(liqFinal);
      el('sf-r-bruto').textContent = f(parteFinal);
      el('sf-r-irs-l').textContent = 'Retenção de IRS';
      el('sf-r-irs').textContent = f(irsFinal);
      el('sf-r-ss').textContent = f(ssFinal);
      if (p === 0.5) extra += '<div class="lfk-kv"><span>Já recebes por mês em duodécimos</span><span>' + f(liqDuo) + '</span></div>';
    }
    el('sf-r-extra').innerHTML = extra;

    var tabelaTxt = 'Tabela ' + x.k + ' ' + (reg === 'C' ? 'do continente' : reg === 'A' ? 'dos Açores' : 'da Madeira');
    var frase;
    if (sitAno === 1) frase = 'Com ' + meses + (meses === 1 ? ' mês completo' : ' meses completos') + ' de trabalho, tens ' + b.dias + ' dias úteis de férias e o subsídio é ' + b.dias + '/22 da tua remuneração: ' + f(total) + ' brutos. ';
    else if (sitAno === 2) frase = 'No ano em que sais, o subsídio é proporcional aos meses trabalhados: ' + meses + '/12 da tua remuneração, ' + f(total) + ' brutos. ';
    else frase = 'O subsídio de férias é igual a um mês de remuneração' + (outras > 0 ? ' (salário base mais outras prestações)' : '') + ': ' + f(total) + ' brutos. ';
    frase += 'A retenção de IRS é calculada à parte do salário, com a ' + tabelaTxt + ', e dá uma taxa de ' + pct(c(efetiva * 100)) + '.';
    el('sf-r-frase').textContent = frase;

    el('sf-r-alerta').innerHTML = sitAno === 2
      ? '<div class="lfk-alert" style="margin-top:1rem">Se ainda não gozaste as férias que venceram a 1 de janeiro, a empresa também te paga esses dias e o respetivo subsídio quando sais.</div>'
      : '';
  }

  function montar() {
    var root = el('lf-sf');
    if (!root) return;
    root.className = 'lfk';
    root.innerHTML = html();
    if (LFK.selects) LFK.selects(root);
    /* O site usa o Lenis (scroll suave): data-lenis-prevent devolve o scroll nativo a cada lista */
    Array.prototype.forEach.call(root.querySelectorAll('.lfk-dd-list'), function (l) { l.setAttribute('data-lenis-prevent', ''); });
    /* Banner da XTB (componente nativo, #sf-pub): entre o formulario e o placeholder, depois a seguir aos resultados */
    var pub = el('sf-pub'), area = el('sf-area');
    if (pub && area) { pub.style.marginTop = '0'; area.insertBefore(pub, el('sf-placeholder')); }
    if (LFK.numInputs) LFK.numInputs(root);
    if (LFK.theme) LFK.theme(root);
    root.addEventListener('change', function (e) { if (e.target && e.target.name === 'sit-ano') atualizarMeses(); });
    atualizarMeses();
    LFK.calc(el('sf-calcular'), { results: '#sf-resultados', empty: '#sf-placeholder', run: calcular });
  }

  function iniciar() {
    if (window.LFK && LFK.calc && window.__lfIrsCalc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

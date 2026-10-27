/* Simulador de subsidio de desemprego 2026 - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/) e o motor de retencao do tabelas-irs.js (mesmo repositorio),
   so para a taxa de IRS da remuneracao de referencia liquida.
   Regras (Decreto-Lei n.o 220/2006, na redacao do DL 64/2012, e Guia Pratico da Seguranca Social):
   - Prazo de garantia: 360 dias de descontos nos 24 meses antes do desemprego.
   - Remuneracao de referencia (RR): R/360, com R = remuneracoes dos primeiros 12 dos ultimos 14 meses,
     incluindo os subsidios de ferias e de Natal pagos nesse periodo. Por mes: RR x 30.
   - Montante: 65% da RR x 30.
   - Maximos: 2,5 x IAS e 75% da RR liquida (RR - 11% de SS - retencao de IRS). Nunca acima da RR liquida.
   - Minimos: IAS, ou 1,15 x IAS se a remuneracao for igual ou superior ao salario minimo, sem passar a RR liquida.
   - Majoracao de 10%: casal com filhos a cargo em que os dois estao desempregados, ou familia monoparental.
   - Duracao: Quadro do artigo 37.o, por idade e meses de descontos, mais o acrescimo por cada 5 anos de
     descontos nos ultimos 20 anos.
   - Nao paga IRS nem Seguranca Social.
   Valores de 2026: IAS 537,13€, salario minimo 920€. Atualizar em janeiro de 2027. */
(function () {
  'use strict';
  if (window.__lfSdInit) return;
  window.__lfSdInit = true;

  var IAS = 537.13, RMMG = 920, ANO = 2026;
  var SS = 0.11;
  /* [idade minima, dias por escalao de meses (<15, 15-23, 24+), acrescimo por cada 5 anos] */
  var QUADRO = [[50, [270, 480, 540], 60], [40, [210, 360, 540], 45], [30, [180, 330, 420], 30], [0, [150, 210, 330], 30]];

  function el(id) { return document.getElementById(id); }
  function radio(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function f(v) { return window.LFK && LFK.fmt ? LFK.fmt(v) : (Math.round(v * 100) / 100) + '€'; }
  function c(v) { return Math.round(v * 100) / 100; }

  function html() {
    var dep = '';
    for (var d = 0; d <= 6; d++) dep += '<option value="' + d + '">' + (d === 0 ? 'Nenhum' : d) + '</option>';
    var ajuda = function (t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; };
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Calculadora de subsídio de desemprego</div>' +
      '<form class="lfk-stack" id="sd-form" onsubmit="return false">' +
      '<div class="lfk-field"><label class="lfk-label" for="sd-salario">Salário bruto por mês' + ajuda('A média do que ganhaste por mês, antes de impostos, nos 12 meses que contam: do 14.º ao 3.º mês antes de ficares desempregado. Inclui o salário base e os prémios regulares. Não incluas o subsídio de refeição.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="sd-salario" name="salario" inputmode="decimal" value="1.200"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><span class="lfk-label">Subsídios recebidos nesses 12 meses' + ajuda('Os subsídios de férias e de Natal pagos nesse período também contam, mesmo que recebidos em duodécimos. Conta no máximo um de cada.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="subs" value="2" checked> <span>Férias e Natal</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="subs" value="1"> <span>Só um</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="subs" value="0"> <span>Nenhum</span></label>' +
      '</div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sd-idade">Idade na data do desemprego</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="sd-idade" name="idade" inputmode="numeric" value="35"><span class="lfk-unit">anos</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sd-meses">Meses de descontos' + ajuda('Conta os meses com salário declarado à Segurança Social desde o último subsídio de desemprego que recebeste (ou desde sempre, se nunca recebeste). Para teres direito, precisas de 360 dias de descontos nos 24 meses antes do desemprego.') + '</label>' +
      '<select class="lfk-input" id="sd-meses" name="meses"><option value="3">24 meses ou mais</option><option value="2">De 15 a 23 meses</option><option value="1">De 12 a 14 meses</option><option value="0">Menos de 12 meses</option></select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sd-anos">Anos de descontos nos últimos 20 anos' + ajuda('Por cada 5 anos com descontos nos últimos 20 anos, o subsídio dura mais: 30 dias até aos 39 anos de idade, 45 dias dos 40 aos 49 e 60 dias a partir dos 50.') + '</label>' +
      '<select class="lfk-input" id="sd-anos" name="anos"><option value="0">Menos de 5 anos</option><option value="1">De 5 a 9 anos</option><option value="2" selected>De 10 a 14 anos</option><option value="3">De 15 a 19 anos</option><option value="4">20 anos</option></select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sd-regiao">Morada fiscal</label>' +
      '<select class="lfk-input" id="sd-regiao" name="regiao"><option value="C">Portugal continental</option><option value="A">Região Autónoma dos Açores</option><option value="M">Região Autónoma da Madeira</option></select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sd-sit">Estado civil' + ajuda('Serve para calcular o teto de 75% do salário líquido. Para o IRS, quem vive em união de facto conta como casado.') + '</label>' +
      '<select class="lfk-input" id="sd-sit" name="sit"><option value="nc">Não casado</option><option value="c2">Casado, dois titulares</option><option value="c1">Casado, um titular</option></select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="sd-dep">Dependentes</label>' +
      '<select class="lfk-input" id="sd-dep" name="dep">' + dep + '</select></div>' +
      '<div class="lfk-field"><label class="lfk-check"><input type="checkbox" id="sd-def" name="def"> <span>Tenho um grau de incapacidade de 60% ou mais</span></label></div>' +
      '<div class="lfk-field"><label class="lfk-check"><input type="checkbox" id="sd-maj" name="maj"> <span>Tenho filhos a cargo e o outro pai ou mãe também está desempregado, ou sou a única pessoa a cargo deles</span></label></div>' +
      '<button type="button" class="lfk-btn is-block" id="sd-calcular">Calcular</button>' +
      '</form></div></div>' +
      '<div class="lfk-calc-results" id="sd-area">' +
      '<div id="sd-resultados" hidden>' +
      '<div class="lfk-card">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Resultados</h2></div>' +
      '<div class="lfk-kv is-total"><span>Subsídio de desemprego por mês</span><span id="sd-r-valor">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Duração</span><span id="sd-r-dur"></span></div>' +
      '<div class="lfk-kv"><span>Total no período</span><span id="sd-r-total">0,00€</span></div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="sd-r-frase"></p>' +
      '<div id="sd-r-alerta"></div>' +
      '</div>' +
      '<div class="lfk-card" style="margin-top:1.5rem">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Como é calculado</h2></div>' +
      '<div id="sd-r-passos"></div>' +
      '</div></div>' +
      '<div class="lfk-empty" id="sd-placeholder"><p>Preenche os dados e clica em <b>Calcular</b> para veres os resultados.</p></div>' +
      '</div>' +
      '</div>';
  }

  function kv(a, b) { return '<div class="lfk-kv"><span>' + a + '</span><span>' + b + '</span></div>'; }

  function duracao(idade, escalao, cincos) {
    for (var i = 0; i < QUADRO.length; i++) {
      if (idade >= QUADRO[i][0]) return { base: QUADRO[i][1][escalao], extra: QUADRO[i][2] * cincos, porCinco: QUADRO[i][2] };
    }
  }

  /* Exposto para testes */
  function simular(o) {
    var calc = window.__lfIrsCalc;
    var ref = c(o.sal * (12 + o.subs) / 12);
    var base = c(ref * 0.65);
    var irs = calc ? c(calc(ref, 'A', o.sit, o.dep, o.def, o.reg).ret.valor) : 0;
    var ss = c(ref * SS);
    var liq = c(ref - ss - irs);
    var max25 = c(IAS * 2.5), max75 = c(liq * 0.75);
    var v = Math.min(base, max25, max75);
    var limite = v === base ? '' : (v === max25 ? 'max25' : 'max75');
    var minimo = o.sal >= RMMG ? c(IAS * 1.15) : IAS;
    var minEf = Math.min(minimo, liq);
    if (v < minEf) { v = minEf; limite = minEf === minimo ? 'min' : 'minliq'; }
    v = c(v);
    var final = o.maj ? c(v * 1.1) : v;
    var escalao = o.meses === 3 ? 2 : o.meses === 2 ? 1 : 0;
    var d = duracao(o.idade, escalao, o.anos);
    var dias = d.base + d.extra;
    return { ref: ref, base: base, irs: irs, ss: ss, liq: liq, max25: max25, max75: max75, minimo: minimo, limite: limite, valor: v, final: final, dias: dias, d: d, total: c(final * dias / 30), elegivel: o.meses > 0 };
  }
  window.__lfSdSimular = simular;

  function calcular() {
    var sal = LFK.num(el('sd-salario').value), idade = LFK.num(el('sd-idade').value);
    if (!(sal > 0) || !(idade >= 16) || !window.__lfIrsCalc) return false;
    var o = {
      sal: sal, subs: parseInt(radio('subs'), 10) || 0, idade: idade,
      meses: parseInt(el('sd-meses').value, 10), anos: parseInt(el('sd-anos').value, 10) || 0,
      reg: el('sd-regiao').value, sit: el('sd-sit').value, dep: parseInt(el('sd-dep').value, 10) || 0,
      def: el('sd-def').checked, maj: el('sd-maj').checked
    };
    var r = simular(o);
    var meses = Math.round(r.dias / 30 * 10) / 10;
    var mesesTxt = (meses % 1 === 0 ? String(meses) : String(meses).replace('.', ',')) + ' meses';

    if (!r.elegivel) {
      el('sd-r-valor').textContent = f(0);
      el('sd-r-dur').textContent = 'Sem direito';
      el('sd-r-total').textContent = f(0);
      el('sd-r-frase').textContent = 'Com menos de 12 meses de descontos (360 dias nos últimos 24 meses), não tens direito ao subsídio de desemprego.';
      el('sd-r-alerta').innerHTML = '<div class="lfk-alert is-warn" style="margin-top:1rem">Se tens pelo menos 180 dias de descontos nos últimos 12 meses e baixos rendimentos no agregado, podes ter direito ao subsídio social de desemprego (até 30 de dezembro de ' + ANO + '; a partir de 31 de dezembro passa a Prestação Social Única).</div>';
      el('sd-r-passos').innerHTML = kv('Meses de descontos', 'Menos de 12') + kv('Prazo de garantia', '360 dias em 24 meses');
      return;
    }

    el('sd-r-valor').textContent = f(r.final);
    el('sd-r-dur').textContent = r.dias + ' dias (' + mesesTxt + ')';
    el('sd-r-total').textContent = f(r.total);

    var frase = 'A tua remuneração de referência é de ' + f(r.ref) + ' por mês e 65% dá ' + f(r.base) + '. ';
    if (r.limite === 'max75') frase += 'Esse valor passa 75% do teu salário líquido de referência (' + f(r.liq) + '), por isso fica em ' + f(r.valor) + '. ';
    else if (r.limite === 'max25') frase += 'Esse valor passa o máximo de 2,5 vezes o IAS, por isso fica em ' + f(r.valor) + '. ';
    else if (r.limite === 'min') frase += 'Esse valor fica abaixo do mínimo de ' + f(r.minimo) + ', por isso recebes o mínimo. ';
    else if (r.limite === 'minliq') frase += 'O mínimo passaria o teu salário líquido de referência, por isso recebes esse valor: ' + f(r.valor) + '. ';
    if (o.maj) frase += 'Com a majoração de 10%, recebes ' + f(r.final) + '. ';
    frase += 'O subsídio não paga IRS nem Segurança Social: é o valor que te cai na conta.';
    el('sd-r-frase').textContent = frase;

    el('sd-r-alerta').innerHTML = o.meses === 1
      ? '<div class="lfk-alert" style="margin-top:1rem">Confirma que tens 360 dias de descontos nos 24 meses antes do desemprego: é a condição para teres direito ao subsídio.</div>'
      : '';

    var passos = '';
    passos += kv('Remuneração de referência por mês', f(r.ref));
    passos += kv('65% da remuneração de referência', f(r.base));
    passos += kv('Salário líquido de referência', f(r.liq));
    passos += kv('Máximo: 75% do salário líquido', f(r.max75));
    passos += kv('Máximo: 2,5 × IAS', f(r.max25));
    passos += kv('Mínimo' + (o.sal >= RMMG ? ': 1,15 × IAS' : ': IAS'), f(r.minimo));
    if (o.maj) passos += kv('Majoração de 10%', '+' + f(c(r.final - r.valor)));
    passos += kv('Duração base', r.d.base + ' dias');
    if (r.d.extra) passos += kv('Acréscimo por anos de descontos', '+' + r.d.extra + ' dias');
    el('sd-r-passos').innerHTML = passos;
  }

  function montar() {
    var root = el('lf-sd');
    if (!root) return;
    root.className = 'lfk';
    root.innerHTML = html();
    if (LFK.selects) LFK.selects(root);
    /* O site usa o Lenis (scroll suave): data-lenis-prevent devolve o scroll nativo a cada lista */
    Array.prototype.forEach.call(root.querySelectorAll('.lfk-dd-list'), function (l) { l.setAttribute('data-lenis-prevent', ''); });
    /* Banner da XTB (componente nativo, #sd-pub): entre o formulario e o placeholder, depois a seguir aos resultados */
    var pub = el('sd-pub'), area = el('sd-area');
    if (pub && area) { pub.style.marginTop = '0'; area.insertBefore(pub, el('sd-placeholder')); }
    if (LFK.numInputs) LFK.numInputs(root);
    if (LFK.theme) LFK.theme(root);
    LFK.calc(el('sd-calcular'), { results: '#sd-resultados', empty: '#sd-placeholder', run: calcular });
  }

  function iniciar() {
    if (window.LFK && LFK.calc && window.__lfIrsCalc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

/* Simulador de baixa medica (subsidio de doenca) 2026 - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/) e o motor de retencao do tabelas-irs.js (mesmo repositorio),
   para o salario liquido de referencia e para comparar com o salario liquido.
   Regras (Decreto-Lei n.o 28/2004 e Guia Pratico - Subsidio de Doenca da Seguranca Social, v4.55, out 2026),
   trabalhadores por conta de outrem:
   - Remuneracao de referencia (RR) diaria: R/180, com R = salarios dos 6 meses mais antigos dos ultimos 8
     antes do mes da baixa, sem subsidios de ferias e de Natal. Com salario igual todos os meses: salario / 30.
   - Percentagem: 55% ate 30 dias, 60% de 31 a 90, 70% de 91 a 365, 75% acima de 365.
   - Mais 5 pontos nos primeiros 90 dias (55% e 60%) se a RR for ate 500€, se houver 3 ou mais descendentes
     ate 16 anos (24 com abono) ou descendentes com bonificacao por deficiencia. Nao cumulavel.
   - Periodo de espera: 3 dias sem pagamento, exceto internamento ou cirurgia de ambulatorio (tambem tuberculose
     e doenca que comeca no subsidio parental, que o simulador nao trata).
   - Minimo diario: 30% da retribuicao minima (920€ em 2026): 9,20€, ou a RR se for mais baixa.
   - Maximo: a RR liquida (RR menos 11% de Seguranca Social e a retencao de IRS).
   - Maximo de 1095 dias. Nao paga IRS nem Seguranca Social.
   Valores de 2026: salario minimo 920€. Atualizar em janeiro de 2027. */
(function () {
  'use strict';
  if (window.__lfBmInit) return;
  window.__lfBmInit = true;

  var RMMG = 920, SS = 0.11, MAX_DIAS = 1095;
  var FASES = [[1, 30, 0.55], [31, 90, 0.60], [91, 365, 0.70], [366, MAX_DIAS, 0.75]];

  function el(id) { return document.getElementById(id); }
  function f(v) { return window.LFK && LFK.fmt ? LFK.fmt(v) : (Math.round(v * 100) / 100) + '€'; }
  function c(v) { return Math.round(v * 100) / 100; }

  function html() {
    var dep = '';
    for (var d = 0; d <= 6; d++) dep += '<option value="' + d + '">' + (d === 0 ? 'Nenhum' : d) + '</option>';
    var ajuda = function (t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; };
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Calculadora de baixa médica</div>' +
      '<form class="lfk-stack" id="bm-form" onsubmit="return false">' +
      '<div class="lfk-field"><label class="lfk-label" for="bm-salario">Salário bruto por mês' + ajuda('A média do teu salário bruto nos 6 meses que contam: do 8.º ao 3.º mês antes do mês em que começa a baixa. Sem subsídios de férias e de Natal e sem subsídio de refeição.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="bm-salario" name="salario" inputmode="decimal" value="1.200"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="bm-dias">Dias de baixa' + ajuda('Conta todos os dias do certificado de incapacidade, incluindo fins de semana e feriados. Baixas seguidas com menos de 60 dias de intervalo contam como uma só.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="bm-dias" name="dias" inputmode="numeric" value="30"><span class="lfk-unit">dias</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-check"><input type="checkbox" id="bm-intern" name="intern"> <span>A baixa começou com internamento ou cirurgia de ambulatório</span></label></div>' +
      '<div class="lfk-field"><label class="lfk-check"><input type="checkbox" id="bm-maj" name="maj"> <span>Tenho 3 ou mais filhos até 16 anos (ou até 24 com abono de família) ou um filho com bonificação por deficiência</span></label></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="bm-regiao">Morada fiscal</label>' +
      '<select class="lfk-input" id="bm-regiao" name="regiao"><option value="C">Portugal continental</option><option value="A">Região Autónoma dos Açores</option><option value="M">Região Autónoma da Madeira</option></select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="bm-sit">Estado civil' + ajuda('Serve para calcular o teu salário líquido, que é o teto do subsídio e a base da comparação. Para o IRS, quem vive em união de facto conta como casado.') + '</label>' +
      '<select class="lfk-input" id="bm-sit" name="sit"><option value="nc">Não casado</option><option value="c2">Casado, dois titulares</option><option value="c1">Casado, um titular</option></select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="bm-dep">Dependentes</label>' +
      '<select class="lfk-input" id="bm-dep" name="dep">' + dep + '</select></div>' +
      '<div class="lfk-field"><label class="lfk-check"><input type="checkbox" id="bm-def" name="def"> <span>Tenho um grau de incapacidade de 60% ou mais</span></label></div>' +
      '<button type="button" class="lfk-btn is-block" id="bm-calcular">Calcular</button>' +
      '</form></div></div>' +
      '<div class="lfk-calc-results" id="bm-area">' +
      '<div id="bm-resultados" hidden>' +
      '<div class="lfk-card">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Resultados</h2></div>' +
      '<div class="lfk-kv is-total"><span>Subsídio de doença a receber</span><span id="bm-r-total">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Dias pagos</span><span id="bm-r-dias"></span></div>' +
      '<div class="lfk-kv"><span>Salário líquido desses dias</span><span id="bm-r-liq">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Perdes em relação ao salário</span><span id="bm-r-perda">0,00€</span></div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="bm-r-frase"></p>' +
      '<div id="bm-r-alerta"></div>' +
      '</div>' +
      '<div class="lfk-card" style="margin-top:1.5rem">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Como é calculado</h2></div>' +
      '<div id="bm-r-passos"></div>' +
      '</div></div>' +
      '<div class="lfk-empty" id="bm-placeholder"><p>Preenche os dados e clica em <b>Calcular</b> para veres os resultados.</p></div>' +
      '</div>' +
      '</div>';
  }

  function kv(a, b) { return '<div class="lfk-kv"><span>' + a + '</span><span>' + b + '</span></div>'; }

  /* Exposto para testes */
  function simular(o) {
    var calc = window.__lfIrsCalc;
    var dias = Math.max(1, Math.min(MAX_DIAS, Math.round(o.dias)));
    var rr = c(o.sal / 30);
    var irs = calc ? calc(o.sal, 'A', o.sit, o.dep, o.def, o.reg).ret.valor : 0;
    var liqMes = c(o.sal - o.sal * SS - irs);
    var rrLiq = c(liqMes / 30);
    var maj = o.sal <= 500 || o.maj;
    var minimo = c(RMMG / 30 * 0.3);
    var minEf = Math.min(minimo, rr);
    var espera = o.intern ? 0 : 3;
    var fases = [], total = 0, pagos = 0;
    FASES.forEach(function (fz) {
      var ini = Math.max(fz[0], espera + 1), fim = Math.min(fz[1], dias);
      var nd = fim - ini + 1;
      var taxa = fz[2] + (maj && fz[1] <= 90 ? 0.05 : 0);
      if (fz[0] > dias) return;
      var diario = rr * taxa, limite = '';
      if (diario > rrLiq) { diario = rrLiq; limite = 'max'; }
      if (diario < minEf) { diario = minEf; limite = 'min'; }
      diario = c(diario);
      if (nd > 0) { total += diario * nd; pagos += nd; }
      fases.push({ ini: fz[0], fim: Math.min(fz[1], dias), nd: Math.max(0, nd), taxa: taxa, diario: diario, sub: c(diario * Math.max(0, nd)), limite: limite });
    });
    total = c(total);
    var liqPeriodo = c(rrLiq * dias);
    return { dias: dias, rr: rr, rrLiq: rrLiq, liqMes: liqMes, maj: maj, espera: espera, fases: fases, total: total, pagos: pagos, liqPeriodo: liqPeriodo, perda: c(liqPeriodo - total), minimo: minimo };
  }
  window.__lfBmSimular = simular;

  function pct(t) { return Math.round(t * 100) + '%'; }

  function calcular() {
    var sal = LFK.num(el('bm-salario').value), dias = LFK.num(el('bm-dias').value);
    if (!(sal > 0) || !(dias >= 1) || !window.__lfIrsCalc) return false;
    var o = {
      sal: sal, dias: dias, intern: el('bm-intern').checked, maj: el('bm-maj').checked,
      reg: el('bm-regiao').value, sit: el('bm-sit').value, dep: parseInt(el('bm-dep').value, 10) || 0, def: el('bm-def').checked
    };
    var r = simular(o);
    el('bm-r-total').textContent = f(r.total);
    el('bm-r-dias').textContent = r.pagos + ' de ' + r.dias + (r.dias === 1 ? ' dia' : ' dias');
    el('bm-r-liq').textContent = f(r.liqPeriodo);
    el('bm-r-perda').textContent = f(Math.max(0, r.perda));

    var f1 = r.fases[0];
    var frase = 'A tua remuneração de referência é de ' + f(r.rr) + ' por dia (o salário a dividir por 30). ';
    frase += 'Nos primeiros 30 dias recebes ' + pct(f1.taxa) + ' desse valor: ' + f(f1.diario) + ' por dia. ';
    frase += r.espera ? 'Os primeiros 3 dias não são pagos, nem pela Segurança Social nem pela empresa. ' : 'Com internamento ou cirurgia de ambulatório, o pagamento começa no primeiro dia. ';
    frase += 'O subsídio não paga IRS nem Segurança Social.';
    el('bm-r-frase').textContent = frase;

    var alerta = '';
    if (r.dias <= 3 && r.espera) alerta = '<div class="lfk-alert is-warn" style="margin-top:1rem">Uma baixa de 3 dias ou menos não dá direito a subsídio, por causa do período de espera. Para estas faltas curtas também podes usar a autodeclaração de doença do SNS 24, que justifica a falta mas não é paga.</div>';
    else if (r.maj && f1.taxa > 0.55 + 1e-9) alerta = '<div class="lfk-alert is-ok" style="margin-top:1rem">Tens direito a mais 5 pontos percentuais nos primeiros 90 dias' + (sal <= 500 ? ', porque a tua remuneração de referência é de 500€ ou menos.' : ', por causa dos teus filhos.') + '</div>';
    el('bm-r-alerta').innerHTML = alerta;

    var passos = kv('Remuneração de referência por dia', f(r.rr)) + kv('Salário líquido de referência por dia (teto)', f(r.rrLiq));
    r.fases.forEach(function (fz) {
      var nome = fz.ini === fz.fim ? 'Dia ' + fz.ini : 'Dias ' + fz.ini + ' a ' + fz.fim;
      var val = fz.nd > 0 ? fz.nd + ' × ' + f(fz.diario) + ' = ' + f(fz.sub) : 'sem pagamento';
      passos += kv(nome + ' (' + pct(fz.taxa) + (fz.limite === 'max' ? ', no teto' : fz.limite === 'min' ? ', no mínimo' : '') + ')', val);
    });
    if (r.espera) passos += kv('Período de espera', '3 dias sem pagamento');
    el('bm-r-passos').innerHTML = passos;
  }

  function montar() {
    var root = el('lf-bm');
    if (!root) return;
    root.className = 'lfk';
    root.innerHTML = html();
    if (LFK.selects) LFK.selects(root);
    if (LFK.numInputs) LFK.numInputs(root);
    if (LFK.theme) LFK.theme(root);
    /* Banner da XTB (componente nativo, #bm-pub): entre o formulario e o placeholder, depois a seguir aos resultados */
    var pub = el('bm-pub'), area = el('bm-area');
    if (pub && area) { pub.style.marginTop = '0'; area.insertBefore(pub, el('bm-placeholder')); }
    LFK.calc(el('bm-calcular'), { results: '#bm-resultados', empty: '#bm-placeholder', run: calcular });
  }

  function iniciar() {
    if (window.LFK && LFK.calc && window.__lfIrsCalc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

/* Calculadora de fundo de emergencia - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/). Para a estimativa opcional do subsidio de desemprego usa o
   motor do subsidio-desemprego.js e do tabelas-irs.js (mesmo repositorio), carregados na mesma pagina.
   Regras:
   - Referencia: o Banco de Portugal recomenda um fundo de emergencia de 4 a 6 meses de despesas mensais
     (fixas e variaveis).
   - Meses recomendados (metodologia do Literacia Financeira, explicada no glossario da pagina):
     base 4 (contrato sem termo, funcao publica ou reforma), 5 (contrato a termo), 6 (independente),
     mais 1 mes com um so rendimento no agregado e mais 1 mes com pessoas a cargo.
   - Tempo ate ao objetivo: (objetivo - ja poupado) / (poupanca mensal + reforcos anuais / 12), arredondado
     para cima. Nao conta juros.
   - Subsidio de desemprego (opcional): estimativa com 24 meses ou mais de descontos, ferias e Natal na
     remuneracao de referencia, continente, nao casado, sem majoracao. */
(function () {
  'use strict';
  if (window.__lfFeInit) return;
  window.__lfFeInit = true;

  var BASE = { sem: 4, ref: 4, termo: 5, ind: 6 };
  var MAX_MESES_GRAFICO = 120;
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var MESES_C = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  function el(id) { return document.getElementById(id); }
  function radio(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function f(v) { return window.LFK && LFK.fmt ? LFK.fmt(v) : (Math.round(v * 100) / 100) + '€'; }
  function f0(v) { return window.LFK && LFK.fmt ? LFK.fmt(v, { decimals: 0 }) : Math.round(v) + '€'; }
  function c(v) { return Math.round(v * 100) / 100; }
  function nMeses(n) { return n + (n === 1 ? ' mês' : ' meses'); }
  function pctTxt(v) { return (window.LFK && LFK.fmt ? LFK.fmt(v, { currency: false, decimals: 0 }) : String(Math.round(v))) + '%'; }

  function html() {
    var ajuda = function (t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; };
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Calculadora de fundo de emergência</div>' +
      '<form class="lfk-stack" id="fe-form" onsubmit="return false">' +
      '<div class="lfk-field"><label class="lfk-label" for="fe-despesas">Despesas por mês do agregado' + ajuda('Soma o que a casa gasta num mês normal: renda ou prestação da casa, alimentação, eletricidade, água e gás, transportes, seguros, créditos, escola dos filhos e o resto das despesas fixas e variáveis.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="fe-despesas" name="despesas" inputmode="numeric" value="1.500"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="fe-sit">Situação profissional' + ajuda('Quanto menos estável for o teu rendimento, maior deve ser o fundo. Se no agregado há situações diferentes, escolhe a de quem ganha mais.') + '</label>' +
      '<select class="lfk-input" id="fe-sit" name="sit">' +
      '<option value="sem">Contrato sem termo ou função pública</option>' +
      '<option value="termo">Contrato a termo</option>' +
      '<option value="ind">Trabalhador independente ou empresário</option>' +
      '<option value="ref">Reformado</option>' +
      '</select></div>' +
      '<div class="lfk-field"><span class="lfk-label">Rendimentos no agregado' + ajuda('Quantas pessoas da casa recebem salário, rendimentos do trabalho ou pensão. Com dois rendimentos, se um falhar, o outro continua a entrar.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="rend" value="2" checked> <span>Dois ou mais</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="rend" value="1"> <span>Só um</span></label>' +
      '</div></div>' +
      '<div class="lfk-field"><span class="lfk-label">Filhos ou outras pessoas a cargo</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="dep" value="0" checked> <span>Não</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="dep" value="1"> <span>Sim</span></label>' +
      '</div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="fe-tens">Quanto já tens poupado para emergências' + ajuda('Conta só o dinheiro que podes levantar em poucos dias sem perder capital: conta à ordem, conta poupança ou depósitos que podes mobilizar antes do prazo. Não contes ações, ETF nem PPR.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="fe-tens" name="tens" inputmode="numeric" value="2.000"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="fe-mensal">Quanto consegues poupar por mês</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="fe-mensal" name="mensal" inputmode="numeric" value="300"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="fe-extra">Reforços por ano' + ajuda('A parte dos subsídios de férias e de Natal ou do reembolso do IRS que vais pôr no fundo. Para simplificar, a calculadora distribui este valor pelos 12 meses do ano.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="fe-extra" name="extra" inputmode="numeric" value="0"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field" id="fe-sd-wrap"><label class="lfk-check"><input type="checkbox" id="fe-sd" name="sd"> <span>Ver quanto o subsídio de desemprego cobre se perderes o emprego</span></label></div>' +
      '<div class="lfk-field" id="fe-salario-wrap" hidden><label class="lfk-label" for="fe-salario">O teu salário bruto por mês' + ajuda('O salário base antes de impostos, com os prémios regulares. Não incluas o subsídio de refeição.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="fe-salario" name="salario" inputmode="numeric" value="1.200"><span class="lfk-unit">€</span></div></div>' +
      '<button type="button" class="lfk-btn is-block" id="fe-calcular">Calcular</button>' +
      '</form></div></div>' +
      '<div class="lfk-calc-results" id="fe-area">' +
      '<div id="fe-resultados" hidden>' +
      '<div class="lfk-card">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Resultados</h2></div>' +
      '<div class="lfk-kv is-total"><span>Fundo de emergência recomendado</span><span id="fe-r-alvo">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Meses de despesas</span><span id="fe-r-meses"></span></div>' +
      '<div class="lfk-kv"><span>Já tens</span><span id="fe-r-tens">0,00€</span></div>' +
      '<div class="lfk-kv"><span id="fe-r-falta-l">Falta juntar</span><span id="fe-r-falta">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Tempo até lá chegar</span><span id="fe-r-tempo"></span></div>' +
      '<div style="margin-top:1.5rem">' +
      '<div class="lfk-zones" id="fe-zonas" data-max="100" data-zones="40:Início:err,80:A caminho:warn,100:Quase completo:ok"></div>' +
      '<div class="lfk-zones-result"><span>Já tens <span id="fe-r-pct"></span> do fundo</span><span id="fe-r-pct-w"></span></div>' +
      '</div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="fe-r-frase"></p>' +
      '<div id="fe-r-alerta"></div>' +
      '</div>' +
      '<div class="lfk-card" style="margin-top:1.5rem" id="fe-sd-card" hidden>' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Se perderes o emprego</h2></div>' +
      '<div class="lfk-kv"><span>Subsídio estimado por mês</span><span id="fe-r-sd">0,00€</span></div>' +
      '<div class="lfk-kv"><span>O fundo paga por mês</span><span id="fe-r-gap">0,00€</span></div>' +
      '<div class="lfk-kv"><span>O fundo recomendado dá para</span><span id="fe-r-dura"></span></div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="fe-r-sd-frase"></p>' +
      '</div>' +
      '<div class="lfk-card" style="margin-top:1.5rem" id="fe-evolucao">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Evolução do fundo</h2></div>' +
      '<div class="lfk-chart-head">' +
      '<div class="lfk-toggle" role="tablist"><button type="button" class="lfk-tab is-active" data-lfk-tab="g">Gráfico</button><button type="button" class="lfk-tab" data-lfk-tab="t">Tabela</button></div>' +
      '<div class="lfk-menu" data-chart="#fe-grafico" data-table="#fe-tabela" data-form="#fe-form" data-file="fundo-de-emergencia"></div>' +
      '</div>' +
      '<div data-lfk-view="g"><div class="lfk-chart"><canvas id="fe-grafico"></canvas></div></div>' +
      '<div data-lfk-view="t" hidden><div id="fe-tabela"></div><p class="lfk-table-note">Saldo no fim de cada mês, sem juros.</p></div>' +
      '</div>' +
      '<div class="lfk-card" style="margin-top:1.5rem">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Onde guardar o fundo</h2></div>' +
      '<p class="lfk-text">Num sítio de onde possas tirar o dinheiro em poucos dias e sem perder capital, como uma conta poupança ou um depósito a prazo que possas mobilizar antes do fim. Os depósitos estão cobertos pelo Fundo de Garantia de Depósitos até 100.000€ por pessoa e por banco.</p>' +
      '<div class="lfk-row" style="margin-top:1rem">' +
      '<a class="lfk-link-btn" href="/comparador-depositos-a-prazo">Comparar depósitos a prazo <span class="lfk-btn is-icon"><span class="lfk-ico-arrow"></span></span></a>' +
      '<a class="lfk-link-btn is-secondary" href="/comparador-contas-bancarias">Comparar contas bancárias <span class="lfk-btn is-icon"><span class="lfk-ico-arrow"></span></span></a>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="lfk-empty" id="fe-placeholder"><p>Preenche os dados e clica em <b>Calcular</b> para veres os resultados.</p></div>' +
      '</div>' +
      '</div>';
  }

  /* Exposto para testes */
  function mesesRecomendados(sit, rend, dep) {
    return (BASE[sit] || 4) + (rend === 1 ? 1 : 0) + (dep ? 1 : 0);
  }

  function simular(o) {
    var meses = mesesRecomendados(o.sit, o.rend, o.dep);
    var alvo = c(o.despesas * meses);
    var tens = Math.max(0, o.tens || 0);
    var falta = c(Math.max(0, alvo - tens));
    var sobra = c(Math.max(0, tens - alvo));
    var porMes = c((o.mensal || 0) + (o.extra || 0) / 12);
    var tempo = falta === 0 ? 0 : (porMes > 0 ? Math.ceil(c(falta / porMes)) : null);
    var pct = alvo > 0 ? Math.min(100, tens / alvo * 100) : 0;
    return { meses: meses, alvo: alvo, tens: tens, falta: falta, sobra: sobra, porMes: porMes, tempo: tempo, pct: pct };
  }
  window.__lfFeSimular = simular;

  function sdEstimado(salario, dep) {
    if (!window.__lfSdSimular || !(salario > 0)) return null;
    var r = window.__lfSdSimular({ sal: salario, subs: 2, idade: 35, meses: 3, anos: 2, reg: 'C', sit: 'nc', dep: dep ? 1 : 0, def: false, maj: false });
    return r ? r.final : null;
  }
  window.__lfFeSd = sdEstimado;

  function dataAlvo(n) {
    var d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    return MESES[d.getMonth()] + ' de ' + d.getFullYear();
  }

  function atualizarSd() {
    var sit = el('fe-sit').value, pode = sit === 'sem' || sit === 'termo';
    el('fe-sd-wrap').hidden = !pode;
    el('fe-salario-wrap').hidden = !(pode && el('fe-sd').checked);
  }

  function descSit(sit) {
    return { sem: 'contrato sem termo', termo: 'contrato a termo', ind: 'trabalho independente', ref: 'reforma' }[sit];
  }

  function grafico(r) {
    var card = el('fe-evolucao');
    if (!(r.falta > 0) || !r.tempo) { card.hidden = true; return; }
    card.hidden = false;
    var n = Math.min(r.tempo, MAX_MESES_GRAFICO);
    var labels = [], saldo = [], alvo = [], rows = [];
    var d = new Date(); d.setDate(1);
    for (var i = 0; i <= n; i++) {
      var m = new Date(d.getFullYear(), d.getMonth() + i, 1);
      var lab = MESES_C[m.getMonth()] + ' ' + m.getFullYear();
      var s = c(Math.min(r.alvo, r.tens + r.porMes * i));
      labels.push(lab); saldo.push(s); alvo.push(r.alvo);
      if (i > 0) rows.push([lab, LFK.fmt(s), LFK.fmt(c(Math.max(0, r.alvo - s)))]);
    }
    LFK.line(el('fe-grafico'), { labels: labels, maxTicks: 8, datasets: [{ label: 'Fundo de emergência', data: saldo }, { label: 'Valor recomendado', data: alvo }] });
    LFK.table(el('fe-tabela'), { head: ['Mês', 'Saldo do fundo', 'Falta juntar'], num: [false, true, true], limit: 30, rows: rows });
  }

  function calcular() {
    var despesas = LFK.num(el('fe-despesas').value);
    if (!(despesas > 0)) return false;
    var o = {
      despesas: despesas,
      sit: el('fe-sit').value,
      rend: parseInt(radio('rend'), 10) || 2,
      dep: radio('dep') === '1',
      tens: LFK.num(el('fe-tens').value) || 0,
      mensal: LFK.num(el('fe-mensal').value) || 0,
      extra: LFK.num(el('fe-extra').value) || 0
    };
    var r = simular(o);

    el('fe-r-alvo').textContent = f(r.alvo);
    el('fe-r-meses').textContent = nMeses(r.meses);
    el('fe-r-tens').textContent = f(r.tens);
    if (r.sobra > 0) { el('fe-r-falta-l').textContent = 'Tens a mais'; el('fe-r-falta').textContent = f(r.sobra); }
    else { el('fe-r-falta-l').textContent = 'Falta juntar'; el('fe-r-falta').textContent = f(r.falta); }
    el('fe-r-tempo').textContent = r.falta === 0 ? 'Já está completo' : (r.tempo === null ? 'Sem poupança mensal' : nMeses(r.tempo));

    var z = LFK.zones('#fe-zonas', Math.round(r.pct));
    var tone = 'is-' + (z && z.tone ? z.tone : 'ok');
    var w = el('fe-r-pct-w'), p = el('fe-r-pct');
    w.textContent = r.pct >= 100 ? 'Completo' : (z && z.label ? z.label : ''); w.className = tone;
    p.textContent = pctTxt(r.pct); p.className = tone;

    var perfil = descSit(o.sit) + (o.rend === 1 ? ', um só rendimento' : ', dois ou mais rendimentos') + (o.dep ? ' e pessoas a cargo' : ' e sem pessoas a cargo');
    var frase = 'Com despesas de ' + f0(o.despesas) + ' por mês, ' + perfil + ', o fundo recomendado é de ' + nMeses(r.meses) + ' de despesas: ' + f0(r.alvo) + '. ';
    if (r.falta === 0) frase += 'Já tens este valor poupado.';
    else if (r.tempo === null) frase += 'Faltam ' + f0(r.falta) + '. Indica quanto consegues poupar por mês para veres quando lá chegas.';
    else frase += 'Faltam ' + f0(r.falta) + '. A pôr de lado ' + f0(r.porMes) + ' por mês, chegas lá em ' + nMeses(r.tempo) + ', em ' + dataAlvo(r.tempo) + '.';
    el('fe-r-frase').textContent = frase;

    var alerta = '';
    if (r.sobra > 0) alerta = '<div class="lfk-alert is-ok" style="margin-top:1rem">O fundo está completo e sobram ' + f0(r.sobra) + '. Esse dinheiro pode ir para objetivos de prazo mais longo. Vê o <a class="lfk-link" href="/comparador-de-corretoras">comparador de corretoras</a> se quiseres começar a investir.</div>';
    else if (r.tempo === null) alerta = '<div class="lfk-alert is-warn" style="margin-top:1rem">Sem poupança mensal nem reforços, o fundo não cresce. O <a class="lfk-link" href="/simulador-orcamento-familiar">simulador de orçamento familiar</a> ajuda-te a ver onde podes cortar.</div>';
    else if (r.tempo > MAX_MESES_GRAFICO) alerta = '<div class="lfk-alert is-warn" style="margin-top:1rem">A este ritmo demoras mais de 10 anos. Começa por um primeiro objetivo de um mês de despesas (' + f0(o.despesas) + ') e aumenta a poupança quando puderes.</div>';
    el('fe-r-alerta').innerHTML = alerta;

    var sdCard = el('fe-sd-card');
    var pode = (o.sit === 'sem' || o.sit === 'termo') && el('fe-sd').checked;
    var sal = pode ? LFK.num(el('fe-salario').value) : 0;
    var sd = pode ? sdEstimado(sal, o.dep) : null;
    if (sd !== null && sd > 0) {
      sdCard.hidden = false;
      var gap = c(Math.max(0, o.despesas - sd));
      el('fe-r-sd').textContent = f(sd);
      el('fe-r-gap').textContent = f(gap);
      var dura = gap > 0 ? Math.floor(r.alvo / gap) : null;
      el('fe-r-dura').textContent = dura === null ? 'Sem limite' : nMeses(dura);
      var fs;
      if (gap === 0) fs = 'O subsídio estimado cobre as despesas que indicaste. O fundo serve para outros imprevistos e para o tempo até ao primeiro pagamento.';
      else fs = 'Sem o subsídio, o fundo recomendado paga ' + nMeses(r.meses) + ' de despesas. Com o subsídio a pagar ' + f0(sd) + ' por mês, o fundo só tem de cobrir ' + f0(gap) + ' e dá para ' + nMeses(dura) + '.';
      fs += ' Estimativa com 24 meses ou mais de descontos, morada no continente e não casado. Para o cálculo completo usa o simulador de subsídio de desemprego.';
      el('fe-r-sd-frase').innerHTML = fs.replace('simulador de subsídio de desemprego', '<a class="lfk-link" href="/simulador-subsidio-de-desemprego">simulador de subsídio de desemprego</a>');
    } else sdCard.hidden = true;

    grafico(r);
  }

  function montar() {
    var root = el('lf-fe');
    if (!root) return;
    root.className = 'lfk';
    root.innerHTML = html();
    if (LFK.selects) LFK.selects(root);
    /* O site usa o Lenis (scroll suave): data-lenis-prevent devolve o scroll nativo a cada lista */
    Array.prototype.forEach.call(root.querySelectorAll('.lfk-dd-list'), function (l) { l.setAttribute('data-lenis-prevent', ''); });
    /* Banner da XTB (componente nativo, #fe-pub): entre o formulario e o placeholder, depois a seguir aos resultados */
    var pub = el('fe-pub'), area = el('fe-area');
    if (pub && area) { pub.style.marginTop = '0'; area.insertBefore(pub, el('fe-placeholder')); }
    if (LFK.numInputs) LFK.numInputs(root);
    if (LFK.theme) LFK.theme(root);
    if (LFK.views) LFK.views(el('fe-evolucao'));
    root.addEventListener('change', function (e) { if (e.target && (e.target.id === 'fe-sit' || e.target.id === 'fe-sd')) atualizarSd(); });
    atualizarSd();
    LFK.calc(el('fe-calcular'), { results: '#fe-resultados', empty: '#fe-placeholder', run: calcular });
  }

  function iniciar() {
    if (window.LFK && LFK.calc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

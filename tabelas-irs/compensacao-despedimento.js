/* Simulador de compensacao por despedimento 2026 - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/). Nao precisa do motor de IRS.
   Regras (Codigo do Trabalho e regimes transitorios), trabalhadores por conta de outrem:
   - Despedimento coletivo, extincao do posto de trabalho ou inadaptacao (art. 366.o, 372.o e 379.o):
     14 dias de retribuicao base e diuturnidades por ano a partir de 1/5/2023 (Lei 13/2023, art. 35.o n.o 2).
     Antes disso, conforme a data do contrato (Lei 69/2013, art. 5.o):
       contrato antes de 1/11/2011: 30 dias ate 31/10/2012 (sem teto na base), 20 dias de 1/11/2012 a 30/9/2013,
         depois 18 dias nos 3 primeiros anos do contrato e 12 nos seguintes; minimo de 3 meses de retribuicao;
       contrato de 1/11/2011 a 30/9/2013: 20 dias ate 30/9/2013, depois 18 dias nos 3 primeiros anos e 12 nos seguintes;
       contrato a partir de 1/10/2013: 12 dias ate 30/4/2023.
     A partir de 1/5/2023 aplica-se 14 dias a todos (leitura mais comum).
   - Fim de contrato a termo certo ou incerto (caducidade, art. 344.o e 345.o): 24 dias por ano, sobre toda a duracao,
     para contratos que acabam desde 1/5/2023. Nao ha compensacao se foi o trabalhador a nao querer renovar.
   - Tetos (art. 366.o n.o 2 e Lei 69/2013 art. 5.o n.os 4 a 6): base de calculo ate 20 x salario minimo (exceto na
     parte ate 31/10/2012); total ate 12 x a retribuicao mensal (ou 240 x salario minimo se a base passar 20 x).
     Se a parte ate 31/10/2012 ja passar o teto, recebe essa parte e nada mais.
   - Fracoes de ano: proporcionais (dias / 365).
   - Na cessacao: ferias e subsidio de ferias proporcionais e subsidio de Natal proporcional (art. 245.o e 263.o).
   - IRS: a compensacao so paga IRS na parte acima de um mes de remuneracao media por ano de antiguidade (CIRS art. 2.o n.o 4).
   Salario minimo 2026: 920€. Atualizar em janeiro de 2027. */
(function () {
  'use strict';
  if (window.__lfCdInit) return;
  window.__lfCdInit = true;

  var RMMG = 920, DIA = 86400000;

  function el(id) { return document.getElementById(id); }
  function radio(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function f(v) { return window.LFK && LFK.fmt ? LFK.fmt(v) : (Math.round(v * 100) / 100) + '€'; }
  function c(v) { return Math.round(v * 100) / 100; }
  function d(s) { var p = String(s).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function dtxt(t) { var x = new Date(t); return ('0' + x.getUTCDate()).slice(-2) + '/' + ('0' + (x.getUTCMonth() + 1)).slice(-2) + '/' + x.getUTCFullYear(); }
  function addAnos(t, n) { var x = new Date(t); x.setUTCFullYear(x.getUTCFullYear() + n); return x.getTime(); }

  var D2011 = d('2011-11-01'), D2012 = d('2012-11-01'), D2013 = d('2013-10-01'), D2023 = d('2023-05-01');

  function html() {
    var ajuda = function (t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; };
    var hoje = new Date().toISOString().slice(0, 10);
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Calculadora de compensação por despedimento</div>' +
      '<form class="lfk-stack" id="cd-form" onsubmit="return false">' +
      '<div class="lfk-field"><span class="lfk-label">Motivo do fim do contrato' + ajuda('Despedimento coletivo, extinção do posto de trabalho e inadaptação seguem a mesma regra. No fim de um contrato a termo, só há compensação se não foste tu a pedir para não renovar.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="motivo" value="col" checked> <span>Despedimento coletivo, extinção do posto ou inadaptação</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="motivo" value="termo"> <span>Fim de contrato a termo</span></label>' +
      '</div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="cd-salario">Salário base mais diuturnidades por mês' + ajuda('A retribuição base mensal bruta, mais as diuturnidades se as tiveres. Não incluas subsídio de refeição, prémios nem horas extra.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="cd-salario" name="salario" inputmode="decimal" value="1.500"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="cd-inicio">Início do contrato</label>' +
      '<input class="lfk-input" type="date" id="cd-inicio" name="inicio" value="2018-03-01" min="1960-01-01" max="' + hoje + '"></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="cd-fim">Último dia de trabalho</label>' +
      '<input class="lfk-input" type="date" id="cd-fim" name="fim" value="' + hoje + '" min="1990-01-01"></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="cd-ferias">Dias de férias deste ano ainda por gozar' + ajuda('Os dias de férias que venceram a 1 de janeiro e ainda não gozaste. A empresa tem de tos pagar quando sais.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="cd-ferias" name="ferias" inputmode="numeric" value="0"><span class="lfk-unit">dias</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-check"><input type="checkbox" id="cd-subf" name="subf"> <span>Ainda não recebi o subsídio de férias deste ano</span></label></div>' +
      '<button type="button" class="lfk-btn is-block" id="cd-calcular">Calcular</button>' +
      '</form></div></div>' +
      '<div class="lfk-calc-results" id="cd-area">' +
      '<div id="cd-resultados" hidden>' +
      '<div class="lfk-card">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Resultados</h2></div>' +
      '<div class="lfk-kv is-total"><span>Total a receber (bruto)</span><span id="cd-r-total">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Compensação</span><span id="cd-r-comp">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Férias e subsídios proporcionais</span><span id="cd-r-prop">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Férias por gozar e subsídio em falta</span><span id="cd-r-venc">0,00€</span></div>' +
      '<div class="lfk-kv"><span>Antiguidade</span><span id="cd-r-antig"></span></div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="cd-r-frase"></p>' +
      '<div id="cd-r-alerta"></div>' +
      '</div>' +
      '<div class="lfk-card" style="margin-top:1.5rem">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Como é calculado</h2></div>' +
      '<div id="cd-r-passos"></div>' +
      '</div></div>' +
      '<div class="lfk-empty" id="cd-placeholder"><p>Preenche os dados e clica em <b>Calcular</b> para veres os resultados.</p></div>' +
      '</div>' +
      '</div>';
  }

  function kv(a, b) { return '<div class="lfk-kv"><span>' + a + '</span><span>' + b + '</span></div>'; }

  /* Exposto para testes. o: { motivo, sal, ini, fim (ms UTC), ferias, subf } */
  function simular(o) {
    var B = o.sal, teto20 = 20 * RMMG, Bc = Math.min(B, teto20);
    var capTotal = B > teto20 ? 240 * RMMG : 12 * B;
    var fimExcl = o.fim + DIA; /* o ultimo dia de trabalho conta */
    var fatias = [];
    function fatia(nome, a, b, dias, base) {
      var ini = Math.max(a, o.ini), fim = Math.min(b, fimExcl);
      if (fim <= ini) return 0;
      var anos = (fim - ini) / DIA / 365;
      var v = base / 30 * dias * anos;
      fatias.push({ nome: nome, ini: ini, fim: fim - DIA, dias: dias, anos: anos, valor: c(v) });
      return v;
    }
    var comp = 0, regra = '', aplicavel = true;
    if (o.motivo === 'termo') {
      if (o.ini < D2013) aplicavel = false;
      comp = fatia('Toda a duração do contrato', o.ini, fimExcl, 24, Bc);
      comp = Math.min(comp, capTotal);
      regra = 'termo';
    } else {
      var tres = addAnos(o.ini, 3);
      var a = 0, resto = 0;
      if (o.ini < D2011) {
        a = fatia('Até 31/10/2012', o.ini, D2012, 30, B);
        resto += fatia('De 1/11/2012 a 30/9/2013', D2012, D2013, 20, Bc);
      } else if (o.ini < D2013) {
        a = fatia('Até 30/9/2013', o.ini, D2013, 20, Bc);
      }
      /* De 1/10/2013 a 30/4/2023: 18 dias enquanto o contrato tem menos de 3 anos (so contratos anteriores a 1/10/2013), depois 12 */
      if (o.ini < D2013 && tres > D2013) {
        resto += fatia('De 1/10/2013 aos 3 anos de contrato', D2013, Math.min(tres, D2023), 18, Bc);
        resto += fatia('Dos 3 anos de contrato a 30/4/2023', Math.max(tres, D2013), D2023, 12, Bc);
      } else {
        resto += fatia('De ' + dtxt(Math.max(o.ini, D2013)) + ' a 30/4/2023', D2013, D2023, 12, Bc);
      }
      resto += fatia('Desde ' + dtxt(Math.max(o.ini, D2023)), D2023, fimExcl, 14, Bc);
      if (a >= capTotal) { comp = a; regra = 'congelado'; }
      else { comp = Math.min(a + resto, capTotal); if (a + resto > capTotal) regra = 'teto'; }
      if (o.ini < D2011 && comp < 3 * B) { comp = 3 * B; regra = 'minimo'; }
    }
    comp = c(comp);
    /* Proporcionais do ano da cessacao: ferias, subsidio de ferias e subsidio de Natal */
    var anoFim = new Date(o.fim).getUTCFullYear();
    var iniAno = Math.max(Date.UTC(anoFim, 0, 1), o.ini);
    var fracAno = Math.max(0, (fimExcl - iniAno) / DIA) / (Date.UTC(anoFim + 1, 0, 1) - Date.UTC(anoFim, 0, 1)) * DIA;
    var prop = c(3 * B * fracAno);
    var venc = c(B / 22 * Math.min(Math.max(o.ferias || 0, 0), 30) + (o.subf ? B : 0));
    var antigAnos = (fimExcl - o.ini) / DIA / 365;
    var isentoIRS = c(B * 14 / 12 * Math.max(antigAnos, 0));
    return { comp: comp, fatias: fatias, regra: regra, aplicavel: aplicavel, capTotal: c(capTotal), Bc: Bc, prop: prop, venc: venc, total: c(comp + prop + venc), antigAnos: antigAnos, fracAno: fracAno, isentoIRS: isentoIRS };
  }
  window.__lfCdSimular = simular;

  function antigTxt(anos) {
    var a = Math.floor(anos + 1e-9), m = Math.floor((anos - a) * 12 + 1e-9);
    return a + (a === 1 ? ' ano' : ' anos') + (m ? ' e ' + m + (m === 1 ? ' mês' : ' meses') : '');
  }

  function calcular() {
    var sal = LFK.num(el('cd-salario').value);
    var ini = el('cd-inicio').value, fim = el('cd-fim').value;
    if (!(sal > 0) || !ini || !fim) return false;
    var o = { motivo: radio('motivo'), sal: sal, ini: d(ini), fim: d(fim), ferias: LFK.num(el('cd-ferias').value) || 0, subf: el('cd-subf').checked };
    if (o.fim < o.ini) return false;
    var r = simular(o);
    el('cd-r-total').textContent = f(r.total);
    el('cd-r-comp').textContent = f(r.comp);
    el('cd-r-prop').textContent = f(r.prop);
    el('cd-r-venc').textContent = f(r.venc);
    el('cd-r-antig').textContent = antigTxt(r.antigAnos);

    var frase = o.motivo === 'termo'
      ? 'No fim de um contrato a termo, a compensação é de 24 dias de salário base por cada ano de contrato: ' + f(r.comp) + '. '
      : 'A compensação soma várias partes, porque os dias por ano mudaram em 2012, 2013 e 2023: hoje são 14 dias de salário base por cada ano. No teu caso dá ' + f(r.comp) + '. ';
    if (r.regra === 'teto') frase += 'Fica no limite de ' + f(r.capTotal) + ' (12 meses de salário). ';
    if (r.regra === 'congelado') frase += 'A parte até outubro de 2012 já passa o limite de 12 meses de salário, por isso recebes essa parte e nada mais. ';
    if (r.regra === 'minimo') frase += 'Como o contrato é anterior a novembro de 2011, a compensação não pode ser inferior a 3 meses de salário. ';
    frase += 'Somam-se as férias e os subsídios de férias e de Natal proporcionais ao tempo trabalhado este ano. ';
    frase += r.comp <= r.isentoIRS ? 'A compensação não paga IRS: fica abaixo de um mês de remuneração média por cada ano de antiguidade.' : 'Paga IRS a parte da compensação acima de ' + f(r.isentoIRS) + '.';
    el('cd-r-frase').textContent = frase;

    var alerta = '';
    if (o.motivo === 'termo' && !r.aplicavel) alerta = '<div class="lfk-alert is-warn" style="margin-top:1rem">Contratos a termo assinados antes de outubro de 2013 têm regras de transição próprias. Confirma o valor com o simulador da ACT ou com um advogado.</div>';
    else if (o.motivo === 'termo') alerta = '<div class="lfk-alert" style="margin-top:1rem">Se foste tu a comunicar que não querias renovar o contrato, não há compensação.</div>';
    else if (o.ini < D2013) alerta = '<div class="lfk-alert" style="margin-top:1rem">Para contratos anteriores a outubro de 2013, aplicámos os 14 dias desde maio de 2023, que é a leitura mais comum da lei. Há quem defenda 12 dias, por isso confirma o valor com a empresa ou com a ACT.</div>';
    if (new Date(o.fim).getUTCFullYear() > 2026 && (sal > 20 * RMMG || r.regra === 'teto')) alerta += '<div class="lfk-alert" style="margin-top:1rem">Os limites usam o salário mínimo do ano em que o contrato acaba. Para 2027 ainda não foi publicado, por isso usámos o de 2026 (920€).</div>';
    el('cd-r-alerta').innerHTML = alerta;

    var passos = kv('Base de cálculo por mês', f(r.Bc) + (r.Bc < sal ? ' (teto de 20 salários mínimos)' : ''));
    r.fatias.forEach(function (z) {
      passos += kv(z.nome + ' (' + z.dias + ' dias por ano)', f(z.valor));
    });
    passos += kv('Limite da compensação', f(r.capTotal));
    passos += kv('Proporcionais do ano (férias, subsídio de férias e de Natal)', f(r.prop));
    el('cd-r-passos').innerHTML = passos;
  }

  function montar() {
    var root = el('lf-cd');
    if (!root) return;
    root.className = 'lfk';
    root.innerHTML = html();
    if (LFK.selects) LFK.selects(root);
    if (LFK.numInputs) LFK.numInputs(root);
    if (LFK.theme) LFK.theme(root);
    /* Banner da XTB (componente nativo, #cd-pub): entre o formulario e o placeholder, depois a seguir aos resultados */
    var pub = el('cd-pub'), area = el('cd-area');
    if (pub && area) { pub.style.marginTop = '0'; area.insertBefore(pub, el('cd-placeholder')); }
    LFK.calc(el('cd-calcular'), { results: '#cd-resultados', empty: '#cd-placeholder', run: calcular });
  }

  function iniciar() {
    if (window.LFK && LFK.calc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

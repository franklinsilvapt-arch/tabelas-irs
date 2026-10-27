/* Calculadora de licenca parental 2026 e 2027 - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/). Monta-se em #lf-lp (embed dentro do artigo).
   Regras atuais (Codigo do Trabalho, art. 40.o, 41.o e 43.o; DL 91/2009; guia gov.pt atualizado a 4/9/2026):
   - 120 dias a 100% ou 150 dias a 80%, sem partilha.
   - Partilha (cada progenitor goza sozinho 30 dias seguidos ou 2 x 15, depois das 6 semanas da mae): +30 dias,
     ou seja 150 dias a 100% ou 180 dias a 83%. 180 dias a 90% se o pai gozar 60 dias seguidos ou 2 x 30
     (sem contar os dias obrigatorios do pai).
   - Mae: 42 dias obrigatorios a seguir ao parto; ate 30 dias antes do parto, que contam para o total.
   - Pai: 28 dias obrigatorios (7 seguidos a seguir ao nascimento, o resto nas 6 semanas da mae) e 7 opcionais,
     sempre pagos a 100%.
   - Gemeos: +30 dias por cada gemeo alem do primeiro (art. 40.o n.o 6).
   - Subsidio diario = remuneracao de referencia (R/180, 6 meses) x percentagem, minimo 80% de IAS/30 (14,32€ em 2026).
   Regras para licencas que comecam a partir de 1/1/2027 (texto aprovado na votacao final global a 16/10/2026,
   ainda sem publicacao em Diario da Republica): 150 dias a 100% com ou sem partilha; 180 dias a 100% com partilha
   ou a 83% sem partilha; 210 dias a 86% com partilha ou a 90% se o pai gozar 60 dias seguidos ou 2 x 30.
   Sem regra transitoria: licencas iniciadas ate 31/12/2026 ficam com as regras atuais. */
(function () {
  'use strict';
  if (window.__lfLpInit) return;
  window.__lfLpInit = true;

  var IAS = 537.13, MIN_DIA = Math.round(0.8 * IAS / 30 * 100) / 100, DIA = 86400000;
  var D2027 = Date.UTC(2027, 0, 1);

  var ATUAL = [
    { dias: 120, p: 1, nome: '120 dias', cond: 'Sem partilha' },
    { dias: 150, p: 0.8, nome: '150 dias', cond: 'Sem partilha' },
    { dias: 150, p: 1, nome: '150 dias', cond: 'Partilhada: cada um 30 dias sozinho' },
    { dias: 180, p: 0.83, nome: '180 dias', cond: 'Partilhada: cada um 30 dias sozinho' },
    { dias: 180, p: 0.9, nome: '180 dias', cond: 'Partilhada: pai 60 dias sozinho' }
  ];
  var NOVO = [
    { dias: 150, p: 1, nome: '150 dias', cond: 'Com ou sem partilha' },
    { dias: 180, p: 0.83, nome: '180 dias', cond: 'Sem partilha' },
    { dias: 180, p: 1, nome: '180 dias', cond: 'Partilhada: cada um 30 dias sozinho' },
    { dias: 210, p: 0.86, nome: '210 dias', cond: 'Partilhada: cada um 30 dias sozinho' },
    { dias: 210, p: 0.9, nome: '210 dias', cond: 'Partilhada: pai 60 dias sozinho' }
  ];

  function el(id) { return document.getElementById(id); }
  function f(v) { return window.LFK && LFK.fmt ? LFK.fmt(v) : (Math.round(v * 100) / 100) + '€'; }
  function c(v) { return Math.round(v * 100) / 100; }
  function d(s) { var p = String(s).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function dtxt(t) { var x = new Date(t); return ('0' + x.getUTCDate()).slice(-2) + '/' + ('0' + (x.getUTCMonth() + 1)).slice(-2) + '/' + x.getUTCFullYear(); }
  function pct(p) { return Math.round(p * 100) + '%'; }

  function html() {
    var ajuda = function (t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; };
    var prev = new Date(Date.now() + 120 * DIA).toISOString().slice(0, 10);
    var salAjuda = 'O salário bruto mensal, antes de descontos. A Segurança Social usa a média dos 6 meses que acabam 2 meses antes da licença, sem os subsídios de férias e de Natal. Deixa em branco se não trabalhas por conta de outrem ou não tens descontos.';
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Calculadora de licença parental</div>' +
      '<form class="lfk-stack" id="lp-form" onsubmit="return false">' +
      '<div class="lfk-field"><label class="lfk-label" for="lp-parto">Data prevista do parto</label>' +
      '<input class="lfk-input" type="date" id="lp-parto" name="parto" value="' + prev + '" min="2025-01-01" max="2028-12-31"></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="lp-antes">Dias de licença da mãe antes do parto' + ajuda('A mãe pode começar a licença até 30 dias antes do parto, sem precisar de indicação médica. Estes dias contam para o total da licença e marcam a data de início.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="lp-antes" name="antes" inputmode="numeric" value="0"><span class="lfk-unit">dias</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="lp-bebes">Número de bebés</label>' +
      '<select class="lfk-input" id="lp-bebes" name="bebes"><option value="1" selected>1</option><option value="2">2 (gémeos)</option><option value="3">3</option></select></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="lp-mae">Salário bruto da mãe por mês' + ajuda(salAjuda) + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="lp-mae" name="mae" inputmode="decimal" value="1.500"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="lp-pai">Salário bruto do pai por mês' + ajuda(salAjuda) + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="lp-pai" name="pai" inputmode="decimal" value="1.500"><span class="lfk-unit">€</span></div></div>' +
      '<button type="button" class="lfk-btn is-block" id="lp-calcular">Calcular</button>' +
      '</form></div></div>' +
      '<div class="lfk-calc-results" id="lp-area">' +
      '<div id="lp-resultados" hidden>' +
      '<div class="lfk-card">' +
      '<div class="lfk-card-head"><div class="lfk-h-sm">Datas da licença</div></div>' +
      '<div class="lfk-kv"><span>Regras que se aplicam</span><span id="lp-r-regras"></span></div>' +
      '<div class="lfk-kv"><span>Início da licença</span><span id="lp-r-inicio"></span></div>' +
      '<div class="lfk-kv"><span>Fim dos 42 dias obrigatórios da mãe</span><span id="lp-r-mae"></span></div>' +
      '<div class="lfk-kv"><span>Pai: 7 dias seguidos a seguir ao parto, até</span><span id="lp-r-pai7"></span></div>' +
      '<div class="lfk-kv"><span>Pai: restantes 21 dias obrigatórios, até</span><span id="lp-r-pai28"></span></div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="lp-r-frase"></p>' +
      '<div id="lp-r-alerta"></div>' +
      '</div>' +
      '<div class="lfk-card" style="margin-top:1.5rem">' +
      '<div class="lfk-card-head"><div class="lfk-h-sm">Quanto recebes em cada opção</div></div>' +
      '<div class="lfk-table-wrap"><table class="lfk-table"><thead><tr><th>Opção</th><th>Termina a</th><th>Mãe por mês</th><th>Pai por mês</th></tr></thead><tbody id="lp-r-tabela"></tbody></table></div>' +
      '<p class="lfk-table-note" id="lp-r-nota"></p>' +
      '</div></div>' +
      '<div class="lfk-empty" id="lp-placeholder"><p>Preenche os dados e clica em <b>Calcular</b> para veres as datas e os valores.</p></div>' +
      '</div>' +
      '</div>';
  }

  /* Exposto para testes. o: { parto (ms UTC), antes, bebes, mae, pai } (salarios 0 = sem salario) */
  function simular(o) {
    var inicio = o.parto - o.antes * DIA;
    var novo = inicio >= D2027;
    var extra = 30 * (o.bebes - 1);
    function mensal(sal, p) { if (!(sal > 0)) return null; var dia = Math.max(c(sal / 30 * p), MIN_DIA); return c(dia * 30); }
    var opcoes = (novo ? NOVO : ATUAL).map(function (x) {
      var dias = x.dias + extra;
      return { nome: x.nome, cond: x.cond, dias: dias, p: x.p, fim: inicio + (dias - 1) * DIA, mae: mensal(o.mae, x.p), pai: mensal(o.pai, x.p) };
    });
    return {
      novo: novo, inicio: inicio, fimMae: o.parto + 41 * DIA, fimPai7: o.parto + 6 * DIA, fimPai28: o.parto + 41 * DIA,
      opcoes: opcoes, paiCem: mensal(o.pai, 1), extra: extra
    };
  }
  window.__lfLpSimular = simular;

  function calcular() {
    var parto = el('lp-parto').value;
    if (!parto) return false;
    var antes = Math.round(LFK.num(el('lp-antes').value) || 0);
    if (antes < 0 || antes > 30) { el('lp-antes').value = Math.min(Math.max(antes, 0), 30); antes = Math.min(Math.max(antes, 0), 30); }
    var o = { parto: d(parto), antes: antes, bebes: +el('lp-bebes').value || 1, mae: LFK.num(el('lp-mae').value) || 0, pai: LFK.num(el('lp-pai').value) || 0 };
    var r = simular(o);

    el('lp-r-regras').textContent = r.novo ? 'Novas (2027)' : 'Atuais';
    el('lp-r-inicio').textContent = dtxt(r.inicio);
    el('lp-r-mae').textContent = dtxt(r.fimMae);
    el('lp-r-pai7').textContent = dtxt(r.fimPai7);
    el('lp-r-pai28').textContent = dtxt(r.fimPai28);

    var linhas = '';
    r.opcoes.forEach(function (x) {
      linhas += '<tr><td>' + x.dias + ' dias a ' + pct(x.p) + '<br><span class="lfk-small lfk-muted">' + x.cond + '</span></td>' +
        '<td class="is-num">' + dtxt(x.fim) + '</td>' +
        '<td class="is-num">' + (x.mae === null ? '-' : f(x.mae)) + '</td>' +
        '<td class="is-num">' + (x.pai === null ? '-' : f(x.pai)) + '</td></tr>';
    });
    el('lp-r-tabela').innerHTML = linhas;
    el('lp-r-nota').textContent = 'Valores por mês de 30 dias, sem IRS nem descontos para a Segurança Social. Nos 28 dias obrigatórios e nos 7 opcionais, o pai recebe sempre 100%' + (r.paiCem !== null ? ' (' + f(r.paiCem) + ' por mês)' : '') + '. Cada um recebe só nos dias em que está de licença.' + (r.extra ? ' Inclui mais ' + r.extra + ' dias por gémeos.' : '');

    var base = r.opcoes[0], melhor = r.opcoes[2];
    var frase = r.novo
      ? 'Como a licença começa em ' + dtxt(r.inicio) + ', aplicam-se as regras novas: ' + base.dias + ' dias pagos a 100% sem partilha, ou ' + melhor.dias + ' dias a 100% se cada um ficar pelo menos 30 dias sozinho com o bebé.'
      : 'Como a licença começa em ' + dtxt(r.inicio) + ', aplicam-se as regras atuais: ' + base.dias + ' dias pagos a 100% sem partilha, ou ' + melhor.dias + ' dias a 100% se cada um ficar pelo menos 30 dias sozinho com o bebé.';
    el('lp-r-frase').textContent = frase;

    var alerta = '';
    if (r.novo) alerta += '<div class="lfk-alert" style="margin-top:1rem">As regras novas foram aprovadas pelo Parlamento a 16 de outubro de 2026, para licenças que comecem a partir de 1 de janeiro de 2027. Ainda falta a promulgação e a publicação em Diário da República.</div>';
    else if (o.parto >= D2027) alerta += '<div class="lfk-alert is-warn" style="margin-top:1rem">O parto é em 2027, mas a licença começa em 2026 por causa dos dias antes do parto. Ficas com as regras atuais até ao fim. Se a licença começar a 1 de janeiro de 2027 ou depois, passam a aplicar-se as regras novas, com mais 30 dias pagos a 100%.</div>';
    else if (r.inicio >= Date.UTC(2026, 9, 1)) alerta += '<div class="lfk-alert" style="margin-top:1rem">Licenças que começam até 31 de dezembro de 2026 ficam com as regras atuais até ao fim, mesmo que continuem em 2027. A lei nova não tem regra de transição.</div>';
    if ((o.mae > 0 && o.mae / 30 * 0.8 < MIN_DIA) || (o.pai > 0 && o.pai / 30 * 0.8 < MIN_DIA)) alerta += '<div class="lfk-alert" style="margin-top:1rem">O subsídio não pode ser inferior a ' + f(MIN_DIA) + ' por dia (80% de 1/30 do IAS de 2026), por isso nalgumas opções aplicámos esse mínimo.</div>';
    el('lp-r-alerta').innerHTML = alerta;
  }

  function montar() {
    var root = el('lf-lp');
    if (!root) return;
    root.className = 'lfk';
    root.innerHTML = html();
    /* Dentro de um artigo, a calculadora ocupa a largura da coluna de texto (o kit fixa 52,625rem para as paginas de ferramentas) */
    var calcEl = root.querySelector('.lfk-calc');
    if (calcEl && root.closest('.w-richtext')) { calcEl.style.width = '100%'; calcEl.style.minWidth = '0'; }
    if (LFK.selects) LFK.selects(root);
    if (LFK.numInputs) LFK.numInputs(root);
    if (LFK.theme) LFK.theme(root);
    LFK.calc(el('lp-calcular'), { results: '#lp-resultados', empty: '#lp-placeholder', run: calcular });
  }

  function iniciar() {
    if (window.LFK && LFK.calc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

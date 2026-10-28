/* Calculadora do Complemento Solidario para Idosos (CSI) - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/). Monta-se em #lf-csi (embed dentro do artigo).
   Regras (DL 232/2005 e Decreto Regulamentar 3/2006, versoes consolidadas):
   - Valor de referencia (VR) anual: 8.040€ em 2026 (Portaria n.o 480-D/2025/1). 2027: 8.640€ (720€ x 12),
     anunciado pelo Governo para o OE 2027, ainda nao publicado.
   - Casal: VR do casal = 1,75 x VR (DR 3/2006, art. 8.o n.o 2).
   - Recursos: rendimentos do ano anterior do requerente e do conjuge (os dos filhos deixaram de contar em 6/2024).
     Pensoes, trabalho, rendas, outras prestacoes, transferencias e 5% do patrimonio mobiliario e de imoveis
     (exceto a habitacao permanente) (DR 3/2006, art. 17.o, 19.o e 20.o).
   - Calculo (DR 3/2006, art. 10.o e 11.o):
     sozinho: CSI = VR - R, se R < VR;
     casal, so um pede: CSI = min(VR - Y1, VRc - (Y1 + Y2)), se Y1 < VR e Y1 + Y2 < VRc;
     casal, os dois pedem: total = VRc - (Y1 + Y2), repartido por W1 = (VR - Y1) / (2VR - Y1 - Y2) e W2 = 1 - W1,
       se cada um tiver Yi < VR e Y1 + Y2 < VRc. Se um deles tiver Yi >= VR, deixa de ser requerente.
   - O CSI e pago 12 vezes por ano. Rendimentos comuns do casal repartidos em partes iguais (art. 12.o n.o 3). */
(function () {
  'use strict';
  if (window.__lfCsiInit) return;
  window.__lfCsiInit = true;

  var VR_ANO = { 2026: 8040, 2027: 8640 };

  function el(id) { return document.getElementById(id); }
  function radio(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function f(v) { return window.LFK && LFK.fmt ? LFK.fmt(v) : (Math.round(v * 100) / 100) + '€'; }
  function c(v) { return Math.round(v * 100) / 100; }
  function kv(a, b) { return '<div class="lfk-kv"><span>' + a + '</span><span>' + b + '</span></div>'; }

  function html() {
    var ajuda = function (t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; };
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Calculadora do complemento solidário para idosos</div>' +
      '<form class="lfk-stack" id="csi-form" onsubmit="return false">' +
      '<div class="lfk-field"><label class="lfk-label" for="csi-ano">Valores de</label>' +
      '<select class="lfk-input" id="csi-ano"><option value="2026" selected>2026 (670€ por mês)</option><option value="2027">2027 (720€ por mês, proposta)</option></select></div>' +
      '<div class="lfk-field"><span class="lfk-label">Com quem vives' + ajuda('Conta o cônjuge ou a pessoa com quem vives em união de facto há mais de 2 anos. Os rendimentos dos filhos não contam desde junho de 2024.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="csi-agr" value="so" checked> <span>Sozinho ou com outros familiares</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="csi-agr" value="casal"> <span>Com cônjuge ou em união de facto</span></label>' +
      '</div></div>' +
      '<div class="lfk-field" id="csi-quem-f" hidden><span class="lfk-label">Quem pede o complemento</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="csi-quem" value="um" checked> <span>Só eu</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="csi-quem" value="ambos"> <span>Os dois</span></label>' +
      '</div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="csi-p1">A tua pensão bruta por mês' + ajuda('Soma todas as pensões que recebes (velhice, sobrevivência, invalidez, de Portugal ou do estrangeiro), antes de descontos. Contamos 14 pagamentos por ano.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="csi-p1" inputmode="decimal" value="400"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field" id="csi-p2-f" hidden><label class="lfk-label" for="csi-p2">Pensão bruta do cônjuge por mês</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="csi-p2" inputmode="decimal" value="400"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="csi-outros" id="csi-outros-l">Outros rendimentos por ano' + ajuda('Trabalho, rendas de casas, outras prestações sociais e dinheiro que recebas regularmente de outras pessoas, por exemplo dos filhos. Valor bruto do ano passado.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="csi-outros" inputmode="decimal" value="0"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="csi-poup">Poupanças e investimentos' + ajuda('Depósitos, certificados de aforro, ações, fundos e outras aplicações a 31 de dezembro do ano passado. A Segurança Social conta 5% deste valor como rendimento.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="csi-poup" inputmode="decimal" value="0"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="csi-imo">Valor patrimonial de outros imóveis' + ajuda('O valor patrimonial tributário que está na caderneta predial de casas ou terrenos que não sejam a tua habitação permanente. A casa onde vives não conta. A Segurança Social conta 5% deste valor como rendimento.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="csi-imo" inputmode="decimal" value="0"><span class="lfk-unit">€</span></div></div>' +
      '<button type="button" class="lfk-btn is-block" id="csi-calcular">Calcular</button>' +
      '</form></div></div>' +
      '<div class="lfk-calc-results" id="csi-area">' +
      '<div id="csi-resultados" hidden>' +
      '<div class="lfk-card">' +
      '<div class="lfk-card-head"><div class="lfk-h-sm">Resultados</div></div>' +
      '<div id="csi-r-linhas"></div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="csi-r-frase"></p>' +
      '<div id="csi-r-alerta"></div>' +
      '</div>' +
      '<div class="lfk-card" style="margin-top:1.5rem">' +
      '<div class="lfk-card-head"><div class="lfk-h-sm">Como é calculado, por ano</div></div>' +
      '<div id="csi-r-passos"></div>' +
      '</div></div>' +
      '<div class="lfk-empty" id="csi-placeholder"><p>Preenche os dados e clica em <b>Calcular</b> para veres se tens direito e quanto recebes.</p></div>' +
      '</div>' +
      '</div>';
  }

  /* Exposto para testes. o: { ano, casal, ambos, p1, p2, outros, poup, imo } (pensoes por mes, resto por ano) */
  function simular(o) {
    var VR = VR_ANO[o.ano] || VR_ANO[2026], VRc = c(1.75 * VR);
    var comum = (o.outros || 0) + 0.05 * (o.poup || 0) + 0.05 * (o.imo || 0);
    var r = { VR: VR, VRc: VRc, casal: !!o.casal };
    if (!o.casal) {
      var R = c(o.p1 * 14 + comum);
      r.Y1 = R; r.total = R;
      r.c1 = R < VR ? c(VR - R) : 0; r.c2 = null; r.modo = 'so';
    } else {
      var Y1 = c(o.p1 * 14 + comum / 2), Y2 = c(o.p2 * 14 + comum / 2), T = c(Y1 + Y2);
      r.Y1 = Y1; r.Y2 = Y2; r.total = T;
      var um = function (Ya) { return (Ya < VR && T < VRc) ? c(Math.min(VR - Ya, VRc - T)) : 0; };
      if (!o.ambos) { r.c1 = um(Y1); r.c2 = null; r.modo = 'um'; }
      else if (Y1 < VR && Y2 < VR && T < VRc) {
        var tot = VRc - T, W1 = (VR - Y1) / (2 * VR - Y1 - Y2);
        r.c1 = c(tot * W1); r.c2 = c(tot - tot * W1); r.modo = 'ambos';
      } else if (Y1 < VR && Y2 >= VR) { r.c1 = um(Y1); r.c2 = 0; r.modo = 'ambos-1'; }
      else if (Y2 < VR && Y1 >= VR) { r.c1 = 0; r.c2 = um(Y2); r.modo = 'ambos-2'; }
      else { r.c1 = 0; r.c2 = 0; r.modo = 'ambos'; }
    }
    r.m1 = c(r.c1 / 12); r.m2 = r.c2 === null ? null : c(r.c2 / 12);
    return r;
  }
  window.__lfCsiSimular = simular;

  function ajustarCampos() {
    var casal = radio('csi-agr') === 'casal';
    el('csi-quem-f').hidden = !casal;
    el('csi-p2-f').hidden = !casal;
    el('csi-outros-l').firstChild.nodeValue = casal ? 'Outros rendimentos do casal por ano' : 'Outros rendimentos por ano';
  }

  function calcular() {
    var casal = radio('csi-agr') === 'casal';
    var o = {
      ano: +el('csi-ano').value, casal: casal, ambos: casal && radio('csi-quem') === 'ambos',
      p1: LFK.num(el('csi-p1').value) || 0, p2: casal ? (LFK.num(el('csi-p2').value) || 0) : 0,
      outros: LFK.num(el('csi-outros').value) || 0, poup: LFK.num(el('csi-poup').value) || 0, imo: LFK.num(el('csi-imo').value) || 0
    };
    var r = simular(o);
    var linhas = '';
    if (r.c2 === null) {
      linhas += '<div class="lfk-kv is-total"><span>Complemento por mês</span><span>' + f(r.m1) + '</span></div>';
      linhas += kv('Por ano', f(r.c1));
    } else {
      linhas += '<div class="lfk-kv is-total"><span>Casal, por mês</span><span>' + f(c(r.m1 + r.m2)) + '</span></div>';
      linhas += kv('Para ti, por mês', f(r.m1));
      linhas += kv('Para o cônjuge, por mês', f(r.m2));
    }
    el('csi-r-linhas').innerHTML = linhas;

    var temDireito = r.c1 > 0 || (r.c2 || 0) > 0;
    var frase;
    if (!temDireito) {
      frase = r.casal
        ? 'Com estes rendimentos, o casal não tem direito ao complemento. Os rendimentos do casal (' + f(r.total) + ' por ano) ou os de quem pede têm de ficar abaixo dos limites: ' + f(r.VRc) + ' para o casal e ' + f(r.VR) + ' para cada um.'
        : 'Com estes rendimentos, não tens direito ao complemento. Os teus rendimentos (' + f(r.total) + ' por ano) passam o limite de ' + f(r.VR) + '.';
    } else if (r.c2 === null) {
      frase = 'Tens direito a ' + f(r.m1) + ' por mês, pagos 12 vezes por ano. É a diferença entre o limite e os rendimentos considerados, a dividir por 12.';
    } else {
      frase = 'O casal recebe ' + f(c(r.m1 + r.m2)) + ' por mês. A Segurança Social reparte o valor pelos dois conforme o rendimento de cada um: quem tem a pensão mais baixa recebe mais.';
    }
    el('csi-r-frase').textContent = frase;

    var alerta = '';
    if (temDireito) alerta += '<div class="lfk-alert" style="margin-top:1rem">Quem recebe o complemento tem também medicamentos comparticipados gratuitos e apoio para óculos e próteses dentárias. É preciso ter a idade normal de reforma (' + (+el('csi-ano').value === 2027 ? '66 anos e 11 meses em 2027' : '66 anos e 9 meses em 2026') + ') e viver em Portugal há pelo menos 6 anos.</div>';
    if (o.ano === 2027) alerta += '<div class="lfk-alert is-warn" style="margin-top:1rem">O valor de 2027 (720€ por mês) foi anunciado pelo Governo para o Orçamento do Estado de 2027 e ainda pode mudar até ser publicado.</div>';
    if (r.modo === 'ambos-1' || r.modo === 'ambos-2') alerta += '<div class="lfk-alert" style="margin-top:1rem">Um de vocês tem rendimentos acima de ' + f(r.VR) + ' por ano e não pode pedir. Só o outro recebe o complemento.</div>';
    el('csi-r-alerta').innerHTML = alerta;

    var comum = c(o.outros + 0.05 * o.poup + 0.05 * o.imo);
    var passos = kv('Pensão (14 meses)', f(c(o.p1 * 14)));
    if (r.casal) passos += kv('Pensão do cônjuge', f(c(o.p2 * 14)));
    if (o.outros) passos += kv('Outros rendimentos', f(o.outros));
    if (o.poup) passos += kv('5% das poupanças', f(c(0.05 * o.poup)));
    if (o.imo) passos += kv('5% dos imóveis', f(c(0.05 * o.imo)));
    passos += kv('Total de rendimentos', f(r.total));
    passos += kv(r.casal ? 'Limite por pessoa' : 'Limite', f(r.VR));
    if (r.casal) passos += kv('Limite do casal', f(r.VRc));
    el('csi-r-passos').innerHTML = passos + (r.casal && comum ? '<p class="lfk-table-note">Os rendimentos comuns e o património do casal foram repartidos em partes iguais.</p>' : '');
  }

  function montar() {
    var root = el('lf-csi');
    if (!root) return;
    root.className = 'lfk';
    root.innerHTML = html();
    var calcEl = root.querySelector('.lfk-calc');
    if (calcEl && root.closest('.w-richtext')) { calcEl.style.width = '100%'; calcEl.style.minWidth = '0'; }
    if (LFK.selects) LFK.selects(root);
    if (LFK.numInputs) LFK.numInputs(root);
    if (LFK.theme) LFK.theme(root);
    [].forEach.call(root.querySelectorAll('input[name="csi-agr"]'), function (x) { x.addEventListener('change', ajustarCampos); });
    ajustarCampos();
    LFK.calc(el('csi-calcular'), { results: '#csi-resultados', empty: '#csi-placeholder', run: calcular });
  }

  function iniciar() {
    if (window.LFK && LFK.calc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

/* Calculadora de IVA - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/).
   Taxas em vigor em 2026:
   - Continente: 23% normal, 13% intermedia, 6% reduzida (artigo 18.o do Codigo do IVA).
   - Madeira: 22%, 12% e 4% (reduzida de 4% desde 1 de outubro de 2024).
   - Acores: 16%, 9% e 4%.
   Fonte das taxas das regioes autonomas: Oficio-circulado n.o 25045/2024 da AT.
   Dois modos:
   - "Um valor": tres campos ligados (sem IVA, IVA, com IVA). Escreves num e os outros
     calculam-se enquanto escreves (excecao aprovada pelo Franklin a regra do botao Calcular).
   - "Fatura com varias taxas": linhas com valor e taxa; resultados so ao clicar em Calcular.
     O IVA e calculado sobre o total de cada taxa, como numa fatura.
   Contas em centimos inteiros, arredondamento ao centimo mais proximo (meio centimo para cima). */
(function () {
  'use strict';
  if (window.__lfIvInit) return;
  window.__lfIvInit = true;

  var TAXAS = {
    C: { nome: 'Portugal continental', n: 23, i: 13, r: 6 },
    M: { nome: 'Madeira', n: 22, i: 12, r: 4 },
    A: { nome: 'Açores', n: 16, i: 9, r: 4 }
  };
  var NOMES = { n: 'Taxa normal', i: 'Taxa intermédia', r: 'Taxa reduzida' };
  var CURTOS = { n: 'Normal', i: 'Intermédia', r: 'Reduzida' };
  var MAX_LINHAS = 20;

  function el(id) { return document.getElementById(id); }
  function radio(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function f(v) { return LFK.fmt(v); }
  function campo(v) { return LFK.fmt(v, { currency: false, decimals: 2 }); }
  function pct(v) { return LFK.fmt(v, { currency: false, decimals: 0 }) + '%'; }
  function mult(v) { return LFK.fmt(v, { currency: false, decimals: 2 }); }
  function regiaoNome() { var r = el('iv-regiao').value; return r === 'C' ? 'do continente' : r === 'M' ? 'da Madeira' : 'dos Açores'; }
  /* a / b arredondado ao inteiro mais proximo, meio para cima (a >= 0, b > 0) */
  function div(a, b) { return Math.floor((2 * a + b) / (2 * b)); }

  /* ---------- Motores (expostos para os testes de utilizadores simulados) ---------- */
  function contas(valor, taxa, modo) {
    var cents = Math.round(valor * 100);
    if (modo === 'rem') {
      var semC = div(cents * 100, 100 + taxa);
      return { sem: semC / 100, iva: (cents - semC) / 100, com: cents / 100 };
    }
    var ivaC = div(cents * taxa, 100);
    return { sem: cents / 100, iva: ivaC / 100, com: (cents + ivaC) / 100 };
  }
  /* campos ligados: origem 'sem' | 'iva' | 'com' */
  function ligado(origem, valor, taxa) {
    if (origem === 'com') return contas(valor, taxa, 'rem');
    if (origem === 'iva') {
      var ivaC = Math.round(valor * 100), semC = div(ivaC * 100, taxa);
      return { sem: semC / 100, iva: ivaC / 100, com: (semC + ivaC) / 100 };
    }
    return contas(valor, taxa, 'add');
  }
  /* fatura: linhas [{ valor, taxa }], base 'sem' (valores sem IVA) ou 'com' (valores com IVA) */
  function fatura(linhas, base) {
    var grupos = {}, ordem = [];
    linhas.forEach(function (l) {
      if (!(l.valor > 0)) return;
      if (grupos[l.taxa] === undefined) { grupos[l.taxa] = 0; ordem.push(l.taxa); }
      grupos[l.taxa] += Math.round(l.valor * 100);
    });
    ordem.sort(function (a, b) { return b - a; });
    var tSem = 0, tIva = 0, porTaxa = ordem.map(function (t) {
      var c = grupos[t], semC, ivaC;
      if (base === 'com') { semC = div(c * 100, 100 + t); ivaC = c - semC; }
      else { semC = c; ivaC = div(c * t, 100); }
      tSem += semC; tIva += ivaC;
      return { taxa: t, sem: semC / 100, iva: ivaC / 100, com: (semC + ivaC) / 100 };
    });
    return { porTaxa: porTaxa, sem: tSem / 100, iva: tIva / 100, com: (tSem + tIva) / 100 };
  }
  window.__lfIvContas = contas;
  window.__lfIvLigado = ligado;
  window.__lfIvFatura = fatura;
  window.__lfIvTaxas = TAXAS;

  /* ---------- HTML ---------- */
  function ajuda(t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; }
  function campoEuro(id, rotulo, ajudaTxt, valor) {
    return '<div class="lfk-field"><label class="lfk-label" for="' + id + '">' + rotulo + ajuda(ajudaTxt) + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="' + id + '" inputmode="decimal" autocomplete="off" value="' + valor + '"><span class="lfk-unit">€</span></div></div>';
  }
  function html() {
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Calculadora de IVA</div>' +
      '<form class="lfk-stack" id="iv-form" onsubmit="return false">' +
      '<div class="lfk-field"><span class="lfk-label">O que queres calcular?' + ajuda('Um valor: escreves o preço sem IVA, o IVA ou o preço com IVA e vês logo os outros dois. Fatura com várias taxas: juntas várias linhas, cada uma com a sua taxa, e vês o IVA de cada taxa e o total.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="iv-modo" value="simples" checked> <span>Um valor</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="iv-modo" value="fatura"> <span>Fatura com várias taxas</span></label>' +
      '</div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="iv-regiao">Região' + ajuda('O IVA é mais baixo nos Açores e na Madeira. Conta o local onde a venda ou o serviço é feito.') + '</label>' +
      '<select class="lfk-input" id="iv-regiao" name="regiao"><option value="C">Portugal continental</option><option value="M">Madeira</option><option value="A">Açores</option></select></div>' +

      /* modo um valor */
      '<div class="lfk-stack" id="iv-p-simples">' +
      '<div class="lfk-field"><span class="lfk-label">Taxa de IVA' + ajuda('A taxa normal aplica-se à maioria dos bens e serviços. A reduzida aplica-se, por exemplo, a muitos alimentos essenciais, livros e medicamentos. A intermédia aplica-se, por exemplo, às refeições em restaurantes.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="iv-taxa" value="n" checked> <span data-iv-tx="n">Normal (23%)</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="iv-taxa" value="i"> <span data-iv-tx="i">Intermédia (13%)</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="iv-taxa" value="r"> <span data-iv-tx="r">Reduzida (6%)</span></label>' +
      '</div></div>' +
      '<p class="lfk-hint" style="margin:0">Escreve no campo que sabes. Os outros dois calculam-se sozinhos.</p>' +
      campoEuro('iv-sem', 'Preço sem IVA', 'O valor antes do imposto, por exemplo o que aparece como base tributável numa fatura.', '100,00') +
      campoEuro('iv-iva', 'IVA', 'O valor do imposto, em euros.', '23,00') +
      campoEuro('iv-com', 'Preço com IVA', 'O preço final que se paga, já com o imposto.', '123,00') +
      '<p class="lfk-summary" id="iv-s-frase" style="margin:0"></p>' +
      '</div>' +

      /* modo fatura */
      '<div class="lfk-stack" id="iv-p-fatura" hidden>' +
      '<div class="lfk-field"><span class="lfk-label">Os valores das linhas são' + ajuda('Sem IVA: o valor de cada linha antes do imposto, como numa fatura. Com IVA: o preço final de cada linha, como num talão ou numa conta de restaurante.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="iv-base" value="sem" checked> <span>Sem IVA</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="iv-base" value="com"> <span>Com IVA</span></label>' +
      '</div></div>' +
      '<div class="lfk-stack" id="iv-linhas"></div>' +
      '<div><button type="button" class="lfk-btn is-secondary is-sm" id="iv-add">Adicionar linha</button></div>' +
      '<button type="button" class="lfk-btn is-block" id="iv-calcular">Calcular</button>' +
      '</div>' +
      '</form></div></div>' +

      '<div class="lfk-calc-results" id="iv-area">' +
      '<div id="iv-resultados" hidden>' +
      '<div class="lfk-card">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Resumo da fatura</h2></div>' +
      '<div class="lfk-table-wrap"><table class="lfk-table"><thead><tr><th>Taxa</th><th class="is-num">Sem IVA</th><th class="is-num">IVA</th></tr></thead><tbody id="iv-f-linhas"></tbody></table></div>' +
      '<div style="margin-top:1.5rem">' +
      '<div class="lfk-kv"><span>Total sem IVA</span><span id="iv-f-sem">0,00€</span></div>' +
      '<div class="lfk-kv"><span>IVA</span><span id="iv-f-iva">0,00€</span></div>' +
      '<div class="lfk-kv is-total"><span>Total com IVA</span><span id="iv-f-com">0,00€</span></div>' +
      '</div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="iv-f-frase"></p>' +
      '</div>' +
      '</div>' +
      '<div class="lfk-empty" id="iv-placeholder" hidden><p>Preenche as linhas e clica em <b>Calcular</b> para veres o IVA de cada taxa.</p></div>' +
      '</div>' +
      '</div>';
  }

  /* ---------- Modo um valor ---------- */
  var origem = 'sem';
  function tabela() { return TAXAS[el('iv-regiao').value] || TAXAS.C; }

  function atualizarLigados() {
    var tx = radio('iv-taxa') || 'n', taxa = tabela()[tx];
    var v = LFK.num(el('iv-' + origem).value);
    var outros = ['sem', 'iva', 'com'].filter(function (k) { return k !== origem; });
    if (!(v > 0)) {
      outros.forEach(function (k) { el('iv-' + k).value = ''; });
      el('iv-s-frase').textContent = '';
      return;
    }
    var r = ligado(origem, v, taxa);
    outros.forEach(function (k) { el('iv-' + k).value = campo(r[k]); });
    var m = mult(1 + taxa / 100), frase;
    if (origem === 'com') frase = 'Para tirar o IVA de ' + f(r.com) + ', divide por ' + m + ': o preço sem IVA é ' + f(r.sem) + ' e o IVA é ' + f(r.iva) + '. Tirar ' + pct(taxa) + ' ao preço dava um valor errado, porque o IVA é calculado sobre o preço sem imposto.';
    else if (origem === 'iva') frase = 'Um IVA de ' + f(r.iva) + ' à taxa de ' + pct(taxa) + ' corresponde a um preço sem IVA de ' + f(r.sem) + ' e a um preço com IVA de ' + f(r.com) + '.';
    else frase = 'Para acrescentar ' + pct(taxa) + ' de IVA a ' + f(r.sem) + ', multiplica por ' + m + ': o preço com IVA é ' + f(r.com) + ', dos quais ' + f(r.iva) + ' são IVA.';
    frase += ' ' + NOMES[tx] + ' ' + regiaoNome() + ' em 2026.';
    el('iv-s-frase').textContent = frase;
  }

  /* ---------- Modo fatura ---------- */
  var nLinha = 0;
  function opcoesTaxa(sel) {
    var t = tabela();
    ['n', 'i', 'r'].forEach(function (k, j) { sel.options[j].text = CURTOS[k] + ' (' + pct(t[k]) + ')'; });
  }
  function renumerar() {
    var linhas = el('iv-linhas').querySelectorAll('.iv-linha');
    Array.prototype.forEach.call(linhas, function (d, j) {
      d.querySelector('label').textContent = 'Linha ' + (j + 1);
      d.querySelector('[data-iv-rem]').style.visibility = linhas.length > 1 ? '' : 'hidden';
    });
    el('iv-add').style.display = linhas.length >= MAX_LINHAS ? 'none' : '';
  }
  function novaLinha(valor, tx) {
    var box = el('iv-linhas');
    if (box.querySelectorAll('.iv-linha').length >= MAX_LINHAS) return;
    nLinha++;
    var id = 'iv-l' + nLinha;
    var d = document.createElement('div');
    d.className = 'lfk-field iv-linha';
    d.innerHTML =
      '<div class="lfk-row is-between"><label class="lfk-label" for="' + id + '"></label>' +
      '<button type="button" class="lfk-btn is-ghost is-sm" data-iv-rem>Remover</button></div>' +
      '<div class="lfk-grid is-2">' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="' + id + '" inputmode="decimal" autocomplete="off" value="' + (valor || '') + '"><span class="lfk-unit">€</span></div>' +
      '<select class="lfk-input" aria-label="Taxa de IVA da linha"><option value="n">Normal</option><option value="i">Intermédia</option><option value="r">Reduzida</option></select>' +
      '</div>';
    box.appendChild(d);
    var sel = d.querySelector('select');
    sel.value = tx || 'n';
    opcoesTaxa(sel);
    if (LFK.select) LFK.select(sel);
    Array.prototype.forEach.call(d.querySelectorAll('.lfk-dd-list'), function (l) { l.setAttribute('data-lenis-prevent', ''); });
    if (LFK.numInputs) LFK.numInputs(d);
    d.querySelector('[data-iv-rem]').addEventListener('click', function () { d.remove(); renumerar(); });
    renumerar();
  }
  function calcularFatura() {
    var t = tabela(), base = radio('iv-base') === 'com' ? 'com' : 'sem', linhas = [];
    Array.prototype.forEach.call(el('iv-linhas').querySelectorAll('.iv-linha'), function (d) {
      linhas.push({ valor: LFK.num(d.querySelector('input').value), taxa: t[d.querySelector('select').value] });
    });
    var r = fatura(linhas, base);
    if (!r.porTaxa.length) return false;
    var nomeDe = function (taxa) { var k = ['n', 'i', 'r'].filter(function (x) { return t[x] === taxa; })[0]; return NOMES[k] + ' (' + pct(taxa) + ')'; };
    el('iv-f-linhas').innerHTML = r.porTaxa.map(function (g) {
      return '<tr><td>' + nomeDe(g.taxa) + '</td><td class="is-num">' + f(g.sem) + '</td><td class="is-num">' + f(g.iva) + '</td></tr>';
    }).join('');
    el('iv-f-sem').textContent = f(r.sem);
    el('iv-f-iva').textContent = f(r.iva);
    el('iv-f-com').textContent = f(r.com);
    el('iv-f-frase').textContent = 'A fatura tem ' + f(r.sem) + ' sem IVA e ' + f(r.iva) + ' de IVA, num total de ' + f(r.com) + '. ' +
      (base === 'com' ? 'O IVA de cada taxa sai da soma das linhas com essa taxa, dividida por 1 mais a taxa.' : 'O IVA de cada taxa é calculado sobre a soma das linhas com essa taxa, como numa fatura.') +
      ' Taxas de 2026 ' + regiaoNome() + '.';
  }

  /* ---------- Montagem ---------- */
  function mudarModo() {
    var fat = radio('iv-modo') === 'fatura';
    el('iv-p-simples').hidden = fat;
    el('iv-p-fatura').hidden = !fat;
    el('iv-resultados').hidden = true;
    el('iv-placeholder').hidden = !fat;
  }
  function mudarRegiao() {
    var t = tabela();
    Array.prototype.forEach.call(document.querySelectorAll('[data-iv-tx]'), function (s) {
      var k = s.getAttribute('data-iv-tx'); s.textContent = CURTOS[k] + ' (' + pct(t[k]) + ')';
    });
    Array.prototype.forEach.call(el('iv-linhas').querySelectorAll('select'), function (sel) {
      opcoesTaxa(sel); sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    atualizarLigados();
  }

  function montar() {
    var root = el('lf-iv');
    if (!root) return;
    root.className = 'lfk';
    root.innerHTML = html();
    if (LFK.selects) LFK.selects(root);
    Array.prototype.forEach.call(root.querySelectorAll('.lfk-dd-list'), function (l) { l.setAttribute('data-lenis-prevent', ''); });
    /* Banner da XTB (componente nativo, #iv-pub): na coluna dos resultados, antes do placeholder */
    var pub = el('iv-pub'), area = el('iv-area');
    if (pub && area) { pub.style.marginTop = '0'; area.insertBefore(pub, el('iv-placeholder')); }
    if (LFK.numInputs) LFK.numInputs(root);
    if (LFK.theme) LFK.theme(root);

    ['sem', 'iva', 'com'].forEach(function (k) {
      el('iv-' + k).addEventListener('input', function () { origem = k; atualizarLigados(); });
    });
    Array.prototype.forEach.call(root.querySelectorAll('input[name="iv-taxa"]'), function (r) { r.addEventListener('change', atualizarLigados); });
    Array.prototype.forEach.call(root.querySelectorAll('input[name="iv-modo"]'), function (r) { r.addEventListener('change', mudarModo); });
    el('iv-regiao').addEventListener('change', mudarRegiao);

    novaLinha('100,00', 'i');
    novaLinha('20,00', 'n');
    el('iv-add').addEventListener('click', function () { novaLinha('', 'n'); });

    mudarRegiao();
    mudarModo();
    LFK.calc(el('iv-calcular'), { results: '#iv-resultados', empty: '#iv-placeholder', run: calcularFatura });
  }

  function iniciar() {
    if (window.LFK && LFK.calc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

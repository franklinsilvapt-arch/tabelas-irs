/* Calculadora de IVA - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/).
   Taxas em vigor em 2026:
   - Continente: 23% normal, 13% intermedia, 6% reduzida (artigo 18.o do Codigo do IVA).
   - Madeira: 22%, 12% e 4% (reduzida de 4% desde 1 de outubro de 2024).
   - Acores: 16%, 9% e 4%.
   Fonte das taxas das regioes autonomas: Oficio-circulado n.o 25045/2024 da AT.
   Tres opcoes: acrescentar IVA, tirar IVA e fatura com varias taxas (linhas com valor e taxa;
   o IVA e calculado sobre o total de cada taxa, como numa fatura).
   Resultados so ao clicar em Calcular, como nas outras calculadoras do site.
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
  window.__lfIvFatura = fatura;
  window.__lfIvTaxas = TAXAS;

  /* ---------- HTML ---------- */
  function ajuda(t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; }
  function html() {
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Calculadora de IVA</div>' +
      '<form class="lfk-stack" id="iv-form" onsubmit="return false">' +
      '<div class="lfk-field"><span class="lfk-label">O que queres fazer?' + ajuda('Acrescentar IVA: tens o preço sem imposto e queres o preço final. Tirar IVA: tens o preço final e queres saber quanto é imposto. Fatura com várias taxas: juntas várias linhas, cada uma com a sua taxa.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="iv-modo" value="add" checked> <span>Acrescentar IVA</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="iv-modo" value="rem"> <span>Tirar IVA</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="iv-modo" value="fatura"> <span>Fatura com várias taxas</span></label>' +
      '</div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="iv-regiao">Região' + ajuda('O IVA é mais baixo nos Açores e na Madeira. Conta o local onde a venda ou o serviço é feito.') + '</label>' +
      '<select class="lfk-input" id="iv-regiao" name="regiao"><option value="C">Portugal continental</option><option value="M">Madeira</option><option value="A">Açores</option></select></div>' +

      /* acrescentar ou tirar IVA */
      '<div class="lfk-stack" id="iv-p-simples">' +
      '<div class="lfk-field"><span class="lfk-label">Taxa de IVA' + ajuda('A taxa normal aplica-se à maioria dos bens e serviços. A reduzida aplica-se, por exemplo, a muitos alimentos essenciais, livros e medicamentos. A intermédia aplica-se, por exemplo, às refeições em restaurantes.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="iv-taxa" value="n" checked> <span data-iv-tx="n">Normal (23%)</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="iv-taxa" value="i"> <span data-iv-tx="i">Intermédia (13%)</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="iv-taxa" value="r"> <span data-iv-tx="r">Reduzida (6%)</span></label>' +
      '</div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="iv-valor"><span id="iv-valor-l">Preço sem IVA</span>' + ajuda('O preço ou o montante da fatura, em euros.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="iv-valor" inputmode="decimal" autocomplete="off" value="100"><span class="lfk-unit">€</span></div></div>' +
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
      '</div>' +
      '<button type="button" class="lfk-btn is-block" id="iv-calcular">Calcular</button>' +
      '</form></div></div>' +

      '<div class="lfk-calc-results" id="iv-area">' +
      '<div id="iv-resultados" hidden>' +
      '<div id="iv-r-simples">' +
      '<div class="lfk-card">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm">Resultados</h2></div>' +
      '<div class="lfk-kv is-total"><span id="iv-r-titulo">Preço com IVA</span><span id="iv-r-total">0,00€</span></div>' +
      '<div class="lfk-kv" id="iv-r-sem-l"><span>Preço sem IVA</span><span id="iv-r-sem">0,00€</span></div>' +
      '<div class="lfk-kv"><span id="iv-r-iva-l">IVA (23%)</span><span id="iv-r-iva">0,00€</span></div>' +
      '<div class="lfk-kv" id="iv-r-com-l"><span>Preço com IVA</span><span id="iv-r-com">0,00€</span></div>' +
      '<p class="lfk-summary" style="margin-top:1.5rem" id="iv-r-frase"></p>' +
      '</div>' +
      '<div class="lfk-card" style="margin-top:1.5rem">' +
      '<div class="lfk-card-head"><h2 class="lfk-h-sm" id="iv-o-titulo">O mesmo valor com as outras taxas</h2></div>' +
      '<div id="iv-outras"></div>' +
      '</div>' +
      '</div>' +
      '<div class="lfk-card" id="iv-r-fatura">' +
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
      '<div class="lfk-empty" id="iv-placeholder"><p>Preenche os dados e clica em <b>Calcular</b> para veres os resultados.</p></div>' +
      '</div>' +
      '</div>';
  }

  /* ---------- Acrescentar ou tirar IVA ---------- */
  function tabela() { return TAXAS[el('iv-regiao').value] || TAXAS.C; }

  function calcularSimples(modo) {
    var valor = LFK.num(el('iv-valor').value);
    if (!(valor > 0)) return false;
    var tx = radio('iv-taxa') || 'n', tab = tabela(), taxa = tab[tx];
    var r = contas(valor, taxa, modo);
    el('iv-r-titulo').textContent = modo === 'rem' ? 'Preço sem IVA' : 'Preço com IVA';
    el('iv-r-total').textContent = f(modo === 'rem' ? r.sem : r.com);
    el('iv-r-sem').textContent = f(r.sem);
    el('iv-r-iva-l').textContent = 'IVA (' + pct(taxa) + ')';
    el('iv-r-iva').textContent = f(r.iva);
    el('iv-r-com').textContent = f(r.com);
    /* a linha igual ao resultado principal nao se repete */
    el('iv-r-sem-l').style.display = modo === 'rem' ? 'none' : '';
    el('iv-r-com-l').style.display = modo === 'rem' ? '' : 'none';
    var m = mult(1 + taxa / 100), frase;
    if (modo === 'rem') {
      frase = 'Para tirar o IVA de ' + f(r.com) + ', divide por ' + m + ': o preço sem IVA é ' + f(r.sem) + ' e o IVA é ' + f(r.iva) + '.';
      var erradoC = Math.round(r.com * 100) - div(Math.round(r.com * 100) * taxa, 100);
      if (erradoC !== Math.round(r.sem * 100)) frase += ' Tirar ' + pct(taxa) + ' ao preço dava ' + f(erradoC / 100) + ', um valor errado, porque o IVA é calculado sobre o preço sem imposto.';
    } else {
      frase = 'Para acrescentar ' + pct(taxa) + ' de IVA a ' + f(r.sem) + ', multiplica por ' + m + ': o preço com IVA é ' + f(r.com) + ', dos quais ' + f(r.iva) + ' são IVA.';
    }
    frase += ' ' + NOMES[tx] + ' ' + regiaoNome() + ' em 2026.';
    el('iv-r-frase').textContent = frase;
    var linhas = '';
    ['n', 'i', 'r'].forEach(function (k) {
      if (k === tx) return;
      var o = contas(valor, tab[k], modo);
      linhas += '<div class="lfk-kv"><span>' + NOMES[k] + ' (' + pct(tab[k]) + ')</span><span>' + f(modo === 'rem' ? o.sem : o.com) + '</span></div>';
    });
    el('iv-o-titulo').textContent = modo === 'rem' ? 'Preço sem IVA com as outras taxas' : 'Preço com IVA com as outras taxas';
    el('iv-outras').innerHTML = linhas;
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
    var modo = radio('iv-modo'), fat = modo === 'fatura';
    el('iv-p-simples').hidden = fat;
    el('iv-p-fatura').hidden = !fat;
    el('iv-valor-l').textContent = modo === 'rem' ? 'Preço com IVA' : 'Preço sem IVA';
    /* mudar de opcao nao calcula: volta ao cartao "clica em Calcular" */
    el('iv-resultados').hidden = true;
    el('iv-placeholder').hidden = false;
  }
  function calcular() {
    var modo = radio('iv-modo');
    var ok = modo === 'fatura' ? calcularFatura() : calcularSimples(modo === 'rem' ? 'rem' : 'add');
    if (ok === false) return false;
    el('iv-r-simples').hidden = modo === 'fatura';
    el('iv-r-fatura').hidden = modo !== 'fatura';
  }
  function mudarRegiao() {
    var t = tabela();
    Array.prototype.forEach.call(document.querySelectorAll('[data-iv-tx]'), function (s) {
      var k = s.getAttribute('data-iv-tx'); s.textContent = CURTOS[k] + ' (' + pct(t[k]) + ')';
    });
    Array.prototype.forEach.call(el('iv-linhas').querySelectorAll('select'), function (sel) {
      opcoesTaxa(sel); sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
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

    Array.prototype.forEach.call(root.querySelectorAll('input[name="iv-modo"]'), function (r) { r.addEventListener('change', mudarModo); });
    el('iv-regiao').addEventListener('change', mudarRegiao);

    novaLinha('100,00', 'i');
    novaLinha('20,00', 'n');
    el('iv-add').addEventListener('click', function () { novaLinha('', 'n'); });

    mudarRegiao();
    mudarModo();
    LFK.calc(el('iv-calcular'), { results: '#iv-resultados', empty: '#iv-placeholder', run: calcular });
  }

  function iniciar() {
    if (window.LFK && LFK.calc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

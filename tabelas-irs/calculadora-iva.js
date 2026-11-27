/* Calculadora de IVA - literaciafinanceira.pt
   Usa o LF kit (pedrofintech/lf-site-assets, kit/).
   Taxas em vigor em 2026:
   - Continente: 23% normal, 13% intermedia, 6% reduzida (artigo 18.o do Codigo do IVA).
   - Madeira: 22%, 12% e 4% (reduzida de 4% desde 1 de outubro de 2024).
   - Acores: 16%, 9% e 4%.
   Fonte das taxas das regioes autonomas: Oficio-circulado n.o 25045/2024 da AT.
   Contas:
   - Acrescentar IVA: IVA = valor x taxa; preco final = valor + IVA.
   - Tirar IVA: valor sem IVA = preco / (1 + taxa); IVA = preco - valor sem IVA.
   Arredonda ao centimo no fim de cada passo, como numa fatura. */
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

  function el(id) { return document.getElementById(id); }
  function radio(name) { var r = document.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }
  function f(v) { return LFK.fmt(v); }
  function pct(v) { return LFK.fmt(v, { currency: false, decimals: 0 }) + '%'; }
  function mult(v) { return LFK.fmt(v, { currency: false, decimals: 2 }); }
  function c(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }

  /* Motor (exposto para os testes de utilizadores simulados) */
  /* Contas em centimos inteiros, com arredondamento ao centimo mais proximo (meio centimo para cima),
     para evitar erros de virgula flutuante. Taxas em percentagem inteira. */
  function contas(valor, taxa, modo) {
    var cents = Math.round(valor * 100);
    if (modo === 'rem') {
      var semC = Math.floor((cents * 200 + (100 + taxa)) / (2 * (100 + taxa)));
      return { sem: semC / 100, iva: (cents - semC) / 100, com: cents / 100 };
    }
    var ivaC = Math.floor((cents * taxa * 2 + 100) / 200);
    return { sem: cents / 100, iva: ivaC / 100, com: (cents + ivaC) / 100 };
  }
  window.__lfIvContas = contas;
  window.__lfIvTaxas = TAXAS;

  function html() {
    var ajuda = function (t) { return '<span class="lfk-help-wrap"><span class="lfk-help" tabindex="0" aria-label="Ajuda"></span><span class="lfk-help-box">' + t + '</span></span>'; };
    return '' +
      '<div class="lfk-calc">' +
      '<div class="lfk-calc-form"><div class="lfk-calc-inner">' +
      '<div class="lfk-calc-title">Calculadora de IVA</div>' +
      '<form class="lfk-stack" id="iv-form" onsubmit="return false">' +
      '<div class="lfk-field"><span class="lfk-label">O que queres fazer?' + ajuda('Acrescentar IVA: tens o preço sem imposto e queres o preço final. Tirar IVA: tens o preço final e queres saber quanto é imposto.') + '</span>' +
      '<div class="lfk-radios">' +
      '<label class="lfk-radio"><input type="radio" name="iv-modo" value="add" checked> <span>Acrescentar IVA</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="iv-modo" value="rem"> <span>Tirar IVA</span></label>' +
      '</div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="iv-valor"><span id="iv-valor-l">Preço sem IVA</span>' + ajuda('O preço ou o montante da fatura, em euros.') + '</label>' +
      '<div class="lfk-input-wrap"><input class="lfk-input lfk-num" id="iv-valor" name="valor" inputmode="decimal" value="100"><span class="lfk-unit">€</span></div></div>' +
      '<div class="lfk-field"><label class="lfk-label" for="iv-regiao">Região' + ajuda('O IVA é mais baixo nos Açores e na Madeira. Conta o local onde a venda ou o serviço é feito.') + '</label>' +
      '<select class="lfk-input" id="iv-regiao" name="regiao"><option value="C">Portugal continental</option><option value="M">Madeira</option><option value="A">Açores</option></select></div>' +
      '<div class="lfk-field"><span class="lfk-label">Taxa de IVA' + ajuda('A taxa normal aplica-se à maioria dos bens e serviços. A reduzida aplica-se, por exemplo, a muitos alimentos essenciais, livros e medicamentos. A intermédia aplica-se, por exemplo, às refeições em restaurantes.') + '</span>' +
      '<div class="lfk-radios" id="iv-taxas">' +
      '<label class="lfk-radio"><input type="radio" name="iv-taxa" value="n" checked> <span id="iv-t-n">Normal (23%)</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="iv-taxa" value="i"> <span id="iv-t-i">Intermédia (13%)</span></label>' +
      '<label class="lfk-radio"><input type="radio" name="iv-taxa" value="r"> <span id="iv-t-r">Reduzida (6%)</span></label>' +
      '</div></div>' +
      '<button type="button" class="lfk-btn is-block" id="iv-calcular">Calcular</button>' +
      '</form></div></div>' +
      '<div class="lfk-calc-results" id="iv-area">' +
      '<div id="iv-resultados" hidden>' +
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
      '<div class="lfk-empty" id="iv-placeholder"><p>Preenche os dados e clica em <b>Calcular</b> para veres os resultados.</p></div>' +
      '</div>' +
      '</div>';
  }

  function atualizarTaxas() {
    var t = TAXAS[el('iv-regiao').value] || TAXAS.C;
    el('iv-t-n').textContent = 'Normal (' + pct(t.n) + ')';
    el('iv-t-i').textContent = 'Intermédia (' + pct(t.i) + ')';
    el('iv-t-r').textContent = 'Reduzida (' + pct(t.r) + ')';
  }

  function calcular() {
    var valor = LFK.num(el('iv-valor').value);
    if (!(valor > 0)) return false;
    var modo = radio('iv-modo') === 'rem' ? 'rem' : 'add';
    var reg = el('iv-regiao').value, tx = radio('iv-taxa') || 'n';
    var tabela = TAXAS[reg] || TAXAS.C, taxa = tabela[tx];
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
      frase = 'Para tirar o IVA de ' + f(r.com) + ', divide por ' + m + ': o valor sem IVA é ' + f(r.sem) + ' e o IVA é ' + f(r.iva) + '.';
      var errado = c(valor * (1 - taxa / 100));
      if (Math.abs(errado - r.sem) >= 0.01) frase += ' Tirar ' + pct(taxa) + ' ao preço dava ' + f(errado) + ', um valor errado, porque o IVA é calculado sobre o preço sem imposto.';
    } else {
      frase = 'Para acrescentar ' + pct(taxa) + ' de IVA a ' + f(r.sem) + ', multiplica por ' + m + ': o preço final é ' + f(r.com) + ', dos quais ' + f(r.iva) + ' são IVA.';
    }
    frase += ' ' + NOMES[tx] + ' ' + (reg === 'C' ? 'do continente' : reg === 'M' ? 'da Madeira' : 'dos Açores') + ' em 2026.';
    el('iv-r-frase').textContent = frase;

    var linhas = '';
    ['n', 'i', 'r'].forEach(function (k) {
      if (k === tx) return;
      var o = contas(valor, tabela[k], modo);
      linhas += '<div class="lfk-kv"><span>' + NOMES[k] + ' (' + pct(tabela[k]) + ')</span><span>' + f(modo === 'rem' ? o.sem : o.com) + '</span></div>';
    });
    el('iv-o-titulo').textContent = modo === 'rem' ? 'Preço sem IVA com as outras taxas' : 'Preço com IVA com as outras taxas';
    el('iv-outras').innerHTML = linhas;
  }

  function montar() {
    var root = el('lf-iv');
    if (!root) return;
    root.className = 'lfk';
    root.innerHTML = html();
    if (LFK.selects) LFK.selects(root);
    /* O site usa o Lenis (scroll suave): data-lenis-prevent devolve o scroll nativo a cada lista */
    Array.prototype.forEach.call(root.querySelectorAll('.lfk-dd-list'), function (l) { l.setAttribute('data-lenis-prevent', ''); });
    /* Banner da XTB (componente nativo, #iv-pub): entre o formulario e o placeholder, depois a seguir aos resultados */
    var pub = el('iv-pub'), area = el('iv-area');
    if (pub && area) { pub.style.marginTop = '0'; area.insertBefore(pub, el('iv-placeholder')); }
    if (LFK.numInputs) LFK.numInputs(root);
    if (LFK.theme) LFK.theme(root);
    el('iv-regiao').addEventListener('change', atualizarTaxas);
    /* so muda o nome do campo; os resultados continuam a aparecer apenas ao clicar em Calcular */
    Array.prototype.forEach.call(root.querySelectorAll('input[name="iv-modo"]'), function (r) {
      r.addEventListener('change', function () { el('iv-valor-l').textContent = radio('iv-modo') === 'rem' ? 'Preço com IVA' : 'Preço sem IVA'; });
    });
    atualizarTaxas();
    LFK.calc(el('iv-calcular'), { results: '#iv-resultados', empty: '#iv-placeholder', run: calcular });
  }

  function iniciar() {
    if (window.LFK && LFK.calc) montar();
    else setTimeout(iniciar, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();

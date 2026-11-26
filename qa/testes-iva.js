/* Testes de utilizadores simulados da calculadora de IVA: corre na consola de uma pagina do staging.
   Abre /calculadora-iva num iframe, preenche valor, modo, regiao e taxa, clica em Calcular e compara
   os resultados com um calculo independente em BigInt (arredondamento ao centimo, meio centimo para cima).
   Uso: await testesIva(500) */
async function testesIva(N) {
  var TAXAS = { C: { n: 23, i: 13, r: 6 }, M: { n: 22, i: 12, r: 4 }, A: { n: 16, i: 9, r: 4 } };
  var VALORES = [0.01, 0.05, 1, 9.99, 10, 49.5, 100, 123, 250.75, 999.99, 1000, 1234.56, 15000, 99999.99, 1000000];
  var rnd = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var eur = function (t) { return Math.round(parseFloat(String(t).replace(/[^\d,\-]/g, '').replace(',', '.')) * 100); };
  var ptNum = function (v) { var p = v.toFixed(2).split('.'); return p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + p[1]; };

  /* referencia independente: fracao exata em BigInt */
  function arred(num, den) { return (num * 2n + den) / (den * 2n); } /* num/den >= 0, meio para cima */
  function ref(cents, taxa, modo) {
    var C = BigInt(cents), T = BigInt(taxa);
    if (modo === 'rem') { var sem = arred(C * 100n, 100n + T); return { sem: Number(sem), iva: Number(C - sem), com: cents }; }
    var iva = arred(C * T, 100n);
    return { sem: cents, iva: Number(iva), com: cents + Number(iva) };
  }

  var f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;left:0;top:0;width:1280px;height:900px;opacity:0;pointer-events:none';
  f.src = '/calculadora-iva?t=' + Date.now();
  document.body.appendChild(f);
  await new Promise(function (r) { f.onload = r; });
  await new Promise(function (r) { setTimeout(r, 3500); });
  var d = f.contentDocument, erros = [], textos = [], n = 0;

  for (var i = 0; i < N; i++) {
    var v = Math.random() < 0.4 ? rnd(VALORES) : Math.round(Math.random() * 5000000) / 100 + 0.01;
    var modo = rnd(['add', 'rem']), reg = rnd(['C', 'M', 'A']), tx = rnd(['n', 'i', 'r']);
    var e = d.getElementById('iv-valor'); e.value = ptNum(v); e.dispatchEvent(new Event('input', { bubbles: true }));
    var m = d.querySelector('input[name="iv-modo"][value="' + modo + '"]'); m.checked = true; m.dispatchEvent(new Event('change', { bubbles: true }));
    var s = d.getElementById('iv-regiao'); s.value = reg; s.dispatchEvent(new Event('change', { bubbles: true }));
    var t = d.querySelector('input[name="iv-taxa"][value="' + tx + '"]'); t.checked = true; t.dispatchEvent(new Event('change', { bubbles: true }));
    d.getElementById('iv-calcular').click();
    await new Promise(function (r) { setTimeout(r, 40); });
    n++;
    var cents = Math.round(v * 100), esperado = ref(cents, TAXAS[reg][tx], modo);
    var got = { sem: eur(d.getElementById('iv-r-sem').textContent), iva: eur(d.getElementById('iv-r-iva').textContent), com: eur(d.getElementById('iv-r-com').textContent) };
    var total = eur(d.getElementById('iv-r-total').textContent);
    if (got.sem !== esperado.sem || got.iva !== esperado.iva || got.com !== esperado.com || total !== (modo === 'rem' ? esperado.sem : esperado.com)) {
      erros.push({ valor: v, modo: modo, regiao: reg, taxa: TAXAS[reg][tx], esperado: esperado, obtido: got, total: total });
    }
    var todo = d.getElementById('iv-resultados').textContent;
    if (/NaN|undefined|null/.test(todo)) textos.push({ valor: v, modo: modo, regiao: reg, taxa: tx });
    var rot = d.getElementById('iv-t-' + tx).textContent;
    if (rot.indexOf(String(TAXAS[reg][tx]) + '%') < 0) textos.push({ rotulo: rot, regiao: reg, taxa: tx });
  }
  f.remove();
  var res = { testes: n, nErros: erros.length, erros: erros.slice(0, 5), textosPartidos: textos.slice(0, 5) };
  console.log(res);
  return res;
}

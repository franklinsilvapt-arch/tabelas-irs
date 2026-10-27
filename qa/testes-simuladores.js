/* Testes de utilizadores simulados: corre na pagina de staging (consola), abre cada simulador num iframe,
   preenche os campos, clica em Calcular e compara o resultado com um calculo independente das regras. */
async function correrTestes(N) {
  var c = function (v) { return Math.round(v * 100) / 100; };
  var eur = function (t) { return parseFloat(String(t).replace(/[^\d,\-]/g, '').replace(',', '.')); };
  var rnd = function (a) { return a[Math.floor(Math.random() * a.length)]; };
  var ri = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  var REG = ['C', 'A', 'M'], SIT = ['nc', 'c2', 'c1'];
  var SAL = [450, 700, 870, 920, 921, 1000, 1200, 1500, 1850, 2300, 3000, 4500, 7000, 12000, 25000];
  var out = {};

  async function abrir(p) {
    var f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:0;top:0;width:1280px;height:900px;opacity:0;pointer-events:none';
    f.src = '/' + p + '?t=' + Date.now();
    document.body.appendChild(f);
    await new Promise(function (r) { f.onload = r; });
    await new Promise(function (r) { setTimeout(r, 3500); });
    return f;
  }
  function setNum(d, id, v) { var e = d.getElementById(id); e.value = String(v).replace('.', ','); e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }
  function setSel(d, id, v) { var e = d.getElementById(id); e.value = String(v); e.dispatchEvent(new Event('change', { bubbles: true })); }
  function setRad(d, name, v) { var e = d.querySelector('input[name="' + name + '"][value="' + v + '"]'); e.checked = true; e.dispatchEvent(new Event('change', { bubbles: true })); }
  function setChk(d, id, v) { var e = d.getElementById(id); e.checked = !!v; e.dispatchEvent(new Event('change', { bubbles: true })); }
  async function calcular(d, id) { d.getElementById(id).click(); await new Promise(function (r) { setTimeout(r, 60); }); }
  function txt(d, id) { return d.getElementById(id).textContent; }

  /* ---------- Subsidio de desemprego ---------- */
  var f = await abrir('simulador-subsidio-de-desemprego'), d = f.contentDocument, w = f.contentWindow, erros = [], n = 0;
  var IAS = 537.13, RMMG = 920;
  var QD = { 0: [150, 210, 330, 30], 30: [180, 330, 420, 30], 40: [210, 360, 540, 45], 50: [270, 480, 540, 60] };
  for (var i = 0; i < N; i++) {
    var o = { sal: rnd(SAL), subs: ri(0, 2), idade: ri(18, 66), meses: ri(0, 3), anos: ri(0, 4), reg: rnd(REG), sit: rnd(SIT), dep: ri(0, 4), def: Math.random() < 0.2, maj: Math.random() < 0.3 };
    setNum(d, 'sd-salario', o.sal); setRad(d, 'subs', o.subs); setNum(d, 'sd-idade', o.idade); setSel(d, 'sd-meses', o.meses); setSel(d, 'sd-anos', o.anos);
    setSel(d, 'sd-regiao', o.reg); setSel(d, 'sd-sit', o.sit); setSel(d, 'sd-dep', o.dep); setChk(d, 'sd-def', o.def); setChk(d, 'sd-maj', o.maj);
    await calcular(d, 'sd-calcular'); n++;
    /* calculo independente */
    var ref = c(o.sal * (12 + o.subs) / 12), base = c(ref * 0.65);
    var irs = c(w.__lfIrsCalc(ref, 'A', o.sit, o.dep, o.def, o.reg).ret.valor);
    var liq = c(ref - c(ref * 0.11) - irs);
    var v = Math.min(base, c(2.5 * IAS), c(0.75 * liq));
    var minimo = o.sal >= RMMG ? c(1.15 * IAS) : IAS;
    v = c(Math.max(v, Math.min(minimo, liq)));
    var fim = o.maj ? c(v * 1.1) : v;
    var faixa = o.idade >= 50 ? 50 : o.idade >= 40 ? 40 : o.idade >= 30 ? 30 : 0;
    var esc = o.meses === 3 ? 2 : o.meses === 2 ? 1 : 0;
    var dias = QD[faixa][esc] + QD[faixa][3] * o.anos;
    var got = eur(txt(d, 'sd-r-valor')), gd = parseInt(txt(d, 'sd-r-dur'), 10), gt = eur(txt(d, 'sd-r-total'));
    if (o.meses === 0) { if (got !== 0 || txt(d, 'sd-r-dur') !== 'Sem direito') erros.push(['elegivel', o, got]); continue; }
    if (Math.abs(got - fim) > 0.011 || gd !== dias || Math.abs(gt - c(fim * dias / 30)) > 0.011) erros.push([o, { esperado: fim, dias: dias }, { obtido: got, dias: gd, total: gt }]);
  }
  out.desemprego = { testes: n, erros: erros.slice(0, 5), nErros: erros.length };
  f.remove();

  /* ---------- Subsidio de ferias ---------- */
  f = await abrir('simulador-subsidio-de-ferias'); d = f.contentDocument; w = f.contentWindow; erros = []; n = 0;
  for (i = 0; i < N; i++) {
    o = { sal: rnd(SAL), outras: rnd([0, 0, 50, 180]), sitAno: ri(0, 2), meses: ri(1, 12), reg: rnd(REG), sit: rnd(SIT), dep: ri(0, 4), def: Math.random() < 0.2, duo: rnd(['0', '0.5', '1']) };
    setNum(d, 'sf-salario', o.sal); setNum(d, 'sf-outras', o.outras); setRad(d, 'sit-ano', o.sitAno); setSel(d, 'sf-meses', o.meses);
    setSel(d, 'sf-regiao', o.reg); setSel(d, 'sf-sit', o.sit); setSel(d, 'sf-dep', o.dep); setChk(d, 'sf-def', o.def); setRad(d, 'duo', o.duo);
    await calcular(d, 'sf-calcular'); n++;
    var b = o.sal + o.outras;
    var bruto = o.sitAno === 1 ? c(b * Math.min(2 * o.meses, 20) / 22) : o.sitAno === 2 ? c(b * o.meses / 12) : c(b);
    var ef = w.__lfIrsCalc(bruto, 'A', o.sit, o.dep, o.def, o.reg).ret.valor / bruto;
    var p = parseFloat(o.duo), parte = c(bruto * (1 - p)), duoMes = c(bruto * p / 12);
    var esperado = p === 1 ? c(duoMes - c(duoMes * ef) - c(duoMes * 0.11)) : c(parte - c(parte * ef) - c(parte * 0.11));
    var brutoEsp = p === 1 ? bruto : parte;
    got = eur(txt(d, 'sf-r-liquido')); var gb = eur(txt(d, 'sf-r-bruto'));
    if (Math.abs(got - esperado) > 0.011 || Math.abs(gb - brutoEsp) > 0.011) erros.push([o, { liquido: esperado, bruto: brutoEsp }, { liquido: got, bruto: gb }]);
  }
  out.ferias = { testes: n, erros: erros.slice(0, 5), nErros: erros.length };
  f.remove();

  /* ---------- Subsidio de Natal ---------- */
  f = await abrir('simulador-subsidio-de-natal'); d = f.contentDocument; w = f.contentWindow; erros = []; n = 0;
  var novAtivo = new Date() < new Date(2026, 11, 1);
  for (i = 0; i < N; i++) {
    o = { sal: rnd(SAL), meses: ri(1, 12), reg: rnd(REG), sit: rnd(SIT), dep: ri(0, 4), def: Math.random() < 0.2, duo: rnd(['0', '0.5', '1']), mes: rnd(['11', '12']) };
    setNum(d, 'sn-salario', o.sal); setSel(d, 'sn-meses', o.meses); setSel(d, 'sn-regiao', o.reg); setSel(d, 'sn-sit', o.sit); setSel(d, 'sn-dep', o.dep);
    setChk(d, 'sn-def', o.def); setRad(d, 'duo', o.duo); setRad(d, 'mes', o.mes);
    await calcular(d, 'sn-calcular'); n++;
    bruto = c(o.sal * o.meses / 12);
    var x = w.__lfIrsCalc(bruto, 'A', o.sit, o.dep, o.def, o.reg).ret;
    ef = x.valor / bruto;
    var t = w.__lfIrsTabelas[o.reg].filter(function (q) { return q.k === x.k; })[0];
    var lim = t.r[t.r.length - 2][0];
    var metade = novAtivo && (o.reg === 'C' || o.reg === 'A') && o.sal <= lim && o.mes === '11';
    p = parseFloat(o.duo); parte = c(bruto * (1 - p)); duoMes = c(bruto * p / 12);
    var irsN = c(parte * ef), irsF = metade ? c(irsN / 2) : irsN;
    esperado = p === 1 ? c(duoMes - c(duoMes * ef) - c(duoMes * 0.11)) : c(parte - irsF - c(parte * 0.11));
    got = eur(txt(d, 'sn-r-liquido'));
    if (Math.abs(got - esperado) > 0.011) erros.push([o, esperado, got]);
  }
  out.natal = { testes: n, erros: erros.slice(0, 5), nErros: erros.length };
  f.remove();

  /* ---------- Baixa medica ---------- */
  f = await abrir('simulador-baixa-medica'); d = f.contentDocument; w = f.contentWindow; erros = []; n = 0;
  var FX = [[1, 30, 0.55], [31, 90, 0.60], [91, 365, 0.70], [366, 1095, 0.75]];
  for (i = 0; i < N; i++) {
    o = { sal: rnd(SAL.concat([300, 480, 500, 501])), dias: rnd([1, 2, 3, 4, 7, 15, 30, 31, 45, 90, 91, 120, 200, 365, 366, 500, 1095, 1500]), intern: Math.random() < 0.25, maj: Math.random() < 0.25, reg: rnd(REG), sit: rnd(SIT), dep: ri(0, 4), def: Math.random() < 0.2 };
    setNum(d, 'bm-salario', o.sal); setNum(d, 'bm-dias', o.dias); setChk(d, 'bm-intern', o.intern); setChk(d, 'bm-maj', o.maj);
    setSel(d, 'bm-regiao', o.reg); setSel(d, 'bm-sit', o.sit); setSel(d, 'bm-dep', o.dep); setChk(d, 'bm-def', o.def);
    await calcular(d, 'bm-calcular'); n++;
    var dd = Math.min(1095, o.dias), rr = c(o.sal / 30);
    var liqDia = c(c(o.sal - o.sal * 0.11 - w.__lfIrsCalc(o.sal, 'A', o.sit, o.dep, o.def, o.reg).ret.valor) / 30);
    var maj = o.sal <= 500 || o.maj, espera = o.intern ? 0 : 3, total = 0, pagos = 0;
    for (var dia = espera + 1; dia <= dd; dia++) {
      var fx = FX.filter(function (z) { return dia >= z[0] && dia <= z[1]; })[0];
      var taxa = fx[2] + (maj && fx[1] <= 90 ? 0.05 : 0);
      var vd = rr * taxa; if (vd > liqDia) vd = liqDia; var mn = Math.min(9.2, rr); if (vd < mn) vd = mn;
      total += c(vd); pagos++;
    }
    total = c(total);
    got = eur(txt(d, 'bm-r-total')); var gp = parseInt(txt(d, 'bm-r-dias'), 10);
    if (Math.abs(got - total) > 0.011 || gp !== pagos) erros.push([o, { total: total, pagos: pagos }, { total: got, pagos: gp }]);
  }
  out.baixa = { testes: n, erros: erros.slice(0, 5), nErros: erros.length };
  f.remove();
  return out;
}

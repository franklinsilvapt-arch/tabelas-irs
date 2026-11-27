/* petroleo.js - /preco-do-petroleo (dados, topo, calculadora e gráfico). Servido pelo GitHub Pages do repo tabelas-irs. */
/* ------------------------------------------------------------
   PREÇO DO PETRÓLEO (/preco-do-petroleo)
   Os dados vêm de petroleo-dados.json, que a Action "Atualizar preço do petróleo" do repo
   tabelas-irs grava a cada 15 minutos no ramo dados-petroleo: Brent (BZ=F) e WTI (CL=F),
   contratos futuros mais próximos, câmbio EUR/USD e fechos diários de um ano.
   O HTML do topo, da calculadora e das perguntas com preço vem do CMS (item "Petróleo (hoje)",
   atualizado de hora a hora pela mesma Action), e este script põe-lhe os valores mais recentes.
   Cópia deste script: tabelas-irs/petroleo/petroleo-pagina.js.html (frases iguais a petroleo-render.mjs).
   O FAQPage em JSON-LD fica a cargo do script geral faq-schema.js.
   ------------------------------------------------------------ */
var LF_PET = {
  urlDados: 'https://raw.githubusercontent.com/franklinsilvapt-arch/tabelas-irs/dados-petroleo/petroleo-dados.json'
};

(function () {
  var LITROS = 158.987294928;
  var MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var D = null;

  function fmtNum(v, dec) {
    var p = v.toFixed(dec).split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return dec > 0 ? p[0] + ',' + p[1] : p[0];
  }
  function fmtEuro(v, dec) { return fmtNum(v, dec == null ? 2 : dec) + '€'; }
  function fmtUsd(v, dec) { return fmtNum(v, dec == null ? 2 : dec) + ' USD'; }
  function fmtPct(v) { return (v >= 0 ? '+' : '-') + Math.abs(v * 100).toFixed(1).replace('.', ',') + '%'; }
  function dataPT(iso) { var p = iso.split('-'); return parseInt(p[2], 10) + ' de ' + MESES[parseInt(p[1], 10) - 1] + ' de ' + p[0]; }
  function lisboa(isoInstante, opc) { return new Intl.DateTimeFormat(opc.hour ? 'pt-PT' : 'en-CA', Object.assign({ timeZone: 'Europe/Lisbon' }, opc)).format(new Date(isoInstante)); }
  function dataLisboa(i) { return lisboa(i, { year: 'numeric', month: '2-digit', day: '2-digit' }); }
  function horaLisboa(i) { return lisboa(i, { hour: '2-digit', minute: '2-digit', hour12: false }); }
  function classeVar(v) { return v >= 0.0005 ? 'is-up' : (v <= -0.0005 ? 'is-down' : 'is-flat'); }

  function variacaoPeriodo(preco, dataIso, hist, dias) {
    if (!hist || !hist.length) return null;
    var alvo = new Date(dataIso + 'T00:00:00Z').getTime() - dias * 86400000;
    for (var i = hist.length - 1; i >= 0; i--) {
      var h = hist[i];
      if (!h || !(h.brent > 0)) continue;
      var t = new Date(h.d + 'T00:00:00Z').getTime();
      if (t > alvo) continue;
      return alvo - t <= 7 * 86400000 ? preco / h.brent - 1 : null;
    }
    return null;
  }

  function calcD(j) {
    var s = j.spot;
    var d = {
      brent: s.brentUsd, wti: s.wtiUsd || null, usdEur: s.usdEur,
      prevBrent: s.prevBrent, prevWti: s.prevWti, mercadoEm: s.mercadoEm, atualizadoEm: s.atualizadoEm,
      hist: Array.isArray(j.hist) ? j.hist.filter(function (h) { return h && typeof h.d === 'string' && h.brent > 5 && h.brent < 400; }) : [],
      fonteHist: j.fonteHist || ''
    };
    d.eurBarril = d.brent * d.usdEur;
    d.eurLitro = d.eurBarril / LITROS;
    d.wtiEur = d.wti ? d.wti * d.usdEur : null;
    d.varDia = d.prevBrent > 0 ? d.brent / d.prevBrent - 1 : null;
    d.varWti = d.prevWti > 0 && d.wti ? d.wti / d.prevWti - 1 : null;
    d.data = dataLisboa(d.mercadoEm);
    d.hora = horaLisboa(d.mercadoEm);
    /* Sem negociação há mais de 40 minutos: mercado fechado (fim de semana, noite) ou fonte parada */
    d.aoVivo = Date.now() - new Date(d.mercadoEm).getTime() < 40 * 60000;
    return d;
  }

  function chip(v, attr, eur) {
    var e = '<span ' + attr + '-eur style="color:#202432;font-weight:700">' + fmtEuro(eur) + '</span>';
    if (typeof v !== 'number') return 'Em euros: ' + e;
    return 'Sessão: <span class="lfc-pet-var ' + classeVar(v) + '">' + fmtPct(v) + '</span> <span class="lfc-pet-prices-sep">·</span> Em euros: ' + e;
  }
  function renderCards() {
    var b = document.querySelector('#lfc-pet-card-brent [data-brent]');
    var w = document.querySelector('#lfc-pet-card-wti [data-wti]');
    if (b) b.textContent = fmtUsd(D.brent);
    if (w) w.textContent = D.wti ? fmtUsd(D.wti) : '-';
    var cb = document.getElementById('lfc-pet-chips-brent');
    var cw = document.getElementById('lfc-pet-chips-wti');
    if (cb) cb.innerHTML = chip(D.varDia, 'data-brent', D.eurBarril);
    if (cw) cw.innerHTML = D.wtiEur ? chip(D.varWti, 'data-wti', D.wtiEur) : 'Sem cotação de momento';
  }
  function frasePeriodos() {
    var p = [[7, 'em 7 dias'], [30, 'em 30 dias'], [365, 'num ano']].map(function (x) {
      return [variacaoPeriodo(D.brent, D.data, D.hist, x[0]), x[1]];
    }).filter(function (x) { return typeof x[0] === 'number'; })
      .map(function (x) { return '<strong>' + fmtPct(x[0]) + '</strong> ' + x[1]; });
    if (!p.length) return '';
    var lista = p.length > 1 ? p.slice(0, -1).join(', ') + ' e ' + p[p.length - 1] : p[0];
    return ' Em dólares, o Brent varia ' + lista + '.';
  }
  function renderHeadline() {
    var el = document.getElementById('lfc-pet-headline');
    if (!el) return;
    var dia = '';
    if (typeof D.varDia === 'number' && Math.abs(D.varDia) >= 0.0005) {
      dia = ' Face ao fecho anterior, o Brent ' + (D.varDia > 0 ? 'sobe' : 'desce') + ' cerca de ' + fmtPct(D.varDia).replace('+', '').replace('-', '') + '.';
    }
    var wti = D.wtiEur ? ' O barril de <strong>WTI</strong>, a referência americana, está nos <strong>' + fmtUsd(D.wti) + '</strong>.' : '';
    el.innerHTML = 'A <strong>' + dataPT(D.data) + '</strong>, às ' + D.hora + ', o barril de <strong>petróleo Brent</strong> custa cerca de <strong>' + fmtUsd(D.brent) + '</strong>, ou seja <strong>' + fmtEuro(D.eurBarril) + '</strong> ao câmbio dessa hora. Como um barril tem 159 litros, o litro de crude fica em cerca de <strong>' + fmtEuro(D.eurLitro, 3) + '</strong>.' + wti + dia + frasePeriodos();
  }
  function renderStatus() {
    var dataEl = document.getElementById('lfc-pet-data-atualizado');
    var fonteEl = document.getElementById('lfc-pet-status-fonte');
    var dot = document.getElementById('lfc-pet-dot');
    if (dataEl) dataEl.textContent = dataPT(D.data) + ' às ' + D.hora;
    if (D.aoVivo) {
      if (fonteEl) fonteEl.textContent = 'Contratos futuros mais próximos, com atraso até 30 minutos';
      if (dot) dot.classList.remove('is-off');
    } else {
      if (fonteEl) fonteEl.textContent = 'Último preço negociado (mercado fechado ou sem negociação recente)';
      if (dot) dot.classList.add('is-off');
    }
  }

  function refAtiva() {
    var btn = document.querySelector('#lfc-pet-seg .lfc-pet-seg-btn.is-active');
    return btn && btn.getAttribute('data-ref') === 'wti' && D.wti ? 'wti' : 'brent';
  }
  function renderCalc() {
    var out = document.getElementById('lfc-pet-result');
    if (!out) return;
    var el = document.getElementById('lfc-pet-barris');
    var barris = parseFloat(el ? el.value.replace(/\./g, '').replace(',', '.') : '1') || 0;
    if (barris <= 0) { out.innerHTML = 'Indica o número de barris para veres quanto custam.'; return; }
    if (barris > 9999999) barris = 9999999;
    var wti = refAtiva() === 'wti';
    var usd = wti ? D.wti : D.brent;
    var txt = barris === 1 ? '1 barril' : fmtNum(barris, barris % 1 === 0 ? 0 : 1) + ' barris';
    out.innerHTML = txt + ' de <strong>' + (wti ? 'WTI' : 'Brent') + '</strong> (' + fmtNum(barris * LITROS, 0) + ' litros) ' + (barris === 1 ? 'custa' : 'custam') + ' hoje cerca de <strong>' + fmtUsd(usd * barris) + '</strong>, ou seja <strong>' + fmtEuro(usd * barris * D.usdEur) + '</strong>. Este é o preço do petróleo bruto no mercado internacional, antes de refinação, transporte, margens e impostos.';
  }
  function renderUnidades() {
    var tb = document.getElementById('lfc-pet-unidades-tbody');
    if (!tb) return;
    function linha(nome, usd, eur) {
      return '<div class="lfc-pet-tq-row"><div class="lfc-pet-tq-cell">' + nome + '</div><div class="lfc-pet-tq-cell">' + fmtUsd(usd) + '</div><div class="lfc-pet-tq-cell is-valor">' + fmtEuro(eur) + '</div><div class="lfc-pet-tq-cell">' + fmtEuro(eur / LITROS, 3) + '</div></div>';
    }
    tb.innerHTML = linha('Brent', D.brent, D.eurBarril) + (D.wtiEur ? linha('WTI', D.wti, D.wtiEur) : '');
  }
  function bindCalc() {
    var seg = document.getElementById('lfc-pet-seg');
    if (seg && !seg.__lfBound) {
      seg.__lfBound = true;
      seg.addEventListener('click', function (e) {
        var btn = e.target.closest('.lfc-pet-seg-btn');
        if (!btn) return;
        seg.querySelectorAll('.lfc-pet-seg-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
        renderCalc();
      });
    }
    var el = document.getElementById('lfc-pet-barris');
    if (el && !el.__lfBound) {
      el.__lfBound = true;
      el.addEventListener('input', function (e) {
        /* Teclados com ponto decimal (iOS e Android noutros idiomas): o ponto escrito vira vírgula */
        if (e && e.data === '.' && el.value.indexOf(',') === -1) {
          var pos = el.selectionStart || el.value.length;
          el.value = el.value.slice(0, pos - 1) + ',' + el.value.slice(pos);
        }
        var limpo = el.value.replace(/[^\d,]/g, '');
        var partes = limpo.split(',');
        var inteiro = partes[0].replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        var novo = partes.length > 1 ? inteiro + ',' + partes.slice(1).join('').slice(0, 1) : inteiro;
        if (el.value !== novo) el.value = novo;
        renderCalc();
      });
    }
  }
  function renderFaq() {
    var m = { '[data-faq-brent]': fmtUsd(D.brent), '[data-faq-brent-eur]': fmtEuro(D.eurBarril), '[data-faq-litro]': fmtEuro(D.eurLitro, 3), '[data-faq-wti]': D.wti ? fmtUsd(D.wti) : '-' };
    Object.keys(m).forEach(function (s) { document.querySelectorAll(s).forEach(function (el) { el.textContent = m[s]; }); });
  }
  function hidePlaceholder() {
    var all = document.querySelectorAll('div, p, span');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.children.length === 0 && /Preenche os dados e clica/.test(el.textContent)) {
        var n = el;
        while (n.parentElement && n.parentElement.textContent.replace(/\s+/g, ' ').trim() === el.textContent.replace(/\s+/g, ' ').trim() && !n.parentElement.classList.contains('padding-global')) n = n.parentElement;
        n.style.display = 'none';
        break;
      }
    }
  }
  function injectSchema() {
    var s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Preço do petróleo hoje: Brent e WTI (' + dataPT(D.data) + ')',
      inLanguage: 'pt-PT',
      datePublished: '2026-11-27',
      dateModified: D.data,
      author: { '@type': 'Organization', name: 'Literacia Financeira', url: 'https://www.literaciafinanceira.pt' },
      publisher: { '@type': 'Organization', name: 'Literacia Financeira', url: 'https://www.literaciafinanceira.pt' },
      mainEntityOfPage: location.origin + location.pathname
    });
    document.head.appendChild(s);
  }
  function syncTitulo() {
    var h1 = document.querySelector('h1');
    if (h1 && /petróleo/i.test(h1.textContent)) h1.innerHTML = 'Preço do petróleo hoje: Brent e WTI<span class="lfc-pet-h1-data">(' + dataPT(D.data) + ')</span>';
  }

  function render() {
    syncTitulo();
    renderCards();
    renderHeadline();
    renderStatus();
    renderUnidades();
    renderCalc();
    bindCalc();
    renderFaq();
    hidePlaceholder();
    document.querySelectorAll('.all-results_wrapper').forEach(function (w) { w.style.display = 'flex'; });
    window.__lfcPetResults = D;
    document.dispatchEvent(new CustomEvent('lfc-pet:updated', { detail: D }));
  }

  function valido(j) {
    var s = j && j.spot;
    return s && s.brentUsd > 10 && s.brentUsd < 400 && s.usdEur > 0.4 && s.usdEur < 2 && typeof s.mercadoEm === 'string';
  }
  function carregar(primeira) {
    fetch(LF_PET.urlDados + '?t=' + Math.floor(Date.now() / 300000), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!valido(j)) throw new Error('dados inválidos');
        D = calcD(j);
        render();
        if (primeira) injectSchema();
      })
      .catch(function () {
        if (!primeira) return;
        var dot = document.getElementById('lfc-pet-dot');
        var fonteEl = document.getElementById('lfc-pet-status-fonte');
        if (dot) dot.classList.add('is-off');
        if (fonteEl) fonteEl.textContent = 'Valores da última hora (fonte em direto indisponível)';
        hidePlaceholder();
      });
  }
  function boot() {
    carregar(true);
    /* Com a página aberta, volta a ler os dados a cada 5 minutos */
    setInterval(function () { if (!document.hidden) carregar(false); }, 300000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();

(function () {
  var MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var MESES_CURTOS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  var RANGES = { '1m': 31, '3m': 92, '1a': 4000 };
  var rangeAtivo = '3m';
  var HIST = [];

  function fmt2(v) { return v.toFixed(2).replace('.', ','); }
  function fmtPct(v) { return (v >= 0 ? '+' : '-') + Math.abs(v * 100).toFixed(1).replace('.', ',') + '%'; }
  function dataCurta(iso) { var p = iso.split('-'); return parseInt(p[2], 10) + ' ' + MESES_CURTOS[parseInt(p[1], 10) - 1]; }
  function dataLonga(iso) { var p = iso.split('-'); return parseInt(p[2], 10) + ' de ' + MESES[parseInt(p[1], 10) - 1] + ' de ' + p[0]; }
  function dataTabela(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function serieRange() {
    var corte = Date.now() - (RANGES[rangeAtivo] || 92) * 86400000;
    return HIST.filter(function (h) { return new Date(h.d + 'T00:00:00').getTime() >= corte; });
  }
  function carrega(src, global) {
    return new Promise(function (resolve) {
      if (window[global]) { resolve(); return; }
      var s = document.createElement('script');
      s.src = src; s.onload = resolve;
      document.head.appendChild(s);
    });
  }
  window.__lfcPetChart = null;

  function renderChart() {
    carrega('https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js', 'Chart').then(function () {
      var canvas = document.getElementById('lfc-pet-chart');
      if (!canvas || !HIST.length) return;
      if (window.__lfcPetChart) window.__lfcPetChart.destroy();
      var serie = serieRange();
      window.__lfcPetChart = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
          labels: serie.map(function (h) { return dataCurta(h.d); }),
          datasets: [{ label: 'Brent (USD/barril)', data: serie.map(function (h) { return h.brent; }), borderColor: '#202432', backgroundColor: 'rgba(32,36,50,0.06)', borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 4, pointBackgroundColor: '#202432', fill: true, tension: 0.25 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#121721', cornerRadius: 8, padding: 12,
              titleFont: { family: 'Inter', size: 11, weight: '600' },
              bodyFont: { family: 'Inter', size: 11, weight: '500' },
              usePointStyle: true, bodySpacing: 5, boxPadding: 3,
              callbacks: {
                title: function (t) { return dataLonga(serie[t[0].dataIndex].d); },
                label: function (c) { var h = serie[c.dataIndex]; return fmt2(h.brent) + ' USD por barril (' + fmt2(h.eur) + '€)'; }
              }
            }
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#4F5969', font: { family: 'Inter', size: 10, weight: '500' }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 } },
            y: { grid: { color: '#E5E7EB', drawBorder: false }, ticks: { color: '#4F5969', font: { family: 'Inter', size: 10, weight: '500' }, callback: function (v) { return v.toFixed(0) + ' USD'; } } }
          }
        }
      });
    });
  }

  function renderTabela() {
    var tbody = document.getElementById('lfc-pet-tabela-tbody');
    if (!tbody || !HIST.length) return;
    var serie = HIST.slice(-16);
    var html = '';
    for (var i = serie.length - 1; i >= 1; i--) {
      var h = serie[i];
      var v = h.brent / serie[i - 1].brent - 1;
      var cls = v >= 0.0005 ? 'is-up' : (v <= -0.0005 ? 'is-down' : '');
      html += '<div class="lfc-pet-tabela-row">' +
        '<div class="lfc-pet-tabela-cell">' + dataTabela(h.d) + '</div>' +
        '<div class="lfc-pet-tabela-cell">' + fmt2(h.brent) + ' USD</div>' +
        '<div class="lfc-pet-tabela-cell">' + fmt2(h.eur) + '€</div>' +
        '<div class="lfc-pet-tabela-cell"><span class="lfc-pet-tabela-var ' + cls + '">' + fmtPct(v) + '</span></div>' +
        '</div>';
    }
    tbody.innerHTML = html;
  }

  document.addEventListener('click', function (e) {
    var g = e.target.closest('[graphic-button]');
    var t = e.target.closest('[table-button]');
    if (!g && !t) return;
    var chartPanel = document.getElementById('lfc-pet-chart-panel');
    var tablePanel = document.getElementById('lfc-pet-tabela-panel');
    if (!chartPanel || !tablePanel) return;
    document.querySelectorAll('[graphic-button]').forEach(function (b) { b.classList.toggle('is-active', !!g); });
    document.querySelectorAll('[table-button]').forEach(function (b) { b.classList.toggle('is-active', !!t); });
    chartPanel.style.display = g ? 'block' : 'none';
    tablePanel.style.display = t ? 'block' : 'none';
    if (g && window.__lfcPetChart) setTimeout(function () { window.__lfcPetChart.resize(); }, 80);
  });
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.lfc-pet-range-btn');
    if (!btn) return;
    rangeAtivo = btn.getAttribute('data-range') || '3m';
    document.querySelectorAll('.lfc-pet-range-btn').forEach(function (b) { b.classList.toggle('is-active', b === btn); });
    renderChart();
  });

  function capturePanel(sel, filename) {
    carrega('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas').then(function () {
      var panel = document.querySelector(sel);
      if (!panel) return;
      html2canvas(panel, { backgroundColor: '#ffffff', scale: 2 }).then(function (canvas) {
        var link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[download-graph-image-button]');
    if (!btn) return;
    e.preventDefault(); e.stopImmediatePropagation();
    capturePanel('#lfc-pet-chart-panel', 'preco-petroleo-grafico.png');
  }, true);
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[download-table-image-button]');
    if (!btn) return;
    e.preventDefault(); e.stopImmediatePropagation();
    var panel = document.getElementById('lfc-pet-tabela-panel');
    var estava = panel && panel.style.display !== 'none' && panel.offsetParent !== null;
    if (panel && !estava) panel.style.display = 'block';
    capturePanel('#lfc-pet-tabela-panel', 'preco-petroleo-historico.png');
    if (panel && !estava) setTimeout(function () { panel.style.display = 'none'; }, 400);
  }, true);
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[share-button]');
    if (!btn) return;
    e.preventDefault(); e.stopImmediatePropagation();
    navigator.clipboard.writeText(location.origin + location.pathname).then(function () {
      var copied = document.querySelector('[copied-icon]');
      var share = document.querySelector('[share-icon]');
      if (copied) { copied.style.display = 'block'; if (share) share.style.display = 'none'; }
      setTimeout(function () { if (copied) { copied.style.display = 'none'; if (share) share.style.display = 'block'; } }, 2000);
    });
  }, true);

  var desenhado = '';
  function arranque(D) {
    HIST = (D && D.hist) || [];
    if (HIST.length < 10) {
      var panel = document.getElementById('lfc-pet-chart-panel');
      var seccao = panel ? panel.closest('.table-results_padding') : null;
      if (seccao) seccao.style.display = 'none';
      return;
    }
    var chave = HIST[HIST.length - 1].d + HIST.length;
    if (chave === desenhado) return; /* a série diária só muda uma vez por dia */
    desenhado = chave;
    renderChart();
    renderTabela();
  }
  document.addEventListener('lfc-pet:updated', function (e) { arranque(e.detail); });
  if (window.__lfcPetResults) arranque(window.__lfcPetResults);
})();


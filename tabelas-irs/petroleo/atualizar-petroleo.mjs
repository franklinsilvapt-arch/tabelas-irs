// atualizar-petroleo.mjs
// Corre na Action "Atualizar preço do petróleo" (.github/workflows/atualizar-petroleo.yml).
//
// 1) Lê o Brent (BZ=F) e o WTI (CL=F), contratos futuros mais próximos, e o câmbio EUR/USD do
//    Yahoo Finance (cotação do momento e fechos diários de um ano). Se o câmbio do Yahoo falhar,
//    usa o câmbio de referência do BCE (api.frankfurter.dev).
// 2) Grava petroleo/petroleo-dados.json: cotação do momento e série diária de um ano (USD e EUR
//    por barril). A Action publica este ficheiro no ramo "dados-petroleo" (um só commit, sempre
//    substituído), e a página /preco-do-petroleo lê-o em cada visita.
// 3) Se houver WEBFLOW_TOKEN e a hora mudou desde a última escrita, atualiza o item
//    "Petróleo (hoje)" do CMS e publica SÓ esse item, nunca o site. Serve para o Google e os
//    assistentes de IA lerem o preço sem correrem JavaScript.
//
// Uso:
//   node tabelas-irs/petroleo/atualizar-petroleo.mjs                 na Action
//   node tabelas-irs/petroleo/atualizar-petroleo.mjs --print --mock  mostra o que faria, sem rede nem escrita
//   --sem-webflow                                                     não mexe no CMS

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { camposDoItem, derivados } from './petroleo-render.mjs';

const PRINT = process.argv.includes('--print');
const MOCK = process.argv.includes('--mock');
const SEM_WEBFLOW = process.argv.includes('--sem-webflow');
const API = 'https://api.webflow.com/v2';
const TOKEN = process.env.WEBFLOW_TOKEN || '';
const COLLECTION_ID = process.env.WEBFLOW_PETROLEO_COLLECTION_ID || '';
const ITEM_ID = process.env.WEBFLOW_PETROLEO_ITEM_ID || '';
const FICHEIRO = process.env.PETROLEO_FICHEIRO || fileURLToPath(new URL('./petroleo-dados.json', import.meta.url));
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const yahoo = (sim, host, range) => `https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sim)}?range=${range}&interval=1d`;

async function getTexto(url) {
  const headers = { 'user-agent': UA, accept: 'application/json,text/plain,*/*' };
  if (url.startsWith('https://r.jina.ai/')) { headers['x-no-cache'] = 'true'; headers['x-respond-with'] = 'text'; }
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}
// Tenta query1 e query2 do Yahoo e, se ambos falharem, o r.jina.ai como transporte.
async function grafico(sim, range) {
  const rotas = [yahoo(sim, 'query1', range), yahoo(sim, 'query2', range), `https://r.jina.ai/${yahoo(sim, 'query1', range)}`];
  let erro = null;
  for (const url of rotas) {
    try {
      const t = await getTexto(url);
      const i = t.indexOf('{'); const j = t.lastIndexOf('}');
      const r = JSON.parse(t.slice(i, j + 1)).chart.result[0];
      const meta = r.meta;
      if (!(meta.regularMarketPrice > 0)) throw new Error('sem preço');
      const ts = r.timestamp || [];
      const fechos = (r.indicators && r.indicators.quote && r.indicators.quote[0] && r.indicators.quote[0].close) || [];
      const serie = [];
      for (let k = 0; k < ts.length; k++) {
        const v = Number(fechos[k]);
        if (Number.isFinite(v) && v > 0) serie.push({ d: new Date((ts[k] + (meta.gmtoffset || 0)) * 1000).toISOString().slice(0, 10), v });
      }
      return { preco: meta.regularMarketPrice, em: new Date(meta.regularMarketTime * 1000).toISOString(), serie, rota: url.slice(0, 40) };
    } catch (e) { erro = e; console.log(`  ${sim}: falhou ${url.slice(0, 60)} (${e.message})`); }
  }
  throw erro || new Error(`${sim}: sem resposta`);
}
async function cambioBce() {
  const t = await getTexto('https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR');
  const v = JSON.parse(t).rates.EUR;
  if (!(v > 0.4 && v < 2)) throw new Error('câmbio fora do plausível');
  return v;
}

// Fecho anterior: último fecho diário com data anterior à da sessão do preço atual.
function fechoAnterior(serie, dataSessao) {
  for (let i = serie.length - 1; i >= 0; i--) if (serie[i].d < dataSessao) return serie[i].v;
  return null;
}

function lerFicheiro() {
  if (!existsSync(FICHEIRO)) return {};
  try { return JSON.parse(readFileSync(FICHEIRO, 'utf8')); } catch { return {}; }
}

async function webflow(metodo, caminho, corpo) {
  const res = await fetch(API + caminho, {
    method: metodo,
    headers: { authorization: `Bearer ${TOKEN}`, accept: 'application/json', 'content-type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const texto = await res.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { /* sem JSON */ }
  return { status: res.status, ok: res.ok, json, texto };
}

async function atualizarWebflow(D) {
  if (SEM_WEBFLOW || !TOKEN || !COLLECTION_ID || !ITEM_ID) {
    console.log('atualizar-petroleo: sem WEBFLOW_TOKEN ou ids da coleção, não mexo no Webflow.');
    return;
  }
  const campos = camposDoItem(D);
  const live = await webflow('GET', `/collections/${COLLECTION_ID}/items/${ITEM_ID}/live`);
  if (live.status === 404) {
    console.log('atualizar-petroleo: o item ainda não existe no site publicado. Publica o site uma vez e a partir daí a Action atualiza-o sozinha.');
    return;
  }
  if (!live.ok) throw new Error(`erro ao ler o item (${live.status}): ${live.texto.slice(0, 300)}`);
  // Só escreve uma vez por hora (o texto do HTML diz a hora da cotação).
  const antigo = (live.json.fieldData || {}).resumo || '';
  const [dAnt, hAnt] = antigo.split(' | ');
  const X = derivados(D);
  if (dAnt === X.data && hAnt && hAnt.slice(0, 2) === X.hora.slice(0, 2)) {
    console.log(`atualizar-petroleo: Webflow já tem a cotação desta hora (${antigo}).`);
    return;
  }
  const upd = await webflow('PATCH', `/collections/${COLLECTION_ID}/items/${ITEM_ID}`, { isArchived: false, isDraft: false, fieldData: campos });
  if (!upd.ok) throw new Error(`erro ao atualizar o item (${upd.status}): ${upd.texto.slice(0, 300)}`);
  const pub = await webflow('POST', `/collections/${COLLECTION_ID}/items/publish`, { itemIds: [ITEM_ID] });
  if (!pub.ok) throw new Error(`erro ao publicar o item (${pub.status}): ${pub.texto.slice(0, 300)}`);
  console.log(`atualizar-petroleo: item atualizado e publicado (${campos.resumo}).`);
}

async function main() {
  const atual = lerFicheiro();
  let brent; let wti; let fx; let usdEur; let fonteCambio;
  if (MOCK) {
    const hist = (atual.hist || []).map((h) => ({ d: h.d, v: h.brent }));
    brent = { preco: 94.54, em: '2026-11-27T16:21:00Z', serie: hist.length ? hist : [{ d: '2026-11-26', v: 96.1 }] };
    wti = { preco: 90.12, em: '2026-11-27T16:21:00Z', serie: [{ d: '2026-11-26', v: 91.0 }] };
    fx = { preco: 1.0938, em: '2026-11-27T16:19:00Z', serie: [{ d: '2026-11-26', v: 1.095 }] };
  } else {
    brent = await grafico('BZ=F', '1y');
    wti = await grafico('CL=F', '5d').catch(() => null);
    fx = await grafico('EURUSD=X', '1y').catch(() => null);
  }
  if (fx && fx.preco > 0.5 && fx.preco < 2.5) { usdEur = 1 / fx.preco; fonteCambio = 'EUR/USD do momento'; } else {
    usdEur = await cambioBce(); fonteCambio = 'câmbio de referência do BCE';
  }
  if (!(brent.preco > 10 && brent.preco < 400)) throw new Error(`Brent fora do plausível: ${brent.preco}`);

  const dataSessao = brent.em.slice(0, 10);
  const D = {
    brent: brent.preco,
    wti: wti && wti.preco > 10 && wti.preco < 400 ? wti.preco : null,
    usdEur,
    prevBrent: fechoAnterior(brent.serie, dataSessao),
    prevWti: wti ? fechoAnterior(wti.serie, wti.em.slice(0, 10)) : null,
    mercadoEm: brent.em
  };

  // Série diária: fecho do Brent em USD e em EUR (câmbio do fecho do mesmo dia, se houver).
  const fxDia = new Map(((fx && fx.serie) || []).map((x) => [x.d, x.v]));
  let ultimoFx = fx ? fx.preco : 1 / usdEur;
  const hist = [];
  for (const p of brent.serie) {
    if (p.d >= dataSessao) continue; // a sessão de hoje entra quando fechar
    if (fxDia.has(p.d)) ultimoFx = fxDia.get(p.d);
    hist.push({ d: p.d, brent: Math.round(p.v * 100) / 100, eur: Math.round(p.v / ultimoFx * 100) / 100 });
  }
  // Se o Yahoo devolver menos dias do que já temos, junta com a série guardada.
  const mapa = new Map((atual.hist || []).map((h) => [h.d, h]));
  for (const h of hist) mapa.set(h.d, h);
  const corte = new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10);
  D.hist = [...mapa.values()].filter((h) => h.d >= corte && h.d < dataSessao).sort((a, b) => (a.d < b.d ? -1 : 1));

  const X = derivados(D);
  const dados = {
    spot: {
      brentUsd: Math.round(D.brent * 100) / 100,
      wtiUsd: D.wti ? Math.round(D.wti * 100) / 100 : null,
      usdEur: Math.round(D.usdEur * 10000) / 10000,
      prevBrent: D.prevBrent ? Math.round(D.prevBrent * 100) / 100 : null,
      prevWti: D.prevWti ? Math.round(D.prevWti * 100) / 100 : null,
      mercadoEm: D.mercadoEm,
      atualizadoEm: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
      fonte: `Yahoo Finance (BZ=F, CL=F, contratos futuros mais próximos) + ${fonteCambio}`
    },
    fonteHist: 'fecho diário do contrato futuro de Brent mais próximo (Yahoo Finance), em euros ao câmbio EUR/USD do fecho',
    hist: D.hist
  };

  if (PRINT) {
    console.log(JSON.stringify({ ...dados, hist: `${D.hist.length} dias, último ${D.hist.length ? D.hist[D.hist.length - 1].d : '-'}` }, null, 2));
    console.log(X);
    console.log(camposDoItem(D).resumo);
    return;
  }
  writeFileSync(FICHEIRO, `${JSON.stringify(dados, null, 1)}\n`);
  console.log(`atualizar-petroleo: Brent ${D.brent} USD (${X.eurBarril.toFixed(2)} €), ${D.hist.length} dias de série.`);
  await atualizarWebflow(D);
}

main().catch((e) => { console.error('atualizar-petroleo:', e.message || e); process.exit(1); });

// atualizar-prata.mjs
// Corre na Action "Atualizar preço da prata" (.github/workflows/atualizar-prata.yml).
//
// 1) Lê a cotação spot da prata (api.gold-api.com, XAG em USD por onça) e o câmbio EUR/USD do BCE
//    (api.frankfurter.dev) e grava prata/prata-dados.json: cotação de reserva e série diária em
//    euros por grama. A página /preco-da-prata lê este ficheiro (GitHub Pages) para o gráfico,
//    o histórico e a variação diária, e como reserva se as fontes em direto falharem.
// 2) Se a série ainda tiver poucos dias, tenta preenchê-la com o preço de referência diário da
//    LBMA (prices.lbma.org.uk, coluna em euros). Se a LBMA não responder, a série cresce sozinha
//    com um registo por dia útil.
// 3) Se houver WEBFLOW_TOKEN, atualiza o item "Prata (hoje)" do CMS do literaciafinanceira.pt
//    e publica SÓ esse item, nunca o site. Serve para o Google, o Bing e os assistentes de IA
//    lerem o preço do dia sem correrem JavaScript.
//
// Uso:
//   node tabelas-irs/prata/atualizar-prata.mjs                 na Action
//   node tabelas-irs/prata/atualizar-prata.mjs --print --mock  mostra o que faria, sem rede nem escrita

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GRAMA, camposDoItem, variacaoDia } from './prata-render.mjs';

const PRINT = process.argv.includes('--print');
const MOCK = process.argv.includes('--mock');
const API = 'https://api.webflow.com/v2';
const TOKEN = process.env.WEBFLOW_TOKEN || '';
const COLLECTION_ID = process.env.WEBFLOW_PRATA_COLLECTION_ID || '';
const ITEM_ID = process.env.WEBFLOW_PRATA_ITEM_ID || '';
const FICHEIRO = fileURLToPath(new URL('./prata-dados.json', import.meta.url));
const MAX_DIAS = 400;

const URL_PRATA = 'https://api.gold-api.com/price/XAG';
const URL_CAMBIO = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR';
const URL_LBMA = 'https://prices.lbma.org.uk/json/silver.json';

function hojeLisboa() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
async function getJson(url) {
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'literaciafinanceira-prata' }, signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (tentativa === 2) { console.log(`atualizar-prata: falhou ${url} (${e.message})`); return null; }
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return null;
}
const plausivelGrama = (v) => typeof v === 'number' && v > 0.1 && v < 20; // euros por grama
const validaSpot = (o, c) => o && typeof o.price === 'number' && o.price > 3 && o.price < 1000 &&
  c && c.rates && typeof c.rates.EUR === 'number' && c.rates.EUR > 0.4 && c.rates.EUR < 2;

function lerFicheiro() {
  if (!existsSync(FICHEIRO)) return { hist: [] };
  try { return JSON.parse(readFileSync(FICHEIRO, 'utf8')); } catch { return { hist: [] }; }
}

// LBMA: [{ d: 'AAAA-MM-DD', v: [USD, GBP, EUR] }, ...] por onça. Só usa a coluna em euros.
function serieLbma(json) {
  if (!Array.isArray(json)) return [];
  const corte = new Date(Date.now() - MAX_DIAS * 86400000).toISOString().slice(0, 10);
  const out = [];
  for (const q of json) {
    if (!q || typeof q.d !== 'string' || q.d < corte || !Array.isArray(q.v)) continue;
    const eur = Number(q.v[2]) / GRAMA;
    if (plausivelGrama(eur)) out.push({ d: q.d, eur: Math.round(eur * 10000) / 10000 });
  }
  return out;
}

function juntar(a, b) {
  const mapa = new Map();
  for (const h of a) mapa.set(h.d, h);
  for (const h of b) mapa.set(h.d, h); // b ganha (registo mais recente do mesmo dia)
  const corte = new Date(Date.now() - MAX_DIAS * 86400000).toISOString().slice(0, 10);
  return [...mapa.values()].filter((h) => h.d >= corte).sort((x, y) => (x.d < y.d ? -1 : 1));
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
  if (!TOKEN || !COLLECTION_ID || !ITEM_ID) {
    console.log('atualizar-prata: sem WEBFLOW_TOKEN ou ids da coleção, não mexo no Webflow.');
    return;
  }
  const campos = camposDoItem(D);
  const live = await webflow('GET', `/collections/${COLLECTION_ID}/items/${ITEM_ID}/live`);
  if (live.status === 404) {
    console.log('atualizar-prata: o item ainda não existe no site publicado. Publica o site uma vez e a partir daí a Action atualiza-o sozinha.');
    return;
  }
  if (!live.ok) throw new Error(`erro ao ler o item (${live.status}): ${live.texto.slice(0, 300)}`);
  if ((live.json.fieldData || {}).resumo === campos.resumo) {
    console.log(`atualizar-prata: Webflow sem alterações (${campos.resumo}).`);
    return;
  }
  const upd = await webflow('PATCH', `/collections/${COLLECTION_ID}/items/${ITEM_ID}`, { isArchived: false, isDraft: false, fieldData: campos });
  if (!upd.ok) throw new Error(`erro ao atualizar o item (${upd.status}): ${upd.texto.slice(0, 300)}`);
  const pub = await webflow('POST', `/collections/${COLLECTION_ID}/items/publish`, { itemIds: [ITEM_ID] });
  if (!pub.ok) throw new Error(`erro ao publicar o item (${pub.status}): ${pub.texto.slice(0, 300)}`);
  console.log(`atualizar-prata: item atualizado e publicado (${campos.resumo}).`);
}

async function main() {
  const atual = lerFicheiro();
  let prata; let cambio; let lbma = null;
  if (MOCK) {
    prata = { price: 41.358 };
    cambio = { rates: { EUR: 0.9112 } };
  } else {
    [prata, cambio] = await Promise.all([getJson(URL_PRATA), getJson(URL_CAMBIO)]);
  }
  if (!validaSpot(prata, cambio)) {
    console.log('::warning::atualizar-prata: sem cotação fiável (gold-api ou frankfurter falharam). Não mexo em nada.');
    return;
  }
  const hoje = hojeLisboa();
  const D = { xagUsd: prata.price, usdEur: cambio.rates.EUR, data: hoje, fonte: 'spot' };
  D.eurG = D.xagUsd * D.usdEur / GRAMA;
  if (!plausivelGrama(D.eurG)) throw new Error(`preço por grama fora do plausível: ${D.eurG}`);

  let hist = Array.isArray(atual.hist) ? atual.hist : [];
  let fonteHist = atual.fonteHist || 'registo diário do Literacia Financeira';
  if (hist.length < 30 && !MOCK) {
    lbma = serieLbma(await getJson(URL_LBMA));
    if (lbma.length >= 30) {
      hist = juntar(lbma, hist);
      fonteHist = 'preço de referência da LBMA até ao arranque, depois registo diário do Literacia Financeira';
      console.log(`atualizar-prata: série preenchida com ${lbma.length} dias da LBMA.`);
    }
  }
  D.varDia = variacaoDia(D.eurG, hoje, hist);
  D.hist = hist;
  const dia = new Date(`${hoje}T12:00:00Z`).getUTCDay();
  if (dia !== 0 && dia !== 6) hist = juntar(hist, [{ d: hoje, eur: Math.round(D.eurG * 10000) / 10000 }]);

  const dados = {
    spot: {
      xagUsd: Math.round(D.xagUsd * 1000) / 1000,
      usdEur: Math.round(D.usdEur * 10000) / 10000,
      eurG: Math.round(D.eurG * 10000) / 10000,
      data: hoje,
      atualizadoEm: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
      fonte: 'api.gold-api.com + api.frankfurter.dev (BCE)'
    },
    fonteHist,
    hist
  };

  if (PRINT) {
    console.log(JSON.stringify({ ...dados, hist: `${hist.length} dias` }, null, 2));
    console.log(JSON.stringify(camposDoItem(D)).slice(0, 600));
    return;
  }
  writeFileSync(FICHEIRO, `${JSON.stringify(dados, null, 1)}\n`);
  console.log(`atualizar-prata: prata-dados.json com ${hist.length} dias, ${D.eurG.toFixed(4)} €/g.`);
  await atualizarWebflow(D);
}

main().catch((e) => { console.error('atualizar-prata:', e.message || e); process.exit(1); });

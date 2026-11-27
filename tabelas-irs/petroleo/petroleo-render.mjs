// petroleo-render.mjs
// Regras de texto e de formato do /preco-do-petroleo, partilhadas pela Action (atualizar-petroleo.mjs).
// Seguem as mesmas regras do script da página (petroleo-pagina.js.html): se mudares uma frase
// aqui, muda também lá.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const LITROS_BARRIL = 158.987294928; // 42 galões americanos
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function modelo(nome) {
  return readFileSync(fileURLToPath(new URL(nome, import.meta.url)), 'utf8').trim();
}

export function fmtNum(v, dec) {
  const p = v.toFixed(dec).split('.');
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec > 0 ? `${p[0]},${p[1]}` : p[0];
}
export const fmtEuro = (v, dec = 2) => `${fmtNum(v, dec)}€`;
export const fmtUsd = (v, dec = 2) => `${fmtNum(v, dec)} USD`;
export const fmtPct = (v) => `${v >= 0 ? '+' : '-'}${Math.abs(v * 100).toFixed(1).replace('.', ',')}%`;
export const classeVar = (v) => (v >= 0.0005 ? 'is-up' : v <= -0.0005 ? 'is-down' : 'is-flat');
export function dataPT(iso) {
  const p = iso.split('-');
  return `${parseInt(p[2], 10)} de ${MESES[parseInt(p[1], 10) - 1]} de ${p[0]}`;
}
// Hora de Lisboa (HH:MM) de um instante ISO.
export function horaLisboa(isoInstante) {
  return new Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(isoInstante));
}
export function dataLisboa(isoInstante) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(isoInstante));
}
function preenche(tpl, valores) {
  return tpl.replace(/@@([A-Z0-9_]+)@@/g, (m, k) => {
    if (!(k in valores)) throw new Error(`falta o valor ${k}`);
    return valores[k];
  });
}

// Variação face ao último fecho diário com pelo menos `dias` dias (tolerância de 7 dias), em USD.
export function variacaoPeriodo(preco, dataIso, hist, dias) {
  if (!Array.isArray(hist)) return null;
  const alvo = new Date(`${dataIso}T00:00:00Z`).getTime() - dias * 86400000;
  for (let i = hist.length - 1; i >= 0; i--) {
    const h = hist[i];
    if (!h || !(h.brent > 0)) continue;
    const t = new Date(`${h.d}T00:00:00Z`).getTime();
    if (t > alvo) continue;
    return alvo - t <= 7 * 86400000 ? preco / h.brent - 1 : null;
  }
  return null;
}

// D = { brent, wti, usdEur, prevBrent, prevWti, mercadoEm (ISO), hist }
export function derivados(D) {
  const eurBarril = D.brent * D.usdEur;
  return {
    eurBarril,
    eurLitro: eurBarril / LITROS_BARRIL,
    wtiEur: D.wti ? D.wti * D.usdEur : null,
    varDia: D.prevBrent > 0 ? D.brent / D.prevBrent - 1 : null,
    varWti: D.prevWti > 0 && D.wti ? D.wti / D.prevWti - 1 : null,
    data: dataLisboa(D.mercadoEm),
    hora: horaLisboa(D.mercadoEm)
  };
}

export function chipsBrent(D, X) {
  const eur = `<span data-brent-eur style="color:#202432;font-weight:700">${fmtEuro(X.eurBarril)}</span>`;
  if (typeof X.varDia === 'number') {
    return `Sessão: <span class="lfc-pet-var ${classeVar(X.varDia)}" data-var-dia>${fmtPct(X.varDia)}</span> <span class="lfc-pet-prices-sep">·</span> Em euros: ${eur}`;
  }
  return `Em euros: ${eur}`;
}
export function chipsWti(D, X) {
  if (!X.wtiEur) return 'Sem cotação de momento';
  const eur = `<span data-wti-eur style="color:#202432;font-weight:700">${fmtEuro(X.wtiEur)}</span>`;
  if (typeof X.varWti === 'number') {
    return `Sessão: <span class="lfc-pet-var ${classeVar(X.varWti)}" data-var-wti>${fmtPct(X.varWti)}</span> <span class="lfc-pet-prices-sep">·</span> Em euros: ${eur}`;
  }
  return `Em euros: ${eur}`;
}
export function frasePeriodos(D) {
  const ref = (D.hist || []).length ? D.hist[D.hist.length - 1].d : null;
  const data = derivados(D).data;
  const partes = [];
  for (const [dias, rot] of [[7, 'em 7 dias'], [30, 'em 30 dias'], [365, 'num ano']]) {
    const v = variacaoPeriodo(D.brent, data, D.hist, dias);
    if (typeof v === 'number') partes.push(`<strong>${fmtPct(v)}</strong> ${rot}`);
  }
  if (!partes.length || !ref) return '';
  const lista = partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}` : partes[0];
  return ` Em dólares, o Brent varia ${lista}.`;
}
export function frase(D) {
  const X = derivados(D);
  let dia = '';
  if (typeof X.varDia === 'number' && Math.abs(X.varDia) >= 0.0005) {
    dia = ` Face ao fecho anterior, o Brent ${X.varDia > 0 ? 'sobe' : 'desce'} cerca de ${fmtPct(X.varDia).replace('+', '').replace('-', '')}.`;
  }
  const wti = X.wtiEur ? ` O barril de <strong>WTI</strong>, a referência americana, está nos <strong>${fmtUsd(D.wti)}</strong>.` : '';
  return `A <strong>${dataPT(X.data)}</strong>, às ${X.hora}, o barril de <strong>petróleo Brent</strong> custa cerca de <strong>${fmtUsd(D.brent)}</strong>, ou seja <strong>${fmtEuro(X.eurBarril)}</strong> ao câmbio de agora. Como um barril tem 159 litros, o litro de crude fica em cerca de <strong>${fmtEuro(X.eurLitro, 3)}</strong>.${wti}${dia}${frasePeriodos(D)}`;
}
export function linhasUnidades(D) {
  const X = derivados(D);
  const linha = (nome, usd, eur) => '<div class="lfc-pet-tq-row">' +
    `<div class="lfc-pet-tq-cell">${nome}</div>` +
    `<div class="lfc-pet-tq-cell">${fmtUsd(usd)}</div>` +
    `<div class="lfc-pet-tq-cell is-valor">${fmtEuro(eur)}</div>` +
    `<div class="lfc-pet-tq-cell">${fmtEuro(eur / LITROS_BARRIL, 3)}</div>` +
    '</div>';
  let html = linha('Brent', D.brent, X.eurBarril);
  if (X.wtiEur) html += linha('WTI', D.wti, X.wtiEur);
  return html;
}
export function resultado(D, barris = 1, ref = 'brent') {
  const X = derivados(D);
  const usd = ref === 'wti' && D.wti ? D.wti : D.brent;
  const nome = ref === 'wti' && D.wti ? 'WTI' : 'Brent';
  const litros = barris * LITROS_BARRIL;
  const txtBarris = barris === 1 ? '1 barril' : `${fmtNum(barris, barris % 1 === 0 ? 0 : 1)} barris`;
  return `${txtBarris} de <strong>${nome}</strong> (${fmtNum(litros, 0)} litros) ${barris === 1 ? 'custa' : 'custam'} hoje cerca de <strong>${fmtUsd(usd * barris)}</strong>, ou seja <strong>${fmtEuro(usd * barris * D.usdEur)}</strong>. Este é o preço do petróleo bruto no mercado internacional, antes de refinação, transporte, margens e impostos.`;
}

const embed = (html) => `<div data-rt-embed-type='true'>${html}</div>`;

// Campos do item "Petróleo (hoje)" do CMS.
export function camposDoItem(D) {
  const X = derivados(D);
  const hero = preenche(modelo('petroleo-hero.tpl.html'), {
    BRENT: fmtUsd(D.brent), WTI: D.wti ? fmtUsd(D.wti) : '-',
    CHIPS_BRENT: chipsBrent(D, X), CHIPS_WTI: chipsWti(D, X),
    HEADLINE: frase(D), DATA: `${dataPT(X.data)} às ${X.hora}`
  });
  const calc = preenche(modelo('petroleo-calculadora.tpl.html'), { RESULT: resultado(D), ROWS: linhasUnidades(D) });
  const faq = preenche(modelo('petroleo-faq.tpl.html'), {
    BRENT: fmtUsd(D.brent), BRENT_EUR: fmtEuro(X.eurBarril), LITRO: fmtEuro(X.eurLitro, 3),
    WTI: D.wti ? fmtUsd(D.wti) : '-'
  });
  const resumo = [X.data, X.hora, `Brent ${fmtUsd(D.brent)}`, `WTI ${D.wti ? fmtUsd(D.wti) : '-'}`,
    `${fmtEuro(X.eurBarril)}/barril`, `USD/EUR ${D.usdEur.toFixed(4)}`, `sessão ${typeof X.varDia === 'number' ? fmtPct(X.varDia) : 'n/d'}`].join(' | ');
  const campos = { resumo, 'hero-html': embed(hero), 'calculadora-html': embed(calc), 'faq-html': embed(faq) };
  for (const k of ['hero-html', 'calculadora-html', 'faq-html']) {
    if (/@@|undefined|NaN/.test(campos[k])) throw new Error(`markup inválido em ${k}`);
  }
  return campos;
}

// prata-render.mjs
// Regras de texto e de formato do /preco-da-prata, partilhadas pela Action (atualizar-prata.mjs).
// Seguem as mesmas regras do script da página (embed "script" do /preco-da-prata): se mudares
// uma frase aqui, muda também lá.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const GRAMA = 31.1034768; // gramas numa onça troy
export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const TOQUES = [
  { id: '999', sub: 'prata fina', pct: '99,9%', f: 1 },
  { id: '925', sub: 'prata de lei', pct: '92,5%', f: 0.925 },
  { id: '835', sub: '', pct: '83,5%', f: 0.835 },
  { id: '830', sub: '', pct: '83,0%', f: 0.830 },
  { id: '800', sub: '', pct: '80,0%', f: 0.800 }
];
export const PESO_DEFEITO = 100; // gramas, igual ao input da página
export const TOQUE_DEFEITO = '925';

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
export const fmtPeso = (v) => `${v % 1 === 0 ? fmtNum(v, 0) : fmtNum(v, 1)} g`;
export const classeVar = (v) => (v >= 0.0005 ? 'is-up' : v <= -0.0005 ? 'is-down' : 'is-flat');
export function dataPT(iso) {
  const p = iso.split('-');
  return `${parseInt(p[2], 10)} de ${MESES[parseInt(p[1], 10) - 1]} de ${p[0]}`;
}
function preenche(tpl, valores) {
  return tpl.replace(/@@([A-Z0-9_]+)@@/g, (m, k) => {
    if (!(k in valores)) throw new Error(`falta o valor ${k}`);
    return valores[k];
  });
}

// Variação face ao último registo diário anterior à data da cotação (no máximo 6 dias antes).
export function variacaoDia(eurG, dataIso, hist) {
  if (!Array.isArray(hist)) return null;
  const t = new Date(`${dataIso}T00:00:00Z`).getTime();
  for (let i = hist.length - 1; i >= 0; i--) {
    const h = hist[i];
    if (!h || h.d >= dataIso || !(h.eur > 0)) continue;
    const dias = (t - new Date(`${h.d}T00:00:00Z`).getTime()) / 86400000;
    return dias <= 6 ? eurG / h.eur - 1 : null;
  }
  return null;
}

export function chips(D) {
  if (typeof D.varDia === 'number') {
    return `Hoje: <span class="lfc-prata-var ${classeVar(D.varDia)}" data-var-dia>${fmtPct(D.varDia)}</span>`;
  }
  return `Onça troy: <span data-onca style="color:#202432;font-weight:700">${fmtUsd(D.xagUsd)}</span>`;
}
export function frase(D) {
  let dia = '';
  if (typeof D.varDia === 'number' && Math.abs(D.varDia) >= 0.0005) {
    dia = ` Face ao dia útil anterior, o preço ${D.varDia > 0 ? 'sobe' : 'desce'} cerca de ${fmtPct(D.varDia).replace('+', '').replace('-', '')}.`;
  }
  return `A <strong>${dataPT(D.data)}</strong>, um grama de <strong>prata fina</strong> vale cerca de <strong>${fmtEuro(D.eurG)}</strong> (${fmtUsd(D.xagUsd)} por onça troy, convertido ao câmbio do BCE) e um quilo vale cerca de <strong>${fmtEuro(D.eurG * 1000)}</strong>. Na <strong>prata 925</strong>, o metal vale cerca de <strong>${fmtEuro(D.eurG * 0.925)}</strong> por grama.${dia}`;
}
export function linhasToques(D) {
  return TOQUES.map((t) => '<div class="lfc-prata-tq-row">' +
    `<div class="lfc-prata-tq-cell">${t.id}${t.sub ? ` <span class="lfc-prata-tq-sub">· ${t.sub}</span>` : ''}</div>` +
    `<div class="lfc-prata-tq-cell">${t.pct}</div>` +
    `<div class="lfc-prata-tq-cell is-valor">${fmtEuro(D.eurG * t.f)}</div>` +
    '</div>').join('');
}
export function resultado(D, peso = PESO_DEFEITO, toque = TOQUE_DEFEITO) {
  const t = TOQUES.find((x) => x.id === toque) || TOQUES[1];
  return `A prata de uma peça de <strong>${fmtPeso(peso)}</strong> com toque <strong>${t.id}${t.sub ? ` (${t.sub})` : ''}</strong> vale hoje cerca de <strong>${fmtEuro(peso * t.f * D.eurG)}</strong> (${fmtEuro(D.eurG * t.f)} por grama). Numa loja de compra de prata, espera uma proposta abaixo deste valor - é a margem do comprador. Compara sempre 2 ou 3 propostas.`;
}

const embed = (html) => `<div data-rt-embed-type='true'>${html}</div>`;

// Campos do item "Prata (hoje)" do CMS.
export function camposDoItem(D) {
  const hero = preenche(modelo('prata-hero.tpl.html'), {
    FINA: fmtEuro(D.eurG), KG: fmtEuro(D.eurG * 1000), P925: fmtEuro(D.eurG * 0.925),
    CHIPS: chips(D), HEADLINE: frase(D), DATA: dataPT(D.data)
  });
  const calc = preenche(modelo('prata-calculadora.tpl.html'), { RESULT: resultado(D), ROWS: linhasToques(D) });
  const faq = preenche(modelo('prata-faq.tpl.html'), {
    FINA: fmtEuro(D.eurG), P925: fmtEuro(D.eurG * 0.925), KG: fmtEuro(D.eurG * 1000),
    KG925: fmtEuro(D.eurG * 925), FAQ2KG: fmtEuro(D.eurG * 0.925 * 2000)
  });
  const resumo = [D.data, `999 ${fmtEuro(D.eurG)}`, `kg ${fmtEuro(D.eurG * 1000)}`, fmtUsd(D.xagUsd),
    `EUR/USD ${D.usdEur}`, `dia ${typeof D.varDia === 'number' ? fmtPct(D.varDia) : 'n/d'}`, D.fonte].join(' | ');
  const campos = { resumo, 'hero-html': embed(hero), 'calculadora-html': embed(calc), 'faq-html': embed(faq) };
  for (const k of ['hero-html', 'calculadora-html', 'faq-html']) {
    if (/@@|undefined|NaN/.test(campos[k])) throw new Error(`markup inválido em ${k}`);
  }
  return campos;
}

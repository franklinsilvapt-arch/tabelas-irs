// links-internos.mjs - acrescenta links internos a artigos do CMS do literaciafinanceira.pt
// Para cada {slug, texto, href}: lê a versão guardada mais recente do artigo, encontra a
// primeira ocorrência de "texto" fora de links e põe-lhe o link. Não publica: as alterações
// ficam por publicar no Webflow, para o Franklin rever e publicar.
// Uso: LINKS='[{"slug":"...","texto":"...","href":"/..."}]' node qa/links-internos.mjs [--aplicar]
const APLICAR = process.argv.includes('--aplicar');
const TOKEN = process.env.WEBFLOW_TOKEN;
const COL = '67922c46c9da6bf5d9bfdf76'; // Artigos
const API = 'https://api.webflow.com/v2';
const links = JSON.parse(process.env.LINKS || '[]');
const h = { authorization: `Bearer ${TOKEN}`, accept: 'application/json', 'content-type': 'application/json' };

function primeiraForaDeLinks(html, texto) {
  let pos = 0;
  while ((pos = html.indexOf(texto, pos)) !== -1) {
    const antes = html.slice(0, pos);
    const abertos = (antes.match(/<a[\s>]/g) || []).length;
    const fechados = (antes.match(/<\/a>/g) || []).length;
    const dentroTag = antes.lastIndexOf('<') > antes.lastIndexOf('>');
    if (abertos === fechados && !dentroTag) return pos;
    pos += texto.length;
  }
  return -1;
}

for (const l of links) {
  const r = await fetch(`${API}/collections/${COL}/items?slug=${encodeURIComponent(l.slug)}`, { headers: h });
  const j = await r.json();
  const item = (j.items || [])[0];
  if (!item) { console.log(`NAO_ENCONTRADO ${l.slug}`); continue; }
  const html = item.fieldData.artigo || '';
  if (html.includes(`href="${l.href}"`) || html.includes(`literaciafinanceira.pt${l.href}"`)) { console.log(`JA_TEM ${l.slug}`); continue; }
  const p = primeiraForaDeLinks(html, l.texto);
  if (p < 0) { console.log(`TEXTO_NAO_ENCONTRADO ${l.slug}: ${l.texto}`); continue; }
  const novo = html.slice(0, p) + `<a href="${l.href}">${l.texto}</a>` + html.slice(p + l.texto.length);
  console.log(`${APLICAR ? 'APLICADO' : 'SIMULADO'} ${l.slug} (editado ${item.lastUpdated}, rascunho ${item.isDraft}): ...${novo.slice(Math.max(0, p - 80), p + l.href.length + l.texto.length + 60).replace(/\n/g, ' ')}...`);
  if (!APLICAR) continue;
  const u = await fetch(`${API}/collections/${COL}/items/${item.id}`, { method: 'PATCH', headers: h, body: JSON.stringify({ fieldData: { artigo: novo } }) });
  if (!u.ok) { console.log(`ERRO ${l.slug}: ${u.status} ${(await u.text()).slice(0, 200)}`); continue; }
  const v = await (await fetch(`${API}/collections/${COL}/items/${item.id}`, { headers: h })).json();
  console.log(`  verificado: ${v.fieldData.artigo.includes(`href="${l.href}"`) ? 'ok' : 'FALHOU'} (${v.lastUpdated})`);
}

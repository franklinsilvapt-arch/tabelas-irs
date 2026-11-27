// procurar-texto.mjs - procura um texto em todas as páginas do sitemap do literaciafinanceira.pt
// Uso: node qa/procurar-texto.mjs "petróleo|Brent" "/preco-do-petroleo"
// Mostra cada página com o número de ocorrências (no conteúdo principal) e se já tem link para o destino.
const [termo, destino = ''] = process.argv.slice(2);
const re = new RegExp(termo, 'gi');
const base = 'https://www.literaciafinanceira.pt';
const sm = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const res = [];
let i = 0;
async function trabalhador() {
  while (i < urls.length) {
    const u = urls[i++];
    try {
      const html = await (await fetch(u, { headers: { 'user-agent': 'lf-qa' } })).text();
      const ini = html.indexOf('<main'); const fim = html.lastIndexOf('</main>');
      const main = ini >= 0 ? html.slice(ini, fim) : html;
      const texto = main.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
      const n = (texto.match(re) || []).length;
      if (n) {
        const limpo = texto.replace(/\s+/g, ' ');
        const ctx = [];
        let m; const r2 = new RegExp(termo, 'gi');
        while ((m = r2.exec(limpo)) && ctx.length < 3) ctx.push('   > ' + limpo.slice(Math.max(0, m.index - 90), m.index + 90).trim());
        res.push(`${n}\t${destino && main.includes(destino) ? 'JA_TEM_LINK' : '-'}\t${u.replace(base, '')}\n${ctx.join('\n')}`);
      }
    } catch (e) { console.log('falhou', u, e.message); }
  }
}
await Promise.all(Array.from({ length: 8 }, trabalhador));
console.log(`${urls.length} páginas no sitemap`);
console.log(res.sort((a, b) => parseInt(b, 10) - parseInt(a, 10)).join('\n'));

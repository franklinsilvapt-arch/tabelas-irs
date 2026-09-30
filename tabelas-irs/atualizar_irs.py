#!/usr/bin/env python3
"""Mantém data/irs.json, os dados da página /tabelas-irs, atualizado sem intervenção.

Fontes oficiais, verificadas várias vezes por dia:
1. Escalões de IRS: artigo 68.º do Código do IRS no Portal das Finanças.
2. Tabelas de retenção na fonte: o feed diário da 2.ª série do Diário da República. Quando sai um
   despacho que aprova tabelas de retenção para o continente, o script abre o PDF, lê as 11 tabelas
   e confirma que batem certo entre si antes de as publicar.
3. Indexante dos apoios sociais (IAS): o feed diário da 1.ª série, para a portaria anual.

Se uma leitura falhar ou os valores não passarem as verificações, ficam os dados anteriores e o
workflow termina com erro, para o GitHub avisar por email.

Dependência: pypdf (pip install pypdf).
Testes locais: python3 atualizar_irs.py --pdf despacho.pdf | --art68 pagina.html
"""
import html, io, json, os, re, subprocess, sys, urllib.parse, urllib.request
from datetime import date

RAIZ = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(RAIZ, "data", "irs.json")
UA = {"User-Agent": "Mozilla/5.0 (compatible; LF-irs/1.0; +https://www.literaciafinanceira.pt)"}
ART68 = "https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68.aspx"
RSS2 = "https://files.diariodarepublica.pt/rss/serie2.xml"
RSS1 = "https://files.diariodarepublica.pt/rss/serie1.xml"
MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"]


def get(url):
    partes = urllib.parse.urlsplit(url)
    url = urllib.parse.urlunsplit(partes._replace(path=urllib.parse.quote(partes.path, safe="/%")))
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
        return r.read()


def n(s):
    return float(re.sub(r"\s", "", s).replace(".", "").replace(",", "."))


# ---------------------------------------------------------------------------
# 1. Escalões (artigo 68.º do CIRS)
# ---------------------------------------------------------------------------
def ler_art68(pagina):
    t = re.sub(r"<[^>]+>", " ", pagina)
    t = html.unescape(t)
    t = re.sub(r"[​‌‍﻿]", "", t)
    t = re.sub(r"\s+", " ", t.replace("\xa0", " "))
    i = t.find("As taxas do imposto são as constantes da tabela seguinte")
    if i < 0:
        raise RuntimeError("artigo 68.º: tabela não encontrada")
    t = t[i:i + 3000]
    linhas = []
    m = re.search(r"Até ([\d ]+?) (\d{1,2},\d{2}) (\d{1,2},\d{3})", t)
    if not m:
        raise RuntimeError("artigo 68.º: primeiro escalão não encontrado")
    linhas.append([n(m.group(1)), n(m.group(2)), m.group(3)])
    for m in re.finditer(r"De mais de ([\d ]+?) até ([\d ]+?) (\d{1,2},\d{2}) (\d{1,2},\d{3})", t):
        if abs(n(m.group(1)) - linhas[-1][0]) > 0.5:
            raise RuntimeError("artigo 68.º: escalões não encadeiam")
        linhas.append([n(m.group(2)), n(m.group(3)), m.group(4)])
    m = re.search(r"Superior a ([\d ]+?) (\d{1,2},\d{2})", t)
    if not m or abs(n(m.group(1)) - linhas[-1][0]) > 0.5:
        raise RuntimeError("artigo 68.º: último escalão não encontrado")
    linhas.append([None, n(m.group(2)), None])
    r = re.search(r"\(Redação d[ao] ([^)]{5,80})\)", t)
    if not (5 <= len(linhas) <= 12) or any(linhas[k][1] <= linhas[k - 1][1] for k in range(1, len(linhas))) \
            or not (5 <= linhas[0][1] <= 25 and 35 <= linhas[-1][1] <= 60) or not (4000 < linhas[0][0] < 20000):
        raise RuntimeError(f"artigo 68.º: valores fora do plausível: {linhas}")
    return {"linhas": linhas, "redacao": r.group(1).strip() if r else ""}


# ---------------------------------------------------------------------------
# 2. Tabelas de retenção (PDF do despacho)
# ---------------------------------------------------------------------------
def ler_despacho(pdf_bytes):
    from pypdf import PdfReader
    t = "\n".join((p.extract_text() or "") for p in PdfReader(io.BytesIO(pdf_bytes)).pages)
    t = re.sub(r"[  -  ]", " ", t).replace("–", "-").replace("−", "-")
    i = t.find("Tabelas de retenção na fonte para o continente")
    if i < 0:
        raise RuntimeError("despacho: secção das tabelas não encontrada")
    preambulo, corpo = t[:i], t[i:]
    partes = re.split(r"Tabela ([IVX]+) — (Trabalho dependente|Pensões)\n", corpo)
    tabelas = []
    for j in range(1, len(partes), 3):
        k, tipo, texto = partes[j], partes[j + 1], partes[j + 2]
        titulo = texto.split("\n")[0].strip()
        linhas = []
        for ln in texto.split("\n"):
            m = re.match(r"(Até|Superior a) ([\d ]+,\d\d) ([\d,]+) % (.+)$", ln)
            if not m:
                continue
            lim = None if m.group(1) == "Superior a" else n(m.group(2))
            taxa, resto = n(m.group(3)), m.group(4)
            f = re.match(r"([\d,]+) % × ([\d,]+) × \(([\d ]+,\d+) - R\) ?(.*)$", resto)
            if f:
                parcela, cauda = [n(f.group(1)), n(f.group(2)), n(f.group(3))], f.group(4)
            else:
                g = re.match(r"([\d ]+,\d\d) (.*)$", resto)
                parcela, cauda = n(g.group(1)), g.group(2)
            c = cauda.replace(" %", "").split(" ")
            adic = None
            if len(c) > 1:
                adic, c = n(c[0]), c[1:]
            linhas.append([lim, taxa, parcela, adic, None if c[0] == "n.a." else n(c[0])])
        tabelas.append({"k": k, "tipo": "A" if tipo.startswith("Trab") else "H", "t": titulo, "r": linhas})
    validar_tabelas(tabelas)
    out = {"tabelas": tabelas}
    m = re.search(r"M[ií]nimo de\s+Exist[êe]ncia para ([\d ]+) ?€", preambulo)
    if m and 8000 < n(m.group(1)) < 40000:
        out["min_existencia"] = n(m.group(1))
    m = re.search(r"vigorarem a partir\s+de (\d{1,2}\.?º? de \w+ de \d{4})", preambulo)
    if m:
        out["inicio"] = m.group(1).replace("1.º", "1")
    m = re.search(r"Despacho n\.º ([\dA-Z\-]+/\d{4})", preambulo)
    if m:
        out["despacho"] = "Despacho n.º " + m.group(1)
    return out


def validar_tabelas(tabelas):
    if [x["k"] for x in tabelas] != ROMANOS:
        raise RuntimeError(f"despacho: esperava as tabelas I a XI, li {[x['k'] for x in tabelas]}")

    def ret(R, l):
        p = l[2][0] / 100 * l[2][1] * (l[2][2] - R) if isinstance(l[2], list) else l[2]
        return R * l[1] / 100 - p
    for T in tabelas:
        r = T["r"]
        if len(r) < 5 or r[-1][0] is not None or r[0][1] != 0:
            raise RuntimeError(f"despacho: tabela {T['k']} incompleta")
        for j in range(len(r) - 1):
            lim = r[j][0]
            if lim is None or (j and lim <= r[j - 1][0]) or r[j + 1][1] < r[j][1] or not (0 <= r[j][1] <= 60):
                raise RuntimeError(f"despacho: tabela {T['k']}, linha {j + 1} fora de ordem")
            a, b = ret(lim, r[j]), ret(lim, r[j + 1])
            if abs(a - b) > 1.0 and not (a <= 0 and b <= 0):
                raise RuntimeError(f"despacho: tabela {T['k']} com salto de {a - b:.2f} EUR aos {lim} EUR")
            ef = max(0, a) / lim * 100
            if r[j][4] is not None and abs(ef - r[j][4]) > 0.06:
                raise RuntimeError(f"despacho: tabela {T['k']}, linha {j + 1}: taxa efetiva {ef:.2f} difere da publicada {r[j][4]}")


def itens_rss(xml):
    for bloco in xml.split("<item>")[1:]:
        tit = re.search(r"<title>(.*?)</title>", bloco, re.S)
        desc = re.search(r"<description[^>]*>\s*(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?\s*</description>", bloco, re.S)
        lnk = re.search(r"<link>\s*(?:<!\[CDATA\[)?\s*(.*?)\s*(?:\]\]>)?\s*</link>", bloco, re.S)
        if tit and lnk:
            yield re.sub(r"\s+", " ", tit.group(1)).strip(), re.sub(r"\s+", " ", desc.group(1) if desc else "").strip(), lnk.group(1).strip()


def data_do_titulo(titulo):
    m = re.search(r"de (\d{4})-(\d{2})-(\d{2})", titulo)
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}" if m else date.today().isoformat()


def procurar_despacho(xml):
    """Devolve (nome, data ISO, url do PDF) do despacho de tabelas de retenção do continente, se saiu hoje."""
    for titulo, desc, url in itens_rss(xml):
        d = desc.lower()
        if "tabelas de retenção na fonte" in d and "continente" in d and "aprova" in d and url.lower().endswith(".pdf"):
            return titulo.split(" - ")[0].strip(), data_do_titulo(titulo), url
        if "tabelas de retenção" in d and "retifica" in d:
            raise RuntimeError(f"saiu uma retificação das tabelas de retenção ({titulo}): rever à mão")
    return None


def procurar_ias(xml):
    for titulo, desc, url in itens_rss(xml):
        if "indexante dos apoios sociais" in desc.lower() and url.lower().endswith(".pdf"):
            from pypdf import PdfReader
            t = re.sub(r"\s+", " ", " ".join((p.extract_text() or "") for p in PdfReader(io.BytesIO(get(url))).pages))
            m = re.search(r"indexante dos apoios sociais[^.]{0,200}?(\d{3},\d{2})", t, re.I)
            a = re.search(r"para o ano de (\d{4})", t)
            if m and 450 < n(m.group(1)) < 900:
                return {"valor": n(m.group(1)), "ano": int(a.group(1)) if a else date.today().year + 1, "fonte": titulo.split(" - ")[0].strip()}
            raise RuntimeError(f"portaria do IAS ({titulo}): valor não lido")
    return None


def publicar(mensagem):
    if not os.environ.get("GITHUB_ACTIONS"):
        return
    git = lambda *a: subprocess.run(["git", "-C", RAIZ, *a], check=False)
    git("config", "user.name", "lf-bot")
    git("config", "user.email", "bot@literaciafinanceira.pt")
    git("add", "-A", "data")
    if subprocess.run(["git", "-C", RAIZ, "diff", "--cached", "--quiet"]).returncode:
        git("commit", "-m", mensagem)
        git("pull", "--rebase")
        git("push")


def main():
    args = sys.argv[1:]
    if "--pdf" in args:
        with open(args[args.index("--pdf") + 1], "rb") as f:
            print(json.dumps(ler_despacho(f.read()), ensure_ascii=False)[:1500])
        return
    if "--art68" in args:
        with open(args[args.index("--art68") + 1], encoding="utf-8") as f:
            print(json.dumps(ler_art68(f.read()), ensure_ascii=False))
        return
    with open(OUT, encoding="utf-8") as f:
        dados = json.load(f)
    antes = json.dumps(dados, sort_keys=True)
    erros = []
    hoje = date.today()

    try:
        dados["escaloes"] = ler_art68(get(ART68).decode("utf-8", errors="replace"))
    except Exception as e:
        erros.append(f"escalões: {e}")
    try:
        novo = procurar_despacho(get(RSS2).decode("utf-8", errors="replace"))
        if novo and novo[2] != dados.get("retencao", {}).get("pdf"):
            lido = ler_despacho(get(novo[2]))
            d = date.fromisoformat(novo[1])
            ret = {"despacho": lido.get("despacho", novo[0]), "data": novo[1], "data_txt": f"{d.day} de {MESES[d.month - 1]}",
                   "pdf": novo[2], "inicio": lido.get("inicio", ""), "tabelas": lido["tabelas"]}
            dados["retencao"] = ret
            if "min_existencia" in lido:
                dados["min_existencia"] = lido["min_existencia"]
            print("Tabelas de retenção novas:", ret["despacho"])
    except Exception as e:
        erros.append(f"retenção: {e}")
    try:
        ias = procurar_ias(get(RSS1).decode("utf-8", errors="replace"))
        if ias:
            dados["ias_seguinte"] = ias
        seg = dados.get("ias_seguinte")
        if seg and hoje.year >= seg["ano"]:
            dados["ias"] = seg["valor"]
            dados.pop("ias_seguinte")
    except Exception as e:
        erros.append(f"IAS: {e}")

    if json.dumps(dados, sort_keys=True) != antes or not erros:
        if not erros:
            dados["verificado"] = hoje.isoformat()
        with open(OUT, "w", encoding="utf-8") as f:
            json.dump(dados, f, ensure_ascii=False, separators=(",", ":"))
    publicar("Tabelas de IRS verificadas")
    for e in erros:
        print("ERRO:", e, file=sys.stderr)
    if erros:
        sys.exit(1)
    print("Tudo verificado:", dados["retencao"]["despacho"], "|", dados["escaloes"]["redacao"])


if __name__ == "__main__":
    main()

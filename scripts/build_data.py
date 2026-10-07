#!/usr/bin/env python3
"""Build the app's JSON data from the Open Scriptures Hebrew Bible (OSHB).

Sources (downloaded into .cache/ on first run):
  * openscriptures/morphhb   – Westminster Leningrad Codex text with lemma
                               (augmented Strong's) and morphology per morpheme.
  * openscriptures/HebrewLexicon
      - LexicalIndex.xml       – Brown-Driver-Briggs (BDB) entries and the root
                                 each entry is listed under.
      - AugIndex.xml           – augmented Strong's -> LexicalIndex entry id.
      - HebrewStrong.xml       – Strong's dictionary with its own derivations.

Output:
  data/books.json            – list of available books.
  data/books/<Book>.json     – chapters -> verses -> tokens.
  data/lexicon.json          – every lemma used, with root opinions.

Usage:
  python3 scripts/build_data.py            # all books
  python3 scripts/build_data.py Ezek Gen   # selected books (lexicon covers only them)
"""
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".cache")
OUT = os.path.join(ROOT, "data")

MORPHHB = "https://raw.githubusercontent.com/openscriptures/morphhb/master/wlc/"
LEXICON = "https://raw.githubusercontent.com/openscriptures/HebrewLexicon/master/"

OSIS = "{http://www.bibletechnologies.net/2003/OSIS/namespace}"
LEX = "{http://openscriptures.github.com/morphhb/namespace}"
STRONG = "{http://www.bibletechnologies.net/2003/OSIS/namespace}"

# Books in the order of the Hebrew canon (Torah, Nevi'im, Ketuvim).
BOOKS = [
    ("Gen", "בראשית", "תורה"), ("Exod", "שמות", "תורה"), ("Lev", "ויקרא", "תורה"),
    ("Num", "במדבר", "תורה"), ("Deut", "דברים", "תורה"),
    ("Josh", "יהושע", "נביאים"), ("Judg", "שופטים", "נביאים"),
    ("1Sam", "שמואל א", "נביאים"), ("2Sam", "שמואל ב", "נביאים"),
    ("1Kgs", "מלכים א", "נביאים"), ("2Kgs", "מלכים ב", "נביאים"),
    ("Isa", "ישעיהו", "נביאים"), ("Jer", "ירמיהו", "נביאים"), ("Ezek", "יחזקאל", "נביאים"),
    ("Hos", "הושע", "נביאים"), ("Joel", "יואל", "נביאים"), ("Amos", "עמוס", "נביאים"),
    ("Obad", "עובדיה", "נביאים"), ("Jonah", "יונה", "נביאים"), ("Mic", "מיכה", "נביאים"),
    ("Nah", "נחום", "נביאים"), ("Hab", "חבקוק", "נביאים"), ("Zeph", "צפניה", "נביאים"),
    ("Hag", "חגי", "נביאים"), ("Zech", "זכריה", "נביאים"), ("Mal", "מלאכי", "נביאים"),
    ("Ps", "תהלים", "כתובים"), ("Prov", "משלי", "כתובים"), ("Job", "איוב", "כתובים"),
    ("Song", "שיר השירים", "כתובים"), ("Ruth", "רות", "כתובים"), ("Lam", "איכה", "כתובים"),
    ("Eccl", "קהלת", "כתובים"), ("Esth", "אסתר", "כתובים"), ("Dan", "דניאל", "כתובים"),
    ("Ezra", "עזרא", "כתובים"), ("Neh", "נחמיה", "כתובים"),
    ("1Chr", "דברי הימים א", "כתובים"), ("2Chr", "דברי הימים ב", "כתובים"),
]

SEPARATORS = {"x-maqqef": "־", "x-paseq": "׀", "x-sof-pasuq": "׃", "x-pe": "פ", "x-samekh": "ס"}

FINALS = str.maketrans("ךםןףץ", "כמנפצ")
SHIN_DOTS = "ׁׂ"


def fetch(url, name):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, name)
    if not os.path.exists(path):
        print("downloading", url, file=sys.stderr)
        with urllib.request.urlopen(url) as r, open(path + ".part", "wb") as f:
            f.write(r.read())
        os.replace(path + ".part", path)
    return path


def consonants(word, keep_shin_dots=True):
    """Strip vowels/accents, keeping letters (and optionally the shin/sin dot)."""
    out = []
    for ch in word:
        if "א" <= ch <= "ת" or (keep_shin_dots and ch in SHIN_DOTS):
            out.append(ch)
    return "".join(out)


def root_key(root):
    """Comparison key: no dots, no final forms."""
    return consonants(root, keep_shin_dots=False).translate(FINALS)


def text_of(el):
    return re.sub(r"\s+", " ", "".join(el.itertext())).strip() if el is not None else ""


# ---------------------------------------------------------------- lexicons

def load_lexical_index():
    tree = ET.parse(fetch(LEXICON + "LexicalIndex.xml", "LexicalIndex.xml"))
    entries = {}
    for part in tree.getroot().iter(LEX + "part"):
        lang = part.get("{http://www.w3.org/XML/1998/namespace}lang")
        for e in part.iter(LEX + "entry"):
            w = e.find(LEX + "w")
            etym = e.find(LEX + "etym")
            entries[e.get("id")] = {
                "w": w.text if w is not None else "",
                "pos": text_of(e.find(LEX + "pos")),
                "def": text_of(e.find(LEX + "def")),
                "lang": lang,
                "etym_type": etym.get("type") if etym is not None else None,
                "etym_root": etym.get("root") if etym is not None else None,
                "etym_ref": (etym.text or "").strip() if etym is not None else "",
            }
    aug = {}
    for w in ET.parse(fetch(LEXICON + "AugIndex.xml", "AugIndex.xml")).getroot().iter(LEX + "w"):
        aug[w.get("aug")] = w.text
    return entries, aug


def load_strong():
    tree = ET.parse(fetch(LEXICON + "HebrewStrong.xml", "HebrewStrong.xml"))
    entries = {}
    for e in tree.getroot().iter():
        if not e.tag.endswith("entry") or not e.get("id", "").startswith("H"):
            continue
        ns = e.tag[: -len("entry")]
        w = e.find(ns + "w")
        source = e.find(ns + "source")
        meaning = e.find(ns + "meaning")
        refs = []
        src_text = ""
        if source is not None:
            # Rebuild the source text, replacing number refs by the Hebrew word.
            parts = [source.text or ""]
            for child in source:
                if child.tag == ns + "w" and child.get("src"):
                    refs.append(child.get("src")[1:])
                    parts.append("{H%s}" % child.get("src")[1:])
                else:
                    parts.append("".join(child.itertext()))
                parts.append(child.tail or "")
            src_text = re.sub(r"\s+", " ", "".join(parts)).strip()
        entries[e.get("id")[1:]] = {
            "w": w.text if w is not None else "",
            "pos": w.get("pos", "") if w is not None else "",
            "lang": w.get("{http://www.w3.org/XML/1998/namespace}lang", "") if w is not None else "",
            "src": src_text,
            "refs": refs,
            "def": text_of(meaning),
        }
    return entries


# ---------------------------------------------------------- root analysis

def bdb_root(entry_id, lex):
    """Follow BDB 'sub' links up to the root entry. Returns (root, path)."""
    path = []
    seen = set()
    cur = entry_id
    while cur and cur in lex and cur not in seen:
        seen.add(cur)
        e = lex[cur]
        path.append({"w": e["w"], "def": e["def"], "pos": e["pos"]})
        if e["etym_root"]:
            return e["etym_root"], path
        if e["etym_type"] == "sub" and e["etym_ref"]:
            cur = e["etym_ref"].split(",")[0].strip()
            continue
        if e["pos"] == "V" or (e["etym_type"] == "main" and not e["pos"]):
            # A verb (or bare root heading) is its own root.
            return consonants(e["w"]), path
        return None, path
    return None, path


UNCERTAIN = re.compile(r"\b(probably|apparently|perhaps|possibly|uncertain)\b", re.I)


def strong_roots(num, strong, depth=0, seen=None):
    """Follow Strong's derivations to primitive roots.

    Returns a list of {"r", "w", "n", "def", "uncertain"} and a note
    ("unused" when Strong's says 'from an unused root', "foreign", ...)."""
    seen = seen or set()
    if num in seen or num not in strong or depth > 8:
        return [], None
    seen.add(num)
    e = strong[num]
    # "(compare X)" points at related words, not at the source of the word.
    src = re.sub(r"\(compare[^)]*\)|\bcompare\b[^;]*", "", e["src"])
    refs = re.findall(r"\{H(\d+)\}", src)
    low = src.lower()
    if "a primitive root" in low or (e["pos"] == "v" and not refs):
        return [{"r": consonants(e["w"]), "w": e["w"], "n": num,
                 "def": short_def(e["def"]), "uncertain": False, "cognate": False}], None
    if not refs:
        if "unused root" in low:
            return [], "unused"
        if "foreign" in low:
            return [], "foreign"
        if "uncertain" in low:
            return [], "uncertain"
        return [], None
    uncertain = bool(UNCERTAIN.search(low))
    cognate = "corresponding" in low
    out = []
    note = None
    for ref in refs:
        roots, n = strong_roots(ref, strong, depth + 1, seen)
        note = note or n
        for r in roots:
            r = dict(r)
            r["uncertain"] = r["uncertain"] or uncertain
            r["cognate"] = r["cognate"] or cognate
            if all(root_key(x["r"]) != root_key(r["r"]) for x in out):
                out.append(r)
    return out, note


def short_def(text, limit=160):
    text = text.strip()
    return text if len(text) <= limit else text[:limit].rsplit(" ", 1)[0] + "…"


def build_lemma(lemma, lex, aug, strong):
    num = re.match(r"\d*", lemma).group(0)
    info = {}
    entry_id = aug.get(lemma)
    if entry_id and entry_id in lex:
        e = lex[entry_id]
        root, path = bdb_root(entry_id, lex)
        info.update({"w": e["w"], "pos": e["pos"], "def": e["def"], "lang": e["lang"]})
        if root and len(root_key(root)) < 2:
            root = None
        info["bdb"] = {"root": root, "path": path[1:]}
    if num and num in strong:
        s = strong[num]
        roots, note = strong_roots(num, strong)
        src = re.sub(r"\{H(\d+)\}", lambda m: "%s (H%s)" % (strong.get(m.group(1), {}).get("w", ""), m.group(1)), s["src"])
        info["strong"] = {"n": num, "w": s["w"], "src": src, "def": short_def(s["def"], 240),
                          "roots": roots, "note": note}
        info.setdefault("w", s["w"])
        info.setdefault("lang", s["lang"])
    return info


# ------------------------------------------------------------------ books

def parse_word(w):
    return [w.text or "", w.get("lemma", ""), w.get("morph", "")]


def parse_book(code):
    tree = ET.parse(fetch(MORPHHB + code + ".xml", code + ".xml"))
    chapters = []
    lemmas = set()
    for ch in tree.getroot().iter(OSIS + "chapter"):
        verses = []
        for v in ch.iter(OSIS + "verse"):
            tokens = []
            for el in v:
                tag = el.tag[len(OSIS):]
                if tag == "w":
                    tok = parse_word(el)
                    if el.get("type") == "x-ketiv":
                        tok.append("")  # separator slot
                        tok.append(None)  # qere slot, filled by the following note
                    tokens.append(tok)
                elif tag == "seg" and tokens:
                    sep = SEPARATORS.get(el.get("type"))
                    if sep:
                        while len(tokens[-1]) < 4:
                            tokens[-1].append("")
                        tokens[-1][3] += sep
                elif tag == "note" and el.get("type") == "variant":
                    rdg = el.find(".//" + OSIS + "rdg")
                    if rdg is not None:
                        qere = [parse_word(w) for w in rdg.iter(OSIS + "w")]
                        if not tokens or len(tokens[-1]) < 5 or tokens[-1][4] is not None:
                            # Qere without ketiv: an empty written word.
                            tokens.append(["", "", "", "", None])
                        tokens[-1][4] = qere
                        for q in qere:
                            lemmas.add(q[1])
            for t in tokens:
                lemmas.add(t[1])
                while len(t) > 3 and not t[-1]:
                    t.pop()
            verses.append(tokens)
        chapters.append(verses)
    return chapters, lemmas


def main_lemmas(lemma_attr):
    """'c/l/1234 a' -> prefixes ['c','l'], main '1234a'."""
    parts = lemma_attr.replace(" ", "").replace("+", "").split("/")
    return parts


def main():
    wanted = sys.argv[1:] or [b[0] for b in BOOKS]
    lex, aug = load_lexical_index()
    strong = load_strong()
    os.makedirs(os.path.join(OUT, "books"), exist_ok=True)

    all_lemmas = set()
    books_meta = []
    for code, name, section in BOOKS:
        if code not in wanted:
            continue
        chapters, lemmas = parse_book(code)
        all_lemmas |= lemmas
        with open(os.path.join(OUT, "books", code + ".json"), "w", encoding="utf-8") as f:
            json.dump({"code": code, "name": name, "chapters": chapters},
                      f, ensure_ascii=False, separators=(",", ":"))
        books_meta.append({"code": code, "name": name, "section": section,
                           "chapters": len(chapters)})
        print(code, len(chapters), "chapters", file=sys.stderr)

    lexicon = {}
    for lemma_attr in all_lemmas:
        for part in main_lemmas(lemma_attr):
            if part and part not in lexicon:
                lexicon[part] = build_lemma(part, lex, aug, strong)

    with open(os.path.join(OUT, "lexicon.json"), "w", encoding="utf-8") as f:
        json.dump(lexicon, f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    with open(os.path.join(OUT, "books.json"), "w", encoding="utf-8") as f:
        json.dump(books_meta, f, ensure_ascii=False, indent=1)
    print(len(lexicon), "lexicon entries", file=sys.stderr)


if __name__ == "__main__":
    main()

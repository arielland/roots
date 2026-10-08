// שורשים – commentaries (מפרשים) and targumim, loaded live from the Sefaria API.
// Nothing here is stored in the repository: texts are fetched by the browser and
// shown with their version title, license and a link back to Sefaria.
(function () {
  const API = "https://www.sefaria.org/api/";
  const SITE = "https://www.sefaria.org/";

  // Our book codes (OSIS, as in data/books.json) → Sefaria index titles.
  const TITLES = {
    Gen: "Genesis", Exod: "Exodus", Lev: "Leviticus", Num: "Numbers", Deut: "Deuteronomy",
    Josh: "Joshua", Judg: "Judges", "1Sam": "I Samuel", "2Sam": "II Samuel", "1Kgs": "I Kings", "2Kgs": "II Kings",
    Isa: "Isaiah", Jer: "Jeremiah", Ezek: "Ezekiel", Hos: "Hosea", Joel: "Joel", Amos: "Amos", Obad: "Obadiah",
    Jonah: "Jonah", Mic: "Micah", Nah: "Nahum", Hab: "Habakkuk", Zeph: "Zephaniah", Hag: "Haggai",
    Zech: "Zechariah", Mal: "Malachi", Ps: "Psalms", Prov: "Proverbs", Job: "Job", Song: "Song of Songs",
    Ruth: "Ruth", Lam: "Lamentations", Eccl: "Ecclesiastes", Esth: "Esther", Dan: "Daniel", Ezra: "Ezra",
    Neh: "Nehemiah", "1Chr": "I Chronicles", "2Chr": "II Chronicles",
  };

  // Commentators shown first (by Sefaria's collective title); everything else follows.
  const PREFERRED = [
    "Rashi", "Onkelos", "Targum Jonathan", "Targum Jonathan on Torah", "Aramaic Targum",
    "Ramban", "Ibn Ezra", "Radak", "Metzudat David", "Metzudat Zion", "Malbim", "Malbim Beur Hamilot",
    "Ralbag", "Abarbanel", "Sforno", "Rashbam", "Or HaChaim", "Steinsaltz",
  ];
  // Commentaries that explain single words – shown in the word panel when the heading matches.
  const WORD_COMMENTARIES = ["Metzudat Zion", "Rashi", "Radak"];

  const linksCache = new Map(); // "Ezekiel.1" → Promise<groups>
  const textCache = new Map(); // ref → Promise<{texts, version}>

  const refUrl = (ref) => encodeURIComponent(ref.replace(/ /g, "_"));
  const sefariaLink = (ref) => SITE + refUrl(ref) + "?lang=he";
  const chapterRef = (code, ch) => TITLES[code] + "." + (ch + 1);
  const verseRef = (code, ch, v) => TITLES[code] + "." + (ch + 1) + "." + (v + 1);

  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Sefaria " + res.status);
    const data = await res.json();
    if (data && data.error) throw new Error(data.error);
    return data;
  }

  /** Verse numbers (1-based) in `ch1` covered by an anchor like "Ezekiel 1:3", "Ezekiel 1:3-5" or "Genesis 1:31-2:3". */
  function anchorVerses(anchor, ch1) {
    const m = String(anchor || "").match(/(\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/);
    if (!m) return [];
    const c1 = +m[1], v1 = +m[2], c2 = m[3] ? +m[3] : c1, v2 = m[4] ? +m[4] : v1;
    if (c1 !== ch1) return c2 === ch1 ? range(1, v2) : [];
    return c2 === c1 ? range(v1, v2) : range(v1, v1 + 200);
  }
  const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);

  /** Trailing numbers of a ref, for ordering comments ("Rashi on Ezekiel 1:1:2" → [1,1,2]). */
  const refNums = (ref) => (String(ref).match(/[\d:]+(?:-[\d:]+)?$/) || [""])[0].split("-")[0].split(":").map(Number);
  function cmpRefs(a, b) {
    const x = refNums(a), y = refNums(b);
    for (let i = 0; i < Math.max(x.length, y.length); i++) {
      if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
    }
    return 0;
  }

  /**
   * Commentaries and targumim on a chapter, grouped by work:
   * [{id, en, he, category, verses: {1: [ref, …], …}}], preferred commentators first.
   */
  function chapterLinks(code, ch) {
    const key = chapterRef(code, ch);
    if (!linksCache.has(key)) {
      const p = getJSON(API + "links/" + refUrl(key) + "?with_text=0").then((links) => {
        const groups = new Map();
        for (const l of Array.isArray(links) ? links : []) {
          if (l.category !== "Commentary" && l.category !== "Targum") continue;
          const id = l.index_title || (l.collectiveTitle && l.collectiveTitle.en);
          if (!id || !l.ref) continue;
          let g = groups.get(id);
          if (!g) {
            const ct = l.collectiveTitle || {};
            g = { id, en: ct.en || id, he: ct.he || ct.en || id, category: l.category, verses: {} };
            groups.set(id, g);
          }
          for (const v of anchorVerses(l.anchorRef, ch + 1)) {
            const list = g.verses[v] || (g.verses[v] = []);
            if (!list.includes(l.ref)) list.push(l.ref);
          }
        }
        const rank = (g) => {
          const i = PREFERRED.indexOf(g.en);
          return i >= 0 ? i : PREFERRED.length + (g.category === "Targum" ? 0 : 1);
        };
        const out = [...groups.values()].filter((g) => Object.keys(g.verses).length);
        for (const g of out) for (const v in g.verses) g.verses[v].sort(cmpRefs);
        // Same Hebrew name for two works (e.g. two Targum editions): add the English title.
        const seen = {};
        for (const g of out) seen[g.he] = (seen[g.he] || 0) + 1;
        for (const g of out) if (seen[g.he] > 1) g.he += " (" + g.id + ")";
        return out.sort((a, b) => rank(a) - rank(b) || a.he.localeCompare(b.he, "he"));
      });
      p.catch(() => linksCache.delete(key)); // allow a retry after a network error
      linksCache.set(key, p);
    }
    return linksCache.get(key);
  }

  const flatten = (t) => (Array.isArray(t) ? t.flatMap(flatten) : t ? [t] : []);

  /** Hebrew text of a ref: {texts: [html, …], version: {title, license, source}}. */
  function textOf(ref) {
    if (!textCache.has(ref)) {
      const p = getJSON(API + "v3/texts/" + refUrl(ref) + "?version=hebrew")
        .then((d) => {
          const ver = (d.versions || [])[0];
          if (!ver) throw new Error("no Hebrew version");
          return { texts: flatten(ver.text), version: { title: ver.versionTitle, license: ver.license, source: ver.versionSource } };
        })
        // Fallback to the older texts API.
        .catch(() => getJSON(API + "texts/" + refUrl(ref) + "?context=0&commentary=0").then((d) => ({
          texts: flatten(d.he),
          version: { title: d.heVersionTitle, license: d.heLicense, source: d.heVersionSource },
        })));
      p.catch(() => textCache.delete(ref));
      textCache.set(ref, p);
    }
    return textCache.get(ref);
  }

  /** All comments of one work on one verse, in order. */
  async function verseComments(group, v1) {
    const refs = group.verses[v1] || [];
    const results = await Promise.all(refs.map((r) => textOf(r).then((t) => ({ ref: r, ...t }), () => ({ ref: r, texts: [], failed: true }))));
    return results;
  }

  // ------------------------------------------------------------ sanitising

  const KEEP = new Set(["B", "STRONG", "I", "EM", "BR", "SMALL", "BIG", "SUP", "SUB"]);

  /** Sefaria texts contain HTML: keep basic formatting only, drop footnotes, links and attributes. */
  function sanitize(html) {
    const tpl = document.createElement("template");
    tpl.innerHTML = String(html);
    const walk = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) continue;
        if (child.nodeType !== 1) { child.remove(); continue; }
        const tag = child.tagName;
        if ((tag === "I" && child.classList.contains("footnote")) || (tag === "SUP" && child.classList.contains("footnote-marker")) ||
            tag === "SCRIPT" || tag === "STYLE") {
          child.remove();
          continue;
        }
        walk(child);
        if (KEEP.has(tag)) {
          for (const a of [...child.attributes]) child.removeAttribute(a.name);
        } else {
          child.replaceWith(...child.childNodes);
        }
      }
    };
    walk(tpl.content);
    const div = document.createElement("div");
    div.appendChild(tpl.content);
    return div.innerHTML;
  }

  // ------------------------------------------------------------ matching a word to a comment heading

  const NON_LETTERS = /[^א-ת\s]/g;
  const plain = (s) => s.replace(/[֑-ׇ]/g, "").replace(/[־]/g, " ").replace(NON_LETTERS, "").trim();
  const FINALS = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
  const norm = (w) => w.replace(/[ךםןףץ]/g, (c) => FINALS[c]).replace(/[וי]/g, ""); // ignore matres lectionis

  /** The heading (דיבור המתחיל) of a comment: its bold opening, or the text up to the first period. */
  function heading(html) {
    const m = String(html).match(/^\s*<(b|strong)>([\s\S]*?)<\/\1>/i);
    if (m) return plain(m[2].replace(/<[^>]*>/g, ""));
    const t = String(html).replace(/<[^>]*>/g, "");
    const dot = t.indexOf(".");
    return dot > 0 && dot < 60 ? plain(t.slice(0, dot)) : "";
  }

  /** Does a comment heading quote `forms` (the word as written, with and without its prefixes)? */
  function headingMatches(head, forms) {
    if (!head) return false;
    const words = head.split(/\s+/).filter(Boolean).map(norm);
    return forms.some((f) => f && words.includes(norm(f)));
  }

  window.Sefaria = {
    TITLES, WORD_COMMENTARIES, chapterLinks, verseComments, textOf, sanitize, heading, headingMatches, plain,
    sefariaLink, verseRef, chapterRef,
  };
})();

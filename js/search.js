// Word search and root search across a book or the whole Tanakh.
(function () {
  const $ = (id) => document.getElementById(id);
  const PAGE = 200;
  const FINALS = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
  const NIQQUD = /[ְ-ׇּׁׂ]/;
  const TEAMIM = /[֑-ֽׅ֯ׄ]/g;

  const POS = {
    V: "פועל", N: "שם עצם", A: "שם תואר", Np: "שם פרטי", R: "מילת יחס", D: "תואר הפועל",
    C: "מילת חיבור", Pp: "כינוי גוף", Pd: "כינוי רמז", Pi: "כינוי שאלה", Pr: "כינוי זיקה",
    Ti: "מילת שאלה", Tn: "מילת שלילה", Tj: "מילת קריאה", Tm: "מילת הצבעה", Ta: "מילת חיזוק",
  };

  /** Consonants only, final letters normalised. */
  function letters(text) {
    let out = "";
    for (const ch of text) {
      if (ch >= "א" && ch <= "ת") out += FINALS[ch] || ch;
    }
    return out;
  }
  /** Pointed text without accents or morpheme separators, for exact matching. */
  function pointed(text) {
    return text.replace(/\//g, "").replace(TEAMIM, "").normalize("NFC");
  }

  /** Iterate every analysable word in a book: {ch, v, i, q, word}. */
  function* wordsOf(book, chapters) {
    const list = chapters || book.chapters.map((_, c) => c);
    for (const ch of list) {
      const verses = book.chapters[ch];
      for (let v = 0; v < verses.length; v++) {
        const tokens = verses[v];
        for (let i = 0; i < tokens.length; i++) {
          const tok = tokens[i];
          if (tok[4]) {
            for (let q = 0; q < tok[4].length; q++) yield { ch, v, i, q, word: tok[4][q] };
          } else if (tok[0]) {
            yield { ch, v, i, q: -1, word: tok };
          }
        }
      }
    }
  }

  // root key -> [main lemma ids], built once from the lexicon.
  let rootIndex = null;
  function getRootIndex() {
    if (rootIndex) return rootIndex;
    rootIndex = new Map();
    for (const [lemma, entry] of Object.entries(App.state.lexicon)) {
      for (const r of Roots.rootOpinions(entry, "").roots) {
        if (!rootIndex.has(r.key)) rootIndex.set(r.key, []);
        rootIndex.get(r.key).push(lemma);
      }
    }
    return rootIndex;
  }

  async function booksInScope(scope, onProgress) {
    const st = App.state;
    if (scope !== "all") return [st.book];
    let done = 0;
    return Promise.all(st.books.map((b) => App.loadBook(b.code).then((book) => {
      onProgress(++done, st.books.length);
      return book;
    })));
  }

  // ------------------------------------------------------------ rendering

  function verseHTML(book, ch, v, marks) {
    const tokens = book.chapters[ch][v];
    const out = [];
    tokens.forEach((tok, i) => {
      const words = tok[4] ? tok[4].map((w, q) => [w, q]) : tok[0] ? [[tok, -1]] : [];
      words.forEach(([w, q]) => {
        const t = App.esc(App.clean(w[0]));
        out.push(marks.has(i + ":" + q) ? "<mark>" + t + "</mark>" : t);
        out.push(" ");
      });
      if (tok[3] && tok[3].includes("־") && out.length) out[out.length - 1] = "־";
    });
    return out.join("");
  }

  function resultsHTML(hits, limit) {
    // Group hits by verse so a verse with two matches is listed once.
    const groups = [];
    const byKey = new Map();
    for (const h of hits) {
      const key = h.book.code + "." + h.ch + "." + h.v;
      let g = byKey.get(key);
      if (!g) {
        g = { book: h.book, ch: h.ch, v: h.v, marks: new Set(), first: h };
        byKey.set(key, g);
        groups.push(g);
      }
      g.marks.add(h.i + ":" + h.q);
    }
    const shown = groups.slice(0, limit);
    const html = shown.map((g) =>
      '<li class="result" data-book="' + g.book.code + '" data-ch="' + g.ch + '" data-v="' + g.v +
      '" data-i="' + g.first.i + '" data-q="' + g.first.q + '" tabindex="0">' +
      '<span class="ref">' + App.esc(g.book.name + " " + App.hebNum(g.ch + 1) + ", " + App.hebNum(g.v + 1)) + "</span>" +
      '<span class="verse">' + verseHTML(g.book, g.ch, g.v, g.marks) + "</span></li>").join("");
    return { html: '<ol class="results">' + html + "</ol>", verses: groups.length, shown: shown.length };
  }

  function bookCountsHTML(hits) {
    const counts = new Map();
    for (const h of hits) counts.set(h.book, (counts.get(h.book) || 0) + 1);
    if (counts.size < 2) return "";
    return '<div class="chips">' + [...counts].map(([b, n]) =>
      '<span class="chip static">' + App.esc(b.name) + " <b>" + n + "</b></span>").join("") + "</div>";
  }

  let current = { hits: [], limit: PAGE };

  function renderHits(prefixHTML) {
    const { hits, limit, filter } = current;
    const list = filter ? hits.filter(filter) : hits;
    const r = resultsHTML(list, limit);
    let more = "";
    if (r.shown < r.verses) {
      more = '<button type="button" class="more" id="search-more">הצגת עוד (' + (r.verses - r.shown) + " פסוקים)</button>";
    }
    $("search-results").innerHTML = (prefixHTML || current.prefix || "") +
      (list.length ? r.html + more : '<p class="muted">לא נמצאו תוצאות.</p>');
    if (prefixHTML) current.prefix = prefixHTML;
    const btn = $("search-more");
    if (btn) btn.addEventListener("click", () => { current.limit += PAGE; renderHits(); });
  }

  // ------------------------------------------------------------ word search

  async function searchWord(query, scope, match) {
    const withVowels = NIQQUD.test(query);
    const qLetters = letters(query);
    const qPointed = pointed(query.trim());
    if (!qLetters) return status("יש להקליד מילה בעברית.");
    const books = await booksInScope(scope, progress);
    const hits = [];
    for (const book of books) {
      for (const w of wordsOf(book)) {
        const text = w.word[0];
        let ok;
        if (match === "part") {
          ok = withVowels ? pointed(text).includes(qPointed) : letters(text).includes(qLetters);
        } else {
          // Whole word, or the word after its prefixes (ו, ה, בכל"ם…).
          const parts = text.split("/");
          const prefixCount = Math.max(0, w.word[1].split("/").length - 1);
          const base = parts.slice(prefixCount).join("");
          ok = withVowels
            ? pointed(text) === qPointed || pointed(base) === qPointed
            : letters(text) === qLetters || letters(base) === qLetters;
        }
        if (ok) hits.push(Object.assign({ book }, w));
      }
    }
    current = { hits, limit: PAGE };
    status("נמצאו " + hits.length + " מופעים" + (scope === "all" ? " בתנ\"ך" : " בספר " + App.state.book.name) + ".");
    renderHits(bookCountsHTML(hits));
  }

  // ------------------------------------------------------------ root search

  async function searchRoot(query, scope) {
    const key = Roots.rootKey(query);
    if (key.length < 2) return status("יש להקליד שורש בן שתיים או שלוש אותיות, למשל: שמר או ש-מ-ר.");
    const lemmas = getRootIndex().get(key);
    if (!lemmas) {
      status("");
      $("search-results").innerHTML = '<p class="muted">השורש ' + App.esc(Roots.displayRoot(query)) +
        " לא נמצא במילונים. נסו לחפש אותו כ\"חיפוש מילה\".</p>";
      return;
    }
    const lemmaSet = new Set(lemmas);
    const books = await booksInScope(scope, progress);
    const hits = [];
    for (const book of books) {
      for (const w of wordsOf(book)) {
        if (!w.word[1]) continue;
        const main = App.mainLemmaOf(w.word[1]);
        if (!lemmaSet.has(main)) continue;
        const a = Morph.analyzeWord(w.word[0], w.word[1], w.word[2]);
        hits.push(Object.assign({ book, lemma: main, stem: a.main.kind === "verb" ? a.main.stem : null }, w));
      }
    }

    // Header: the root, its weak classes, derived words and binyan counts.
    const lex = App.state.lexicon;
    const spelled = lemmas.map((l) => Roots.rootOpinions(lex[l], "").roots.find((r) => r.key === key).root)
      .sort((a, b) => b.length - a.length)[0];
    const h = ['<div class="card root-summary"><div class="root-letters">' + App.esc(Roots.displayRoot(spelled)) + "</div>"];
    h.push('<ul class="gizra">' + Roots.gizrot(spelled).map(([n, e]) => "<li><b>" + App.esc(n) + ":</b> " + App.esc(e) + "</li>").join("") + "</ul>");

    const lemmaCounts = new Map();
    const stemCounts = new Map();
    for (const hit of hits) {
      lemmaCounts.set(hit.lemma, (lemmaCounts.get(hit.lemma) || 0) + 1);
      if (hit.stem) stemCounts.set(hit.stem, (stemCounts.get(hit.stem) || 0) + 1);
    }
    h.push("<h3>מילים מהשורש</h3><div class=\"chips\">");
    h.push('<button type="button" class="chip active" data-filter="">הכול <b>' + hits.length + "</b></button>");
    const absent = lemmas.filter((l) => !lemmaCounts.get(l));
    for (const l of lemmas.filter((x) => lemmaCounts.get(x)).sort((a, b) => lemmaCounts.get(b) - lemmaCounts.get(a))) {
      const e = lex[l];
      const n = lemmaCounts.get(l);
      const pos = POS[e.pos] || POS[(e.pos || "")[0]] || "";
      h.push('<button type="button" class="chip" data-filter="lemma:' + App.esc(l) + '"' +
        ' title="' + App.esc(e.def || "") + '"><span class="heb-inline">' + App.esc(e.w) + "</span> " +
        '<span class="muted">' + App.esc(pos) + "</span> <b>" + n + "</b></button>");
    }
    h.push("</div>");
    if (absent.length) {
      h.push('<p class="muted">מילים נוספות מהשורש שאינן מופיעות ' + (scope === "all" ? "בטקסט" : "בספר זה") + ": " +
        absent.map((l) => '<span class="heb-inline">' + App.esc(lex[l].w) + "</span>").join(", ") + "</p>");
    }
    if (stemCounts.size) {
      h.push("<h3>הפועל לפי בניינים</h3><div class=\"chips\">");
      for (const [stem, n] of [...stemCounts].sort((a, b) => b[1] - a[1])) {
        h.push('<button type="button" class="chip" data-filter="stem:' + App.esc(stem) + '">' + App.esc(stem) + " <b>" + n + "</b></button>");
      }
      h.push("</div>");
    }
    h.push("</div>");

    current = { hits, limit: PAGE };
    status("נמצאו " + hits.length + " מילים מהשורש " + Roots.displayRoot(spelled) +
      (scope === "all" ? " בתנ\"ך" : " בספר " + App.state.book.name) + ".");
    renderHits(h.join("") + bookCountsHTML(hits));
  }

  function onChipClick(e) {
    const chip = e.target.closest(".chip[data-filter]");
    if (!chip) return false;
    const f = chip.dataset.filter;
    document.querySelectorAll("#search-results .chip[data-filter]").forEach((c) => c.classList.toggle("active", c === chip));
    const [kind, val] = f.split(":");
    current.filter = !f ? null : kind === "lemma" ? (h) => h.lemma === val : (h) => h.stem === val;
    current.limit = PAGE;
    current.prefix = $("search-results").querySelector(".root-summary").outerHTML +
      (bookCountsHTML(current.hits) || "");
    renderHits();
    return true;
  }

  // ------------------------------------------------------------ wiring

  function status(text) {
    $("search-status").textContent = text;
  }
  function progress(done, total) {
    status("טוען את ספרי התנ\"ך… " + done + "/" + total);
  }

  function mode() {
    return document.querySelector('#search-form input[name="mode"]:checked').value;
  }

  function updateModeUI() {
    const m = mode();
    $("search-q").placeholder = m === "root" ? "הקלידו שורש, למשל: שמר" : "הקלידו מילה, למשל: מלך";
    document.querySelectorAll("#search-form .word-only").forEach((el) => { el.hidden = m !== "word"; });
    $("search-hint").textContent = m === "root"
      ? "החיפוש מוצא את כל המילים שנגזרות מהשורש (לפי BDB או סטרונג), בכל הבניינים והנטיות."
      : "ניתן להקליד עם ניקוד (התאמה מדויקת לניקוד) או בלי ניקוד.";
  }

  let busy = false;
  async function run() {
    const q = $("search-q").value.trim();
    if (!q || busy) return;
    busy = true;
    $("search-results").innerHTML = "";
    status("מחפש…");
    try {
      const params = new URLSearchParams({ q, m: mode(), s: $("search-scope").value });
      history.replaceState(null, "", "#search?" + params);
      if (mode() === "root") await searchRoot(q, $("search-scope").value);
      else await searchWord(q, $("search-scope").value, $("search-match").value);
    } catch (err) {
      status("שגיאה: " + err.message);
    } finally {
      busy = false;
    }
  }

  function restoreFromHash() {
    const m = location.hash.match(/^#search\?(.*)$/);
    if (!m) return false;
    const p = new URLSearchParams(m[1]);
    if (!p.get("q")) return false;
    $("search-q").value = p.get("q");
    const radio = document.querySelector('#search-form input[name="mode"][value="' + (p.get("m") === "root" ? "root" : "word") + '"]');
    radio.checked = true;
    $("search-scope").value = p.get("s") === "all" ? "all" : "book";
    updateModeUI();
    return true;
  }

  function bind() {
    $("search-form").addEventListener("submit", (e) => { e.preventDefault(); run(); });
    document.querySelectorAll('#search-form input[name="mode"]').forEach((r) => r.addEventListener("change", updateModeUI));
    const results = $("search-results");
    const open = (li) => App.goToWord(li.dataset.book, +li.dataset.ch, +li.dataset.v, +li.dataset.i, +li.dataset.q);
    results.addEventListener("click", (e) => {
      if (onChipClick(e)) return;
      const li = e.target.closest(".result");
      if (li) open(li);
    });
    results.addEventListener("keydown", (e) => {
      const li = e.target.closest(".result");
      if (li && e.key === "Enter") open(li);
    });
    document.addEventListener("roots:view", (e) => {
      if (e.detail !== "search") return;
      if (restoreFromHash() && !$("search-results").innerHTML) run();
      else if (!$("search-q").value) $("search-q").focus();
    });
    updateModeUI();
  }

  /** Search for a root from elsewhere in the app (e.g. the word panel). */
  function openRoot(root) {
    App.setView("search");
    document.querySelector('#search-form input[name="mode"][value="root"]').checked = true;
    updateModeUI();
    $("search-q").value = root;
    run();
  }

  bind();
  window.Search = { wordsOf, getRootIndex, letters, openRoot, POS };
})();

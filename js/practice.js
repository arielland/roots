// Exercises generated from the biblical text: root, binyan, tense, person/gender/number.
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => App.esc(s);

  const TYPES = {
    root: "מה השורש של המילה המסומנת?",
    binyan: "באיזה בניין הפועל המסומן?",
    tense: "מה הזמן / הצורה של הפועל המסומן?",
    pgn: "מה הגוף, המין והמספר של הפועל המסומן?",
  };
  const MAIN_BINYANIM = ["קַל", "נִפְעַל", "פִּעֵל", "פֻּעַל", "הִפְעִיל", "הֻפְעַל", "הִתְפַּעֵל"];
  const TENSES = ["עבר", "עתיד", "עתיד מהופך (וַיִּקְטֹל)", "עבר מהופך (וְקָטַל)", "ציווי", "בינוני פועל", "מקור נטוי", "מקור מוחלט"];
  const FINITE = "pqiwhjv";
  const PGN_PERSONS = ["גוף ראשון", "גוף שני", "גוף שלישי"];
  const PGN_GENDERS = ["זכר", "נקבה"];
  const PGN_NUMBERS = ["יחיד", "רבים"];
  const WEAK_SWAPS = ["י", "ו", "נ", "ה", "א"];

  const session = { correct: 0, total: 0, streak: 0 };
  let stats = loadStats();
  let pool = [];
  let poolKey = "";
  let question = null;

  function loadStats() {
    try { return JSON.parse(localStorage.getItem("roots-practice") || "{}"); } catch (e) { return {}; }
  }
  function saveStats() {
    try { localStorage.setItem("roots-practice", JSON.stringify(stats)); } catch (e) { /* ignore */ }
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ------------------------------------------------------------ candidates

  /** Which exercise types a word supports. */
  function typesFor(item) {
    const t = [];
    const main = item.analysis.main;
    const content = main.kind === "verb" || main.kind === "adjective" || (main.kind === "noun" && main.code[1] !== "p");
    if (content && item.roots.some((r) => r.key.length === 3)) t.push("root");
    if (main.kind === "verb" && item.analysis.lang === "H") {
      const conj = main.code[2];
      t.push("tense");
      if (MAIN_BINYANIM.includes(main.stem)) t.push("binyan");
      if (FINITE.includes(conj) && main.code.length >= 6) t.push("pgn");
    }
    return t;
  }

  function buildPool() {
    const st = App.state;
    const source = $("practice-source").value;
    const key = st.book.code + ":" + (source === "chapter" ? st.chapter : "*");
    if (key === poolKey && pool.length) return;
    poolKey = key;
    pool = [];
    const chapters = source === "chapter" ? [st.chapter] : null;
    for (const w of Search.wordsOf(st.book, chapters)) {
      const [text, lemma, morph] = w.word;
      if (!lemma || !morph) continue;
      const analysis = Morph.analyzeWord(text, lemma, morph);
      const entry = st.lexicon[analysis.mainLemma];
      const roots = Roots.rootOpinions(entry, analysis.main.code).roots;
      const item = { book: st.book, ...w, analysis, roots };
      item.types = typesFor(item);
      if (item.types.length) pool.push(item);
    }
    shuffle(pool);
  }

  // ------------------------------------------------------------ questions

  function rootOptions(item) {
    const correctKeys = new Set(item.roots.map((r) => r.key));
    const correct = item.roots.find((r) => r.key.length === 3);
    const options = new Map([[correct.key, correct.root]]);
    const add = (root) => {
      const k = Roots.rootKey(root);
      if (k.length === 3 && !correctKeys.has(k) && !options.has(k)) options.set(k, root);
    };
    // Weak-letter look-alikes: the classic confusion (ישב / שוב / נשב…).
    const L = [...correct.key];
    const variants = [];
    for (let pos = 0; pos < 3; pos++) {
      for (const s of WEAK_SWAPS) {
        if (L[pos] === s) continue;
        const v = L.slice();
        v[pos] = s;
        variants.push(v.join(""));
      }
    }
    // Prefer look-alikes that are real roots.
    const index = Search.getRootIndex();
    const real = shuffle(variants.filter((v) => index.has(v)));
    const fake = shuffle(variants.filter((v) => !index.has(v)));
    for (const v of real.concat(fake)) {
      if (options.size >= 4) break;
      if (options.size < 3 || real.includes(v)) add(v);
    }
    // Fill with roots of other words in the same text.
    for (const other of shuffle(pool.slice(0, 60))) {
      if (options.size >= 4) break;
      const r = other.roots.find((x) => x.key.length === 3);
      if (r) add(r.root);
    }
    return { options: shuffle([...options.entries()].map(([k, r]) => ({ key: k, label: Roots.displayRoot(r) }))), answer: correct.key, accept: correctKeys };
  }

  function listOptions(correct, all) {
    const others = shuffle(all.filter((x) => x !== correct)).slice(0, 3);
    const options = shuffle([correct, ...others]).map((x) => ({ key: x, label: x }));
    return { options, answer: correct, accept: new Set([correct]) };
  }

  function tenseLabel(main) {
    const c = main.code[2];
    return { p: "עבר", q: "עבר מהופך (וְקָטַל)", i: "עתיד", w: "עתיד מהופך (וַיִּקְטֹל)", h: "עתיד", j: "עתיד",
      v: "ציווי", r: "בינוני פועל", s: "בינוני פעול", a: "מקור מוחלט", c: "מקור נטוי" }[c];
  }

  function pgnLabel(main) {
    // details: ["בניין …", conj, person, gender, number]
    return main.details.slice(2).join(", ");
  }

  function pgnOptions(main) {
    const correct = pgnLabel(main);
    const all = [];
    // First person has no gender distinction in Hebrew verbs.
    for (const p of PGN_PERSONS.slice(1)) for (const g of PGN_GENDERS) for (const n of PGN_NUMBERS) all.push(p + ", " + g + ", " + n);
    all.push("גוף ראשון, משותף (זכר ונקבה), יחיד", "גוף ראשון, משותף (זכר ונקבה), רבים", "גוף שלישי, משותף (זכר ונקבה), רבים");
    // Prefer distractors that differ in one feature only.
    const parts = correct.split(", ");
    const near = all.filter((x) => x !== correct && x.split(", ").filter((p, i) => p === parts[i]).length === 2);
    const others = shuffle(near).slice(0, 3);
    while (others.length < 3) {
      const x = pick(all);
      if (x !== correct && !others.includes(x)) others.push(x);
    }
    return { options: shuffle([correct, ...others]).map((x) => ({ key: x, label: x })), answer: correct, accept: new Set([correct]) };
  }

  function nextQuestion() {
    buildPool();
    let type = $("practice-type").value;
    if (type === "mixed") {
      // Pick the type first, so noun-heavy texts don't yield only root questions.
      const available = Object.keys(TYPES).filter((t) => pool.some((it) => it.types.includes(t)));
      if (available.length) type = pick(available);
    }
    const candidates = pool.filter((it) => it.types.includes(type));
    if (!candidates.length) {
      $("practice-card").innerHTML = '<p class="muted">אין בטקסט שנבחר מילים מתאימות לתרגיל זה. נסו לבחור "הספר הנוכחי" או סוג תרגיל אחר.</p>';
      return;
    }
    // Rotate through the pool so words don't repeat too soon.
    const item = candidates[(session.total * 7 + Math.floor(Math.random() * 5)) % candidates.length];
    const qType = type;
    const main = item.analysis.main;
    let q;
    if (qType === "root") q = rootOptions(item);
    else if (qType === "binyan") q = listOptions(main.stem, MAIN_BINYANIM);
    else if (qType === "tense") q = listOptions(tenseLabel(main), TENSES.includes(tenseLabel(main)) ? TENSES : TENSES.concat(tenseLabel(main)));
    else q = pgnOptions(main);
    question = Object.assign({ item, type: qType, answered: false }, q);
    renderQuestion();
  }

  // ------------------------------------------------------------ rendering

  function contextHTML(item) {
    const tokens = item.book.chapters[item.ch][item.v];
    const out = [];
    tokens.forEach((tok, i) => {
      const words = tok[4] ? tok[4].map((w, q) => [w, q]) : tok[0] ? [[tok, -1]] : [];
      words.forEach(([w, q]) => {
        const t = esc(App.clean(w[0]));
        out.push(i === item.i && q === item.q ? '<mark class="target">' + t + "</mark>" : t);
        out.push(" ");
      });
      if (tok[3] && tok[3].includes("־") && out.length) out[out.length - 1] = "־";
    });
    return out.join("");
  }

  function renderQuestion() {
    const { item, type, options } = question;
    const ref = item.book.name + " " + App.hebNum(item.ch + 1) + ", " + App.hebNum(item.v + 1);
    $("practice-card").innerHTML =
      '<div class="q-type">' + esc(TYPES[type]) + "</div>" +
      '<p class="q-verse">' + contextHTML(item) + "</p>" +
      '<div class="q-ref muted">' + esc(ref) + "</div>" +
      '<div class="q-word">' + esc(App.clean(item.word[0])) + "</div>" +
      '<div class="options-grid">' + options.map((o, n) =>
        '<button type="button" class="option' + (type === "root" ? " heb-option" : "") + '" data-key="' + esc(o.key) + '">' +
        '<span class="num">' + (n + 1) + "</span>" + esc(o.label) + "</button>").join("") + "</div>" +
      '<div id="feedback" class="feedback" aria-live="polite"></div>';
    renderScore();
  }

  function explanationHTML(item) {
    const a = item.analysis;
    const h = ['<div class="segments">'];
    for (const s of a.segments) {
      h.push('<div class="segment ' + s.role + '"><div class="seg-text">' + esc(App.cleanSeg(s.text)) + "</div><div>" +
        '<div class="seg-title">' + esc(s.title) + "</div>" +
        (s.details.length ? '<div class="seg-details">' + esc(s.details.join(", ")) + "</div>" : "") + "</div></div>");
    }
    h.push("</div>");
    const he = App.gloss(a.mainLemma);
    if (he) h.push('<p class="fb-roots">פירוש: <b>' + esc(he.g) + "</b></p>");
    if (item.roots.length) {
      h.push('<p class="fb-roots">השורש: ' + item.roots.map((r) =>
        "<b class=\"heb-inline\">" + esc(Roots.displayRoot(r.root)) + "</b> <span class=\"muted\">(" +
        esc(r.sources.map((s) => s.name).join(", ")) + ")</span>").join(" · ") + "</p>");
      const gz = Roots.gizrot(item.roots[0].root).map((g) => g[0]);
      if (gz.length) h.push('<p class="muted">גזרה: ' + esc(gz.join(", ")) + "</p>");
    }
    const notes = a.segments.flatMap((s) => s.notes).filter(([t]) => question.type !== "root" || !t.startsWith("בניין"));
    if (notes.length) h.push('<ul class="notes">' + notes.map(([t, e]) => "<li><b>" + esc(t) + ":</b> " + esc(e) + "</li>").join("") + "</ul>");
    return h.join("");
  }

  function answer(key) {
    if (!question || question.answered) return;
    question.answered = true;
    const ok = question.accept.has(key);
    session.total++;
    if (ok) { session.correct++; session.streak++; } else session.streak = 0;
    const st = stats[question.type] || (stats[question.type] = { correct: 0, total: 0 });
    st.total++;
    if (ok) st.correct++;
    saveStats();

    document.querySelectorAll("#practice-card .option").forEach((b) => {
      b.disabled = true;
      if (question.accept.has(b.dataset.key)) b.classList.add("correct");
      else if (b.dataset.key === key) b.classList.add("wrong");
    });
    let extra = "";
    if (question.type === "root" && question.item.roots.length > 1) {
      extra = '<p class="muted">שימו לב: יש כמה דעות לגבי שורש המילה, וכל אחת מהן נחשבת תשובה נכונה.</p>';
    }
    $("feedback").innerHTML =
      '<p class="verdict ' + (ok ? "good" : "bad") + '">' + (ok ? "נכון! ✓" : "לא נכון ✗") + "</p>" + extra +
      explanationHTML(question.item) +
      '<div class="fb-actions"><button type="button" class="primary" id="next-q">לשאלה הבאה ←</button>' +
      '<button type="button" id="show-in-text">הצגה בטקסט</button></div>';
    $("next-q").focus();
    if (window.Cheat) {
      const it = question.item;
      Cheat.focusWord({ analysis: it.analysis, roots: it.roots, entry: App.state.lexicon[it.analysis.mainLemma], label: App.clean(it.word[0]) });
    }
    renderScore();
  }

  function renderScore() {
    const parts = [];
    if (session.total) {
      parts.push("ציון: <b>" + session.correct + "/" + session.total + "</b>");
      if (session.streak > 1) parts.push("רצף: <b>" + session.streak + "</b>");
    }
    const all = Object.entries(stats).filter(([t]) => TYPES[t]);
    if (all.length) {
      parts.push('<span class="muted">' + all.map(([t, s]) =>
        ({ root: "שורש", binyan: "בניין", tense: "זמן", pgn: "גמ\"ס" }[t]) + " " + Math.round((100 * s.correct) / s.total) + "%").join(" · ") + "</span>");
    }
    $("practice-score").innerHTML = parts.join(" &nbsp; ");
  }

  // ------------------------------------------------------------ wiring

  function bind() {
    $("practice-card").addEventListener("click", (e) => {
      const opt = e.target.closest(".option");
      if (opt) return answer(opt.dataset.key);
      if (e.target.closest("#next-q")) return nextQuestion();
      if (e.target.closest("#show-in-text")) {
        const it = question.item;
        App.goToWord(it.book.code, it.ch, it.v, it.i, it.q);
      }
    });
    document.addEventListener("keydown", (e) => {
      if (App.state.view !== "practice" || !question || e.target.matches("input, select, textarea")) return;
      if (!question.answered && /^[1-4]$/.test(e.key)) {
        const b = document.querySelectorAll("#practice-card .option")[+e.key - 1];
        if (b) answer(b.dataset.key);
      } else if (question.answered && e.key === "Enter" && !e.target.closest("button")) {
        nextQuestion();
      }
    });
    $("practice-source").addEventListener("change", () => { poolKey = ""; nextQuestion(); });
    $("practice-type").addEventListener("change", nextQuestion);
    document.addEventListener("roots:view", (e) => {
      if (e.detail === "practice" && (!question || poolKeyChanged())) nextQuestion();
    });
    document.addEventListener("roots:chapter", () => {
      if (App.state.view === "practice" && poolKeyChanged()) nextQuestion();
    });
  }

  function poolKeyChanged() {
    const st = App.state;
    const source = $("practice-source").value;
    return poolKey !== st.book.code + ":" + (source === "chapter" ? st.chapter : "*");
  }

  bind();
})();

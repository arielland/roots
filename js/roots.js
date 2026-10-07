// Root opinions (BDB / Strong's) and weak-root classes (גזרות).

const FINAL_MAP = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };

function rootLetters(root) {
  // Letters only, final forms normalised; keeps the shin/sin dot on ש.
  const out = [];
  for (const ch of root.normalize("NFC")) {
    if (ch >= "א" && ch <= "ת") out.push(FINAL_MAP[ch] || ch);
    else if ((ch === "ׁ" || ch === "ׂ") && out.length) out[out.length - 1] += ch;
  }
  return out;
}

function rootKey(root) {
  return rootLetters(root).map((l) => l[0]).join("");
}

function displayRoot(root) {
  const letters = rootLetters(root);
  if (letters.length) {
    const last = letters.length - 1;
    const finals = { "כ": "ך", "מ": "ם", "נ": "ן", "פ": "ף", "צ": "ץ" };
    letters[last] = (finals[letters[last][0]] || letters[last][0]) + letters[last].slice(1);
  }
  return letters.join("-");
}

const SPECIAL_ROOTS = {
  "הלכ": ["הלך – נוטה כפ\"י", "בעתיד ובציווי הה' נושרת כאילו היה השורש ילך: יֵלֵךְ, לֵךְ, וַיֵּלֶךְ."],
  "לקח": ["לקח – נוטה כפ\"נ", "הל' נבלעת בדגש כמו נ' בגזרת פ\"נ: יִקַּח, קַח."],
  "נתנ": ["נתן – פ\"נ ול\"נ", "גם הנ' הראשונה וגם האחרונה נבלעות: יִתֵּן, נָתַתִּי."],
};

/** Classify the weak-root classes (גזרות) of a three-letter root. */
function gizrot(root) {
  const L = rootLetters(root).map((l) => l[0]);
  const res = [];
  const special = SPECIAL_ROOTS[L.join("")];
  if (special) res.push(special);
  if (L.length === 2) {
    res.push(["שורש דו-עיצורי", "השורש רשום בשתי אותיות; לרוב מדובר בגזרת ע\"ו/ע\"י או בכפולים, או במילה קדומה שאינה נגזרת מפועל."]);
    return res;
  }
  if (L.length !== 3) {
    if (L.length > 3) res.push(["שורש מרובע", "שורש בן ארבע אותיות ומעלה."]);
    return res;
  }
  const [p, a, l] = L;
  const guttural = "אהחער";
  if (p === "נ") res.push(["פ\"נ", "נ' בתחילת השורש: כשאין אחריה תנועה היא נבלעת בדגש חזק באות שאחריה (נפל → יִפֹּל)."]);
  if (p === "י") res.push(["פ\"י / פ\"ו", "י' בתחילת השורש (ובחלק מהפעלים במקורה ו'): בעתיד היא נושרת או הופכת לתנועה (ישב → יֵשֵׁב, הוֹשִׁיב)."]);
  if (p === "א") res.push(["פ\"א", "א' בתחילת השורש; בחלק מהפעלים (אמר, אכל, אבד, אבה, אפה) היא נחה בעתיד: יֹאמַר, וַיֹּאמֶר."]);
  // In ל"ה roots (היה, צוה) the middle ו/י is a real consonant, not a hollow root.
  if ((a === "ו" || a === "י") && l !== "ה") res.push([a === "ו" ? "ע\"ו" : "ע\"י", "האות האמצעית נחה – הופכת לתנועה ואינה נשמעת כעיצור (קום → קָם, יָקוּם; שׂים → יָשִׂים)."]);
  if (l === "ה") res.push(["ל\"ה (ל\"י)", "ה' בסוף השורש היא אם קריאה ולא עיצור: היא מתחלפת בי' או ב-ת או נושרת (בנה → בָּנִיתִי, וַיִּבֶן, בְּנוֹת)."]);
  if (l === "א") res.push(["ל\"א", "א' בסוף השורש נחה ואינה נשמעת, ומשפיעה על התנועות (מצא → מָצָאתִי)."]);
  if (a === l) res.push(["כפולים (ע\"ע)", "שתי האותיות האחרונות זהות; לעיתים הן מתמזגות לאות אחת עם דגש (סבב → סַבּוֹתָ, יָסֹב)."]);
  if (guttural.slice(0, 4).includes(p) && p !== "א") res.push(["פ' גרונית", "אות גרונית בתחילת השורש: אינה מקבלת דגש ומעדיפה חטפים ותנועת a (עמד → יַעֲמֹד)."]);
  if (guttural.includes(a) && a !== "ו" && a !== "י") res.push(["ע' גרונית", "אות גרונית באמצע השורש: אינה מקבלת דגש חזק ומעדיפה חטף פתח (שאל → שָׁאֲלוּ)."]);
  if (l === "ח" || l === "ע") res.push(["ל' גרונית", "ח'/ע' בסוף השורש: באה לפניהן תנועת a – לעיתים פתח גנובה (שָׁמַע, שׁוֹמֵעַ)."]);
  if (!res.length) res.push(["שלמים", "כל אותיות השורש יציבות ונשמעות בכל הנטיות."]);
  return res;
}

/**
 * Gather all root opinions for a lexicon entry.
 * Returns {roots: [{key, root, sources: [{name, note}], def, path}], reason}
 */
function rootOpinions(entry, mainCode) {
  const roots = [];
  const add = (root, source) => {
    if (!root) return;
    const key = rootKey(root);
    if (key.length < 2) return;
    let r = roots.find((x) => x.key === key);
    if (!r) {
      r = { key, root, sources: [], defs: [] };
      roots.push(r);
    }
    // Prefer the spelling that keeps the shin/sin dot.
    if (root.length > r.root.length) r.root = root;
    r.sources.push(source);
  };
  if (!entry) return { roots, reason: "אין נתונים מילוניים למילה זו." };

  const bdb = entry.bdb;
  if (bdb && bdb.root) {
    const path = bdb.path || [];
    const top = path[path.length - 1];
    add(bdb.root, {
      name: "BDB",
      full: "מילון בראון-דרייבר-בריגס (BDB)",
      path: path.filter((p) => p.w && p.pos).map((p) => p.w),
      def: top && top.def ? top.def : entry.pos === "V" ? entry.def : "",
      unattested: top && !top.pos ? "השורש אינו מתועד כפועל במקרא" : "",
    });
  }
  const strong = entry.strong;
  if (strong && strong.roots) {
    for (const r of strong.roots) {
      add(r.r, {
        name: "Strong",
        full: "מילון סטרונג (Strong's)",
        def: r.def,
        via: r.n !== strong.n ? r.w + " (H" + r.n + ")" : "",
        uncertain: r.uncertain,
        cognate: r.cognate,
      });
    }
  }

  // Strong's sometimes gives no root where BDB does – that is an opinion too.
  let strongNote = "";
  if (roots.length && strong && !(strong.roots || []).length) {
    if (strong.note === "unused") strongNote = "לפי סטרונג המילה נגזרת משורש שאינו בשימוש במקרא.";
    else if (strong.note === "foreign") strongNote = "לפי סטרונג המילה שאולה משפה זרה.";
    else if (strong.note === "uncertain") strongNote = "לפי סטרונג מקור המילה אינו ודאי.";
    else if (strong.src) strongNote = "סטרונג אינו מציין שורש (\"" + strong.src + "\").";
  }

  let reason = "";
  if (!roots.length) {
    const pos = (mainCode || "")[0];
    if (strong && strong.note === "unused") reason = "לפי סטרונג המילה נגזרת משורש שאינו בשימוש במקרא (\"" + strong.src + "\").";
    else if (strong && strong.note === "foreign") reason = "לפי סטרונג זו מילה שמקורה בשפה זרה.";
    else if ((mainCode || "").startsWith("Np")) reason = "שם פרטי – לא נמצא לו שורש במילונים.";
    else if ("RCTD".includes(pos) || pos === "P" || pos === "S") reason = "מילת יחס / מילית / כינוי – מילים בסיסיות שאינן נגזרות משורש.";
    else reason = "לא נמצא שורש במילונים (ייתכן שזו מילה קדומה שאינה נגזרת מפועל).";
  }
  return { roots, reason, strongNote };
}

window.Roots = { rootOpinions, gizrot, rootKey, displayRoot };

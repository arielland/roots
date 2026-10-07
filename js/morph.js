// Parsing of OSHB morphology codes (e.g. "HC/Vqw3ms") into Hebrew grammar terms.
// Code reference: https://hb.openscriptures.org/parsing/HebrewMorphologyCodes.html

const STEMS_HEB = {
  q: ["קַל", "הבניין הבסיסי: פעולה פשוטה, פעילה (שָׁמַר, אָמַר)."],
  N: ["נִפְעַל", "בדרך כלל סביל או חוזר של בניין קל (נִשְׁמַר – נשמר על ידי מישהו / שמר על עצמו)."],
  p: ["פִּעֵל", "פעיל, לרוב מעצים או גורם למצב (שִׁבֵּר – שבר לרסיסים). סימנו: דגש חזק בע' הפועל."],
  P: ["פֻּעַל", "הסביל של פִּעֵל (שֻׁבַּר)."],
  h: ["הִפְעִיל", "בניין גורם (סיבתי): לגרום למישהו לעשות (הִמְלִיךְ – גרם למלוך)."],
  H: ["הֻפְעַל", "הסביל של הִפְעִיל (הֻמְלַךְ)."],
  t: ["הִתְפַּעֵל", "חוזר או הדדי: הפעולה חוזרת אל העושה (הִתְקַדֵּשׁ)."],
  o: ["פּוֹלֵל", "צורה מקבילה לפִּעֵל בגזרות ע\"ו וכפולים (קוֹמֵם)."],
  O: ["פּוֹלַל", "הסביל של פּוֹלֵל."],
  r: ["הִתְפּוֹלֵל", "צורה מקבילה להִתְפַּעֵל בגזרות ע\"ו וכפולים (הִתְבּוֹנֵן)."],
  m: ["פּוֹעֵל", "צורה נדירה המקבילה לפִּעֵל (בעיקר בכפולים)."],
  M: ["פּוֹעַל", "הסביל של פּוֹעֵל."],
  k: ["פַּלְעֵל", "צורה נדירה (הכפלת ל' הפועל)."],
  K: ["פֻּלְעַל", "הסביל של פַּלְעֵל."],
  Q: ["קַל סָבִיל", "שרידים של בניין סביל לקל (כגון לֻקַּח, יֻתַּן)."],
  l: ["פִּלְפֵּל", "הכפלת שתי אותיות השורש (גִּלְגֵּל), מקביל לפִּעֵל."],
  L: ["פֻּלְפַּל", "הסביל של פִּלְפֵּל."],
  f: ["הִתְפַּלְפֵּל", "החוזר של פִּלְפֵּל (הִתְגַּלְגֵּל)."],
  D: ["נִתְפַּעֵל", "צורה מעורבת של נִפְעַל והִתְפַּעֵל (נִכַּפֵּר)."],
  j: ["פַּעַלְעַל", "צורה נדירה מאוד (הכפלת ע' ול' הפועל)."],
  i: ["פִּלְעֵל", "צורה נדירה (שַׁאֲנַן)."],
  u: ["הָתְפַּעַל", "הסביל של הִתְפַּעֵל (הֻתְפַּקְדוּ)."],
  c: ["תִּפְעֵל", "צורה נדירה עם ת' בתחילת הבסיס (תִּרְגַּלְתִּי)."],
  v: ["הִשְׁתַּפְעֵל", "בניין מיוחד, בעיקר בפועל הִשְׁתַּחֲוָה."],
  w: ["נִתְפַּלֵּל", "צורה נדירה."],
  y: ["נִתְפּוֹעֵל", "צורה נדירה."],
  z: ["הִתְפּוֹעֵל", "צורה נדירה (חוזר של פּוֹעֵל)."],
};

const STEMS_ARC = {
  q: ["פְּעַל", "הבניין הבסיסי בארמית (מקביל לקַל)."],
  Q: ["פְּעִיל", "הסביל של פְּעַל."],
  u: ["הִתְפְּעֵל", "חוזר/סביל של פְּעַל."],
  N: ["נִפְעַל", "סביל (נדיר בארמית)."],
  p: ["פַּעֵל", "מקביל לפִּעֵל העברי."],
  P: ["אִתְפַּעַל", "חוזר/סביל של פַּעֵל."],
  M: ["הִתְפַּעַל", "חוזר/סביל של פַּעֵל."],
  a: ["אַפְעֵל", "בניין גורם, מקביל להִפְעִיל."],
  h: ["הַפְעֵל", "בניין גורם, מקביל להִפְעִיל."],
  s: ["שַׁפְעֵל", "בניין גורם עם ש' (שַׁכְלֵל)."],
  e: ["שַׁפְעֵל", "בניין גורם עם ש'."],
  H: ["הֻפְעַל", "הסביל של הַפְעֵל."],
  i: ["אִתְפְּעֵל", "חוזר/סביל של פְּעַל."],
  t: ["הִשְׁתַּפְעַל", "חוזר של שַׁפְעֵל."],
  v: ["אִשְׁתַּפְעַל", "חוזר של שַׁפְעֵל."],
  w: ["הִתְאַפְעַל", "חוזר של אַפְעֵל."],
  o: ["פּוֹלֵל", "צורה מקבילה לפַּעֵל בגזרות ע\"ו וכפולים."],
  z: ["הִתְפּוֹלֵל", "חוזר של פּוֹלֵל."],
  r: ["הִתְפּוֹלֵל", "חוזר של פּוֹלֵל."],
  f: ["הִתְפַּלְפַּל", "חוזר של פַּלְפֵּל."],
  b: ["הֻפְעַל", "סביל של הַפְעֵל."],
  c: ["תִּפְעַל", "צורה נדירה."],
  m: ["פּוֹעֵל", "צורה נדירה."],
  l: ["פַּלְפֵּל", "הכפלת אותיות השורש."],
  L: ["אִתְפַּלְפַּל", "חוזר של פַּלְפֵּל."],
  O: ["אִתְפּוֹלַל", "חוזר של פּוֹלֵל."],
  G: ["אִתַּפְעַל", "חוזר של אַפְעֵל."],
};

const CONJ = {
  p: ["עבר", "צורת הקָטַל – פעולה שהושלמה."],
  q: ["עבר מהופך (וְקָטַל)", "צורת עבר שלפניה ו' ההיפוך; משמעותה בדרך כלל עתיד או פעולה חוזרת (וְאָמַרְתָּ = ותאמר)."],
  i: ["עתיד", "צורת היִקְטֹל – פעולה שלא הושלמה: עתיד, הרגל או רצון."],
  w: ["עתיד מהופך (וַיִּקְטֹל)", "צורת עתיד שלפניה ו' ההיפוך (וַ + דגש באות הבאה); משמעותה עבר – זו הצורה הרגילה של סיפור במקרא (וַיֹּאמֶר = ואמר)."],
  h: ["עתיד מוארך (כוהורטטיב)", "צורת עתיד בגוף ראשון עם ה' בסופה, מביעה רצון או בקשה (אֶשְׁמְרָה = הבה אשמור)."],
  j: ["עתיד מקוצר (יוסיב)", "צורת עתיד מקוצרת המביעה ציווי עקיף או משאלה (יְהִי אוֹר)."],
  v: ["ציווי", "פנייה ישירה אל הנמען לעשות דבר."],
  r: ["בינוני פועל", "צורת ההווה / שם הפועל הפעיל (שׁוֹמֵר) – משמש כפועל, כשם עצם או כתואר."],
  s: ["בינוני פעול", "צורה סבילה של הבינוני (שָׁמוּר)."],
  a: ["מקור מוחלט", "צורת מקור שאינה מקבלת כינויים; משמשת בעיקר להדגשה (מוֹת תָּמוּת) או כציווי."],
  c: ["מקור נטוי", "צורת מקור (שם הפועל), לרוב עם אותיות בכל\"ם או כינויים (לִשְׁמֹר, בְּשָׁמְרוֹ)."],
};

const PERSON = { 1: "גוף ראשון", 2: "גוף שני", 3: "גוף שלישי" };
const GENDER = { m: "זכר", f: "נקבה", b: "זכר ונקבה", c: "משותף (זכר ונקבה)" };
const NUMBER = { s: "יחיד", p: "רבים", d: "זוגי" };
const STATE = { a: "נפרד", c: "נסמך", d: "מיודע (ארמית)" };

const NOUN_TYPE = { c: "שם עצם", g: "שם יחס (גנטיליקום)", p: "שם פרטי" };
const PROPER = { m: "שם אדם", f: "שם אישה", l: "שם מקום", t: "שם עם" };
const ADJ_TYPE = { a: "שם תואר", c: "שם מספר יסודי", g: "שם יחס (גנטיליקום)", o: "שם מספר סודר" };
const PRON_TYPE = {
  d: "כינוי רמז (זֶה, אֵלֶּה)", f: "כינוי סתמי", i: "כינוי שאלה (מִי, מָה)",
  p: "כינוי גוף (אֲנִי, הוּא…)", r: "כינוי זיקה",
};
const PARTICLE = {
  a: "מילת חיזוק (אַף, גַּם)", d: "ה' הידיעה", e: "מילת בקשה (נָא)",
  i: "ה' השאלה / מילת שאלה", j: "מילת קריאה (הוֹי, אָהּ)", m: "מילת הצבעה (הִנֵּה)",
  n: "מילת שלילה (לֹא, אַל, אֵין)", o: "אֶת – סימן המושא הישיר המיודע", r: "מילת זיקה (אֲשֶׁר, שֶׁ־)",
};

// Hebrew equivalents of pronominal suffixes, by host type.
const SUFFIX_MEANING = {
  "1cs": ["שלי", "אותי", "לי / בי / ממני"],
  "1cp": ["שלנו", "אותנו", "לנו / בנו"],
  "2ms": ["שלךָ", "אותךָ", "לךָ / בךָ"],
  "2fs": ["שלךְ", "אותךְ", "לךְ / בךְ"],
  "2mp": ["שלכם", "אתכם", "לכם / בכם"],
  "2fp": ["שלכן", "אתכן", "לכן / בכן"],
  "3ms": ["שלו", "אותו", "לו / בו"],
  "3fs": ["שלה", "אותה", "לה / בה"],
  "3mp": ["שלהם", "אותם", "להם / בהם"],
  "3fp": ["שלהן", "אותן", "להן / בהן"],
};

const PREFIX_LETTER = {
  b: "ב", c: "ו", d: "ה", i: "ה", k: "כ", l: "ל", m: "מ", s: "ש",
};

function pgn(p, g, n) {
  return [PERSON[p], GENDER[g], NUMBER[n]].filter(Boolean);
}

/**
 * Parse one morphology segment (without the language letter).
 * Returns {pos, title, details: [string], notes: [string], kind}.
 * kind: "verb" | "noun" | "prep" | "conj" | "suffix" | "article" | "particle" | "pronoun" | ...
 */
function parseSegment(code, lang, ctx) {
  const c = code.split("");
  const out = { code, details: [], notes: [], kind: "other", title: "" };
  switch (c[0]) {
    case "V": {
      out.kind = "verb";
      const stems = lang === "A" ? STEMS_ARC : STEMS_HEB;
      const stem = stems[c[1]];
      const conj = CONJ[c[2]];
      out.title = "פועל";
      out.stem = stem ? stem[0] : c[1];
      out.conj = conj ? conj[0] : c[2];
      out.details.push("בניין " + (stem ? stem[0] : "?"));
      if (conj) out.details.push(conj[0]);
      if ("rs".includes(c[2])) {
        out.details.push(...[GENDER[c[3]], NUMBER[c[4]], STATE[c[5]]].filter(Boolean));
      } else if (!"ac".includes(c[2])) {
        out.details.push(...pgn(c[3], c[4], c[5]));
      }
      if (stem) out.notes.push(["בניין " + stem[0], stem[1]]);
      if (conj) out.notes.push([conj[0], conj[1]]);
      break;
    }
    case "N": {
      out.kind = "noun";
      if (c[1] === "p") {
        out.title = PROPER[c[2]] || "שם פרטי";
      } else {
        out.title = NOUN_TYPE[c[1]] || "שם עצם";
        out.details.push(...[GENDER[c[2]], NUMBER[c[3]], STATE[c[4]]].filter(Boolean));
        if (c[4] === "c") out.notes.push(["נסמך", "המילה בצורת סמיכות – קשורה למילה שאחריה (בֵּית הַמֶּלֶךְ)."]);
      }
      break;
    }
    case "A": {
      out.kind = "adjective";
      out.title = ADJ_TYPE[c[1]] || "שם תואר";
      out.details.push(...[GENDER[c[2]], NUMBER[c[3]], STATE[c[4]]].filter(Boolean));
      break;
    }
    case "P": {
      out.kind = "pronoun";
      out.title = PRON_TYPE[c[1]] || "כינוי";
      out.details.push(...pgn(c[2], c[3], c[4]));
      break;
    }
    case "R": {
      out.kind = "prep";
      out.title = "מילת יחס";
      if (ctx.letter) out.title = "מילת היחס " + ctx.letter + "'";
      if (c[1] === "d") {
        out.details.push("עם ה' הידיעה מובלעת");
        out.notes.push(["ה' הידיעה מובלעת", "כשמילת יחס (בכ\"ל) באה לפני ה' הידיעה, הה' נשמטת והתנועה שלה עוברת לאות היחס: בְּ+הַבַּיִת = בַּבַּיִת."]);
      }
      break;
    }
    case "C": {
      out.kind = "conj";
      out.title = "ו' החיבור";
      if (ctx.nextConj === "w") {
        out.title = "ו' ההיפוך";
        out.notes.push(["ו' ההיפוך", "וַ (פתח + דגש חזק באות הבאה) לפני צורת עתיד – הופכת אותה לעבר סיפורי."]);
      } else if (ctx.nextConj === "q") {
        out.title = "ו' ההיפוך";
        out.notes.push(["ו' ההיפוך", "וְ לפני צורת עבר – הופכת אותה בדרך כלל למשמעות עתיד."]);
      }
      break;
    }
    case "D": out.kind = "adverb"; out.title = "תואר הפועל"; break;
    case "T": {
      out.kind = "particle";
      out.title = PARTICLE[c[1]] || "מילית";
      if (c[1] === "d" && ctx.afterMain && lang === "A") {
        out.title = "א' הידיעה הארמית";
        out.notes.push(["מצב מיודע", "בארמית היידוע בא בסוף המילה (מַלְכָּא = המלך)."]);
      }
      break;
    }
    case "S": {
      out.kind = "suffix";
      if (c[1] === "p") {
        const key = c[2] + c[3] + c[4];
        out.title = "כינוי חבור (כינוי קניין / מושא)";
        out.details.push(...pgn(c[2], c[3], c[4]));
        const m = SUFFIX_MEANING[key];
        if (m) {
          const meaning = ctx.host === "verb" ? m[1] : ctx.host === "prep" ? m[2] : m[0];
          out.details.push("= " + meaning);
        }
      } else if (c[1] === "d") {
        out.title = "ה' המגמה";
        out.notes.push(["ה' המגמה", "ה' לא מודגשת בסוף המילה שמשמעותה 'אל, לכיוון' (אַרְצָה = אל הארץ)."]);
      } else if (c[1] === "h") {
        out.title = "ה' יתירה (פרגוגית)";
      } else if (c[1] === "n") {
        out.title = "נ' יתירה (נון פרגוגית)";
        out.notes.push(["נ' יתירה", "נון נוספת בסוף פעלים (יִשְׁמְרוּן), בלי שינוי משמעות."]);
      } else {
        out.title = "סופית";
      }
      break;
    }
    default:
      out.title = code;
  }
  return out;
}

/**
 * Analyse a full word: text "וַ/יֹּ֣אמֶר", lemma "c/559", morph "HC/Vqw3ms".
 * Returns {lang, segments: [{text, lemma, role: prefix|main|suffix, ...parsed}], main}.
 */
function analyzeWord(text, lemma, morph) {
  const lang = morph[0] || "H";
  const codes = morph.slice(1).split("/");
  const texts = text.split("/");
  const lemmas = lemma.replace(/\s+/g, "").replace(/\+/g, "").split("/");
  const mainIdx = Math.min(lemmas.length - 1, codes.length - 1);
  const mainCode = codes[mainIdx] || "";
  const nextConj = mainCode[0] === "V" ? mainCode[2] : null;
  const segments = codes.map((code, i) => {
    const role = i < mainIdx ? "prefix" : i === mainIdx ? "main" : "suffix";
    const lem = i <= mainIdx ? lemmas[i] : null;
    const ctx = {
      letter: lem ? PREFIX_LETTER[lem] : null,
      nextConj: i === mainIdx - 1 || (i < mainIdx && codes[i + 1] && codes[i + 1][0] === "V") ? nextConj : null,
      // On an infinitive construct the suffix is usually the subject (בְּעָמְדָם = בעמידתם).
      host: mainCode[0] === "V" && mainCode[2] !== "c" ? "verb" : mainCode[0] === "R" ? "prep" : "noun",
      afterMain: i > mainIdx,
    };
    const parsed = parseSegment(code, lang, ctx);
    return Object.assign(parsed, { text: texts[i] || "", lemma: lem, role });
  });
  return { lang, segments, main: segments[mainIdx], mainLemma: lemmas[mainIdx] };
}

window.Morph = { analyzeWord, parseSegment };

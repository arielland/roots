// Noun patterns (משקלים): the table shown in the cheat sheet, and a heuristic
// that finds the pattern of a lexicon entry from its pointed dictionary form.

// keys: pattern skeletons (compared after NFD normalisation) after normalisation (see templateKey): root letters → פ-ע-ל,
// no dagesh except a strong one in ע, no shin/sin dots, full vowels with matres (וֹ → ֹ, וּ → ֻ, ִי → ִ), chataf → shva.
const MISHKALIM = [
  {
    id: "simple", title: "משקלים בלי תוספות", items: [
      { id: "m-pelel", name: "פֶּעֶל / פַּעַל", keys: ["פֶעֶל", "פֶעַל", "פַעַל"], ex: "מֶלֶךְ, נֶפֶשׁ, זֶרַע, נַעַר",
        expl: "שם סגולי: הטעם בהברה הראשונה ובהברה השנייה סגול (או פתח ליד גרונית). ברבים: מְלָכִים, בנסמך ובנטייה: מַלְכִּי." },
      { id: "m-pelel-e", name: "פֵּעֶל", keys: ["פֵעֶל", "פֵעַל"], ex: "סֵפֶר, זֵכֶר, קֵדֶם",
        expl: "שם סגולי עם צירה; בנטייה התנועה הופכת לחיריק: סִפְרִי." },
      { id: "m-polel", name: "פֹּעֶל / פֹּעַל", keys: ["פֹעֶל", "פֹעַל"], ex: "קֹדֶשׁ, בֹּקֶר, אֹהֶל, אֹרַח",
        expl: "שם סגולי עם חולם; בנטייה – קמץ קטן: קָדְשִׁי, אָהֳלוֹ." },
      { id: "m-payil", name: "פַּיִל (סגולי ע\"י / ע\"ו)", keys: ["פַעִל"], ex: "בַּיִת, עַיִן, זַיִת, מָוֶת",
        expl: "סגוליים שהאות האמצעית שלהם י' או ו'; בנסמך הם מתכווצים: בֵּית, עֵין, מוֹת." },
      { id: "m-paal", name: "פָּעָל", keys: ["פָעָל"], ex: "דָּבָר, חָכָם, זָהָב, יָשָׁר",
        expl: "שמות ותארים; הקמץ הראשון מתקצר לשווא כשהטעם מתרחק: דְּבָרִים, דְּבַר." },
      { id: "m-pael", name: "פָּעֵל", keys: ["פָעֵל"], ex: "זָקֵן, כָּבֵד, שָׂמֵחַ",
        expl: "בעיקר תארים (מצב או תכונה); זהה בצורתו לבינוני של פעלי מצב." },
      { id: "m-paol", name: "פָּעוֹל", keys: ["פָעֹל"], ex: "גָּדוֹל, קָדוֹשׁ, שָׁלוֹם, כָּבוֹד",
        expl: "תארים ושמות; החולם יציב ונשמר בנטייה: גְּדוֹלִים." },
      { id: "m-pail", name: "פָּעִיל / פְּעִיל", keys: ["פָעִל", "פְעִל"], ex: "נָבִיא, פָּקִיד, עָשִׁיר",
        expl: "תארים ובעלי תפקיד; החיריק המלא יציב: נְבִיאִים." },
      { id: "m-pail-dagesh", name: "פַּעִּיל", keys: ["פַעִּל"], ex: "צַדִּיק, אַבִּיר, שַׁלִּיט, עַתִּיק",
        expl: "תכונה מוגברת או קבועה; דגש חזק בע' הפועל." },
      { id: "m-paul", name: "פָּעוּל", keys: ["פָעֻל"], ex: "בָּרוּךְ, עָצוּם",
        expl: "צורת הבינוני הפעול של בניין קל, המשמשת גם כתואר." },
      { id: "m-peal", name: "פֵּעָל", keys: ["פֵעָל"], ex: "לֵבָב, עֵנָב",
        expl: "משקל נדיר; הצירה מתקצר לשווא בנטייה: לְבָבִי." },
      { id: "m-peul", name: "פְּעוּל / פְּעוֹל", keys: ["פְעֻל", "פְעֹל"], ex: "גְּבוּל, לְבוּשׁ, אֱלוֹהַּ",
        expl: "שמות עם תנועה ארוכה בהברה השנייה." },
      { id: "m-piel-adj", name: "פִּעֵל", keys: ["פִעֵּל", "פִעֵל", "פֵעֵל"], ex: "עִוֵּר, אִלֵּם, חֵרֵשׁ, פִּסֵּחַ",
        expl: "תארים של מום או ליקוי גופני; דגש חזק בע' הפועל." },
      { id: "m-paeh", name: "פָּעֶה (ל\"ה)", keys: ["פָעֶל"], ex: "חָזֶה, יָפֶה, קָשֶׁה, רֹעֶה",
        expl: "תארים ושמות משורשי ל\"ה: הה' בסוף היא ה' השורש, ולפניה סגול. ברבים היא נושרת: יָפוֹת." },
      { id: "m-paal-dagesh", name: "פַּעָּל", keys: ["פַעָּל", "פַעָל"], ex: "גַּנָּב, טַבָּח, דַּיָּן, חַטָּא",
        expl: "בעלי מקצוע ובעלי תכונה קבועה; דגש חזק בע' הפועל." },
      { id: "m-piol", name: "פִּעּוֹל", keys: ["פִעֹּל", "פִעֻּל", "פִעֹל", "פִעֻל"], ex: "גִּבּוֹר, שִׁכּוֹר, צִפּוֹר",
        expl: "תכונה מוגברת; דגש חזק בע' הפועל." },
      { id: "m-pial", name: "פִּעָּל", keys: ["פִעָּל", "פִעָל"], ex: "אִכָּר, גִּבָּר, אִסָּר", expl: "דגש חזק בע' הפועל." },
      { id: "m-paul-dagesh", name: "פַּעּוּל", keys: ["פַעֻּל", "פַעֻל"], ex: "חַנּוּן, רַחוּם, עַמּוּד", expl: "תארים של תכונה מוגברת ושמות; דגש חזק בע' הפועל (לא בגרוניות)." },
      { id: "m-peal-shva", name: "פְּעָל / פְּעַל / פְּעֵל", keys: ["פְעָל", "פְעַל", "פְעֵל"], ex: "זְמָן, חֲבָל, בְּאֵר, זְאֵב",
        expl: "התנועה הראשונה היא שווא (או חטף בגרונית)." },
      { id: "m-poal", name: "פּוֹעָל", keys: ["פֹעָל"], ex: "אוֹצָר, גּוֹרָל, אוֹפָן", expl: "חולם יציב אחרי פ' הפועל." },
      { id: "m-poel", name: "פּוֹעֵל (בינוני כשם)", keys: ["פֹעֵל"], ex: "יוֹבֵל, חֹבֵל, אֹיֵב",
        expl: "צורת הבינוני הפועל של בניין קל שמשמשת כשם עצם (בעל מקצוע או תכונה)." },
      { id: "m-qol", name: "קוֹל / שׁוּר / דִּין (ע\"ו / ע\"י)", keys: ["פעֹל", "פעֻל", "פִעל", "פֵעל"], ex: "אוֹר, דּוֹר, שׁוּר, אִישׁ, דִּין",
        expl: "שמות חד-הברתיים משורשי ע\"ו / ע\"י: האות האמצעית היא תנועה (וֹ, וּ, ִי)." },
      { id: "m-qula", name: "קוּמָה / בִּינָה (ע\"ו / ע\"י בנקבה)", keys: ["פעֻלָה", "פעֹלָה", "פִעלָה"], ex: "בּוּשָׁה, קוֹמָה, בִּינָה, שִׁירָה", expl: "" },
      { id: "m-pialon", name: "פִּעָּלוֹן", keys: ["פִעָּלֹן", "פִעָלֹן", "פִעְלֹן"], ex: "זִכָּרוֹן, עִוָּרוֹן, שִׁגָּעוֹן",
        expl: "שמות מופשטים בסיומת ־וֹן ודגש בע' הפועל." },
    ],
  },
  {
    id: "fem", title: "משקלים בנקבה (סיומת ־ָה / ־ֶת)", items: [
      { id: "m-peala", name: "פְּעָלָה", keys: ["פְעָלָה"], ex: "צְדָקָה, בְּרָכָה, אֲדָמָה",
        expl: "בנסמך ־ַת: צִדְקַת, בִּרְכַּת." },
      { id: "m-peela", name: "פְּעֵלָה", keys: ["פְעֵלָה"], ex: "נְבֵלָה, שְׁאֵלָה, גְּזֵלָה", expl: "" },
      { id: "m-peila", name: "פְּעִילָה", keys: ["פְעִלָה"], ex: "נְגִינָה, חֲסִידָה, אֲנִיָּה",
        expl: "בעברית המאוחרת – משקל שם הפעולה של בניין קל." },
      { id: "m-peula", name: "פְּעֻלָּה / פְּעוּלָה", keys: ["פְעֻלָה", "פְעֻלָּה"], ex: "גְּאֻלָּה, פְּעֻלָּה, גְּבוּרָה, יְשׁוּעָה", expl: "" },
      { id: "m-peola", name: "פְּעוֹלָה", keys: ["פְעֹלָה"], ex: "עֲבֹדָה, גְּדוֹלָה", expl: "" },
      { id: "m-paala", name: "פַּעָּלָה", keys: ["פַעָּלָה", "פַעָלָה"], ex: "בַּקָּשָׁה, יַבָּשָׁה, חַטָּאָה", expl: "" },
      { id: "m-pila", name: "פִּעְלָה / פַּעְלָה / פָּעְלָה", keys: ["פִעְלָה", "פַעְלָה", "פָעְלָה", "פֶעְלָה"], ex: "שִׂמְחָה, מַלְכָּה, חָכְמָה, טֻמְאָה",
        expl: "הנקבה של השמות הסגוליים (מֶלֶךְ → מַלְכָּה)." },
      { id: "m-pelet", name: "פֶּעֶלֶת / פַּעַלַת / פֹּעֶלֶת", keys: ["פֶעֶלֶת", "פַעַלַת", "פֹעֶלֶת", "פַעֶּלֶת", "פַעֶלֶת", "פַעֹּלֶת", "פַעַּלַת", "פְעֹלֶת", "פְעֶלֶת", "פִעֹּלֶת", "פִעֶּלֶת"], ex: "כְּתֹנֶת, קְטֹרֶת, גְּבֶרֶת, כַּפֹּרֶת",
        expl: "נקבה בסיומת ־ֶת, לעיתים כצורה סגולית." },
    ],
  },
  {
    id: "mem", title: "משקלים בתחילית מ'", items: [
      { id: "m-mifal", name: "מִפְעָל", keys: ["מִפְעָל", "מִפְעַל"], ex: "מִשְׁפָּט, מִדְבָּר, מִגְדָּל, מִשְׁמָר",
        expl: "מקום, כלי או תוצאת הפעולה." },
      { id: "m-mafal", name: "מַפְעָל / מֶפְעָל", keys: ["מַפְעָל", "מֶפְעָל", "מַפְעַל"], ex: "מַאֲכָל, מַלְאָךְ, מַעֲרָב, מֶרְחָב",
        expl: "מ' בפתח – לרוב ליד גרונית או בשמות כלי ומקום." },
      { id: "m-mifel", name: "מִפְעֵל / מַפְעֵל", keys: ["מִפְעֵל", "מַפְעֵל"], ex: "מִזְבֵּחַ, מַפְתֵּחַ",
        expl: "בעיקר שמות כלי ומקום (מזבח – מקום הזבח, מפתח – כלי לפתוח)." },
      { id: "m-mifol", name: "מִפְעוֹל / מַפְעוֹל", keys: ["מִפְעֹל", "מַפְעֹל", "מַפְעֻל"], ex: "מִזְמוֹר, מַלְקוֹשׁ, מִכְשׁוֹל", expl: "" },
      { id: "m-maqom", name: "מָקוֹם / מְנוּחָה (מ' + ע\"ו)", keys: ["מָפעֹל", "מָפעֻל", "מְפעֻלָה", "מְפעֹלָה", "מָפעֵל"], ex: "מָקוֹם, מָבוֹא, מָגוֹר, מְנוּחָה, מְנוֹרָה",
        expl: "תחילית מ' לפני שורש ע\"ו: המ' בקמץ (או בשווא), והאות האמצעית נשמעת כתנועה." },
      { id: "m-mafeh", name: "מַפְעֶה / מִפְעֶה (ל\"ה)", keys: ["מַפְעֶל", "מִפְעֶל"], ex: "מַעֲשֶׂה, מִקְנֶה, מִשְׁתֶּה, מַרְאֶה",
        expl: "שמות בתחילית מ' משורשי ל\"ה; הה' בסוף היא ה' השורש. בנסמך ־ֵה: מַעֲשֵׂה." },
      { id: "m-mifala", name: "מִפְעָלָה / מַפְעָלָה", keys: ["מִפְעָלָה", "מַפְעָלָה", "מֶפְעָלָה"], ex: "מַמְלָכָה, מִלְחָמָה, מַחֲשָׁבָה", expl: "" },
      { id: "m-mifelet", name: "מִפְעֶלֶת / מַפְעֶלֶת", keys: ["מִפְעֶלֶת", "מַפְעֶלֶת", "מִפְעֹלֶת", "מַפְעֹלֶת", "מַפְעֵלָה", "מִפְעַלַת"], ex: "מִשְׁמֶרֶת, מַחֲלֹקֶת, מַמְלֶכֶת", expl: "" },
    ],
  },
  {
    id: "tav", title: "משקלים בתחילית ת'", items: [
      { id: "m-tifelet", name: "תִּפְעֶלֶת", keys: ["תִפְעֶלֶת", "תַפְעֶלֶת"], ex: "תִּפְאֶרֶת, תִּפְלֶצֶת", expl: "" },
      { id: "m-tifal", name: "תִּפְעָל / תִּפְעָלָה", keys: ["תִפְעָל", "תִפְעָלָה", "תַפְעָל"], ex: "תִּקְוָה, תִּדְהָר", expl: "" },
      { id: "m-tqula", name: "תְּקוּמָה (ת' + ע\"ו)", keys: ["תְפעֻלָה", "תְפעֹלָה", "תְפעֻל"], ex: "תְּבוּאָה, תְּמוּרָה, תְּנוּפָה",
        expl: "שמות בתחילית ת' משורשי ע\"ו; האות האמצעית נשמעת כתנועה." },
      { id: "m-tafit", name: "תַּפְעִית", keys: ["תַפְעִת"], ex: "תַּכְלִית, תַּבְנִית, תַּרְבִּית", expl: "" },
      { id: "m-tafula", name: "תַּפְעוּל / תַּפְעוּלָה", keys: ["תַפְעֻל", "תַפְעֻלָה"], ex: "תַּחְבֻּלוֹת, תַּעֲלוּמָה, תַּאֲוָה", expl: "" },
      { id: "m-tifala", name: "תְּפִלָּה / תְּהִלָּה (ת' מן השורש החסר)", keys: ["תְפִלָּה", "תְפִלָה", "תְפִעָּלָה"], ex: "תְּפִלָּה, תְּהִלָּה, תְּחִנָּה",
        expl: "ת' בתחילת שמות מגזרת הכפולים (פלל, הלל, חנן)." },
    ],
  },
  {
    id: "alef", title: "משקלים בתחילית א'", items: [
      { id: "m-efal", name: "אֶפְעָל / אַפְעָל", keys: ["אֶפְעָל", "אַפְעָל", "אֶפְעֹל", "אַפְעֵל", "אֶפְעַל", "אַפְעַל"], ex: "אֶזְרָח, אֶקְדָּח, אֶשְׁנָב, אֶצְבַּע",
        expl: "א' נוספת (פרוסתטית) בתחילת השם." },
    ],
  },
  {
    id: "suffix", title: "סיומות גוזרות", items: [
      { id: "m-suf-on", name: "־וֹן / ־ָן", keys: [], suffix: ["ֹן", "ָן"], ex: "רִאשׁוֹן, אֶבְיוֹן, קָרְבָּן, שֻׁלְחָן",
        expl: "סיומת היוצרת שמות מופשטים, שמות כלי ותארים." },
      { id: "m-suf-it", name: "־ִית", keys: [], suffix: ["ִת"], ex: "רֵאשִׁית, אַחֲרִית, שְׁאֵרִית",
        expl: "סיומת נקבה לשמות מופשטים." },
      { id: "m-suf-ut", name: "־וּת", keys: [], suffix: ["ֻת"], ex: "מַלְכוּת, גָּלוּת, עֵדוּת",
        expl: "סיומת לשמות מופשטים (נפוצה במקרא המאוחר)." },
      { id: "m-suf-i", name: "־ִי (שם יחס)", keys: [], ex: "עִבְרִי, יְהוּדִי, מִצְרִי",
        expl: "סיומת שם היחס (גנטיליקום): שייכות לעם, למקום או למשפחה." },
    ],
  },
];

const ACCENTS = /[֑-ֽׅ֯ׄ]/g;
const DAGESH = "ּ", SHIN_DOT = "ׁ", SIN_DOT = "ׂ", HOLAM = "ֹ", QUBUTS = "ֻ", HIRIQ = "ִ", PATAH = "ַ";
const FINALS = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };

function clusters(word) {
  const out = [];
  for (const ch of word.normalize("NFC").replace(ACCENTS, "")) {
    if (ch >= "א" && ch <= "ת") out.push({ base: FINALS[ch] || ch, ch, marks: "" });
    else if (out.length && ch >= "ְ" && ch <= "ׇ") out[out.length - 1].marks += ch;
  }
  return out;
}

const vowelOf = (marks) => marks.replace(new RegExp("[" + DAGESH + SHIN_DOT + SIN_DOT + "ֽ]", "g"), "").replace(/[ֱֲֳ]/g, "ְ").replace("ׇ", "ָ");

/** Pattern skeleton of a pointed word, with its root letters replaced by פ-ע-ל. */
function templateKey(word, root) {
  const cl = clusters(word);
  // Furtive patah (רוּחַ, מִזְבֵּחַ) is not part of the pattern.
  const last = cl[cl.length - 1];
  const before = cl[cl.length - 2];
  if (last && before && "חעה".includes(last.base) && last.marks.includes(PATAH) &&
      (/[ִֵֹֻ]/.test(before.marks) || (before.base === "ו" || before.base === "י"))) {
    last.marks = last.marks.replace(PATAH, "");
  }
  const R = root.map((l) => FINALS[l] || l);
  // All ways to align the root letters (in order) with the word; prefer the tightest, latest one.
  let best = null;
  for (let i = 0; i < cl.length; i++) {
    if (cl[i].base !== R[0]) continue;
    for (let j = i + 1; j < cl.length; j++) {
      if (cl[j].base !== R[1]) continue;
      for (let k = j + 1; k < cl.length; k++) {
        if (cl[k].base !== R[2]) continue;
        const span = k - i;
        if (!best || span < best.span || (span === best.span && i > best.pos[0])) best = { span, pos: [i, j, k] };
      }
    }
  }
  if (!best) return null;
  const T = "פעל";
  const parts = cl.map((c, idx) => {
    const r = best.pos.indexOf(idx);
    let v = vowelOf(c.marks);
    // A root ו read as shuruk (בּוּשָׁה) behaves like a vowel.
    if (r >= 0 && c.base === "ו" && v === "" && c.marks.includes(DAGESH) && idx > 0) v = QUBUTS;
    // Strong dagesh in the middle root letter (after a full vowel) is part of the pattern: צַדִּיק vs. בַּיִת.
    else if (r === 1 && c.marks.includes(DAGESH) && idx > 0 && /[ִ-ֻ]/.test(vowelOf(cl[idx - 1].marks))) v = DAGESH + v;
    return { base: r >= 0 ? T[r] : c.ch, root: r >= 0, v };
  });
  // Silent shva under a final letter (מֶלֶךְ) is not part of the pattern.
  const end = parts[parts.length - 1];
  if (end.v === "ְ") end.v = "";
  // Matres lectionis outside the root: וֹ → ֹ, וּ → ֻ, ִי / ֵי → ִ / ֵ.
  let s = "";
  for (let n = 0; n < parts.length; n++) {
    const p = parts[n];
    const prev = n > 0 ? { v: parts[n - 1].v.replace(DAGESH, "") } : null;
    if (!p.root && prev && prev.v === "" && p.base === "ו" && p.v === HOLAM) { s += HOLAM; continue; }
    if (!p.root && prev && prev.v === "" && p.base === "ו" && p.v === "" && cl[n].marks.includes(DAGESH)) { s += QUBUTS; continue; }
    if (!p.root && prev && p.v === "" && ((p.base === "י" && (prev.v === HIRIQ || prev.v === "ֵ")) || (p.base === "ו" && prev.v === HOLAM))) continue;
    s += p.base + p.v;
  }
  return s.normalize("NFD");
}

/** The noun pattern of a lexicon entry, or null. Returns {item, group, key, suffix?}. */
function mishkalOf(entry, rootKeyLetters) {
  if (!entry || !entry.w || !rootKeyLetters || rootKeyLetters.length !== 3) return null;
  const pos = entry.pos || "";
  if (!(pos === "N" || pos === "A" || pos === "Ac" || pos === "Ag")) return null;
  const key = templateKey(entry.w, rootKeyLetters);
  if (!key) return null;
  // Some lemmas are plural (בְּחוּרִים): try the singular skeleton too.
  for (const k of [key, key.replace(/ִם$|ֹת$/, "")]) {
    for (const g of MISHKALIM) {
      for (const it of g.items) if (it.keys.some((x) => x.normalize("NFD") === k)) return { item: it, group: g, key: k };
    }
  }
  // A known derivational suffix after the last root letter.
  const tail = key.slice(key.lastIndexOf("ל") + 1);
  const suffixes = MISHKALIM.find((g) => g.id === "suffix");
  for (const it of suffixes.items) {
    if ((it.suffix || []).includes(tail)) return { item: it, group: suffixes, key };
  }
  if (pos === "Ag" || tail === HIRIQ) return { item: suffixes.items.find((x) => x.id === "m-suf-i"), group: suffixes, key };
  return null;
}

window.Mishkal = { MISHKALIM, mishkalOf, templateKey };

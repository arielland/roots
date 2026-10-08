// לוח עזר: a collapsible tree of binyanim, tenses, noun patterns and rules.
// When a word is selected, the tree opens at the nodes that explain it.
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => App.esc(s);
  const heb = (s) => '<span class="heb-inline">' + esc(s) + "</span>";

  // ------------------------------------------------------------ content

  function table(head, rows) {
    // rows: [key|null, ...cells]; cells starting with "~" are Hebrew forms.
    const cell = (c) => (typeof c === "string" && c.startsWith("~") ? "<td>" + heb(c.slice(1)) + "</td>" : "<td>" + esc(c) + "</td>");
    return '<table class="cs-table"><thead><tr>' + head.map((h) => "<th>" + esc(h) + "</th>").join("") + "</tr></thead><tbody>" +
      rows.map(([key, ...cells]) => "<tr" + (key ? ' data-key="' + key + '"' : "") + ">" + cells.map(cell).join("") + "</tr>").join("") +
      "</tbody></table>";
  }
  const p = (s) => "<p>" + s + "</p>";
  const ul = (items) => '<ul class="cs-list">' + items.map((i) => "<li>" + i + "</li>").join("") + "</ul>";
  const ex = (s) => '<p class="cs-ex">דוגמאות: ' + heb(s) + "</p>";

  // Hebrew binyanim with a paradigm of the root פקד.
  const BINYANIM = [
    { code: "q", signs: "אין תוספות לשורש. בעבר תנועת a (פָּקַד); בפעלי מצב גם פָּעֵל (כָּבֵד) או פָּעֹל (קָטֹן). בעתיד: יִפְעֹל או יִפְעַל.",
      forms: ["פָּקַד", "יִפְקֹד", "פְּקֹד", "פְּקֹד", "פֹּקֵד / פָּקוּד"] },
    { code: "N", signs: "נ' בתחילת העבר והבינוני (נִפְקַד, נִפְקָד). בעתיד, בציווי ובמקור הנ' נבלעת בדגש חזק בפ' הפועל (יִפָּקֵד, הִפָּקֵד); לפני גרונית – תשלום דגש בצירה (יֵאָסֵף).",
      forms: ["נִפְקַד", "יִפָּקֵד", "הִפָּקֵד", "הִפָּקֵד", "נִפְקָד"] },
    { code: "p", signs: "דגש חזק בע' הפועל בכל הצורות. בעבר חיריק בפ' (פִּקֵּד), בעתיד ובבינוני שווא בתחילית (יְפַקֵּד, מְפַקֵּד). לפני גרונית אין דגש והתנועה מתארכת (בֵּרַךְ).",
      forms: ["פִּקֵּד", "יְפַקֵּד", "פַּקֵּד", "פַּקֵּד", "מְפַקֵּד"] },
    { code: "P", signs: "קובוץ (u) תחת פ' הפועל, דגש חזק בע' ופתח תחתיה (פֻּקַּד). אין ציווי. בבינוני: מְפֻקָּד.",
      forms: ["פֻּקַּד", "יְפֻקַּד", "—", "—", "מְפֻקָּד"] },
    { code: "h", signs: "ה' בתחילת העבר (הִפְקִיד); בעתיד ובבינוני – פתח בתחילית (יַפְקִיד, מַפְקִיד). י' לפני ל' הפועל ברוב הצורות; בעתיד המקוצר ובציווי – צירה (וַיַּפְקֵד, הַפְקֵד).",
      forms: ["הִפְקִיד", "יַפְקִיד", "הַפְקֵד", "הַפְקִיד", "מַפְקִיד"] },
    { code: "H", signs: "קמץ קטן או קובוץ אחרי התחילית (הָפְקַד / הֻפְקַד, יָפְקַד, מָפְקָד), פתח בע' הפועל. אין ציווי.",
      forms: ["הָפְקַד", "יָפְקַד", "—", "—", "מָפְקָד"] },
    { code: "t", signs: "התחילית הִתְ־ (בעתיד יִתְ־, בבינוני מִתְ־) ודגש חזק בע' הפועל. כשפ' הפועל שורקת – הת' מתחלפת עמה (שיכול): הִשְׁתַּמֵּר, הִסְתַּתֵּר; ובצ' היא הופכת לט' ובז' לד' (הִצְטַדֵּק, הִזְדַּקֵּן). לפני ד', ט', ת' הת' נבלעת בדגש (הִטַּהֵר, הִתַּמָּם).",
      forms: ["הִתְפַּקֵּד", "יִתְפַּקֵּד", "הִתְפַּקֵּד", "הִתְפַּקֵּד", "מִתְפַּקֵּד"] },
  ];
  const MAIN_STEMS = BINYANIM.map((b) => b.code);

  function binyanimNode() {
    const H = Morph.STEMS_HEB, A = Morph.STEMS_ARC;
    const main = BINYANIM.map((b) => ({
      id: "binyan-H-" + b.code,
      title: H[b.code][0],
      sub: H[b.code][1].split(/[:(]/)[0].replace(/\.$/, ""),
      html: p(esc(H[b.code][1])) + p("<b>סימני הבניין:</b> " + esc(b.signs)) +
        table(["עבר", "עתיד", "ציווי", "מקור", "בינוני"], [[null, ...b.forms.map((f) => (f === "—" ? f : "~" + f))]]),
    }));
    const rare = Object.keys(H).filter((c) => !MAIN_STEMS.includes(c)).map((c) => ({
      id: "binyan-H-" + c, title: H[c][0], html: p(esc(H[c][1])),
    }));
    const arc = Object.keys(A).map((c) => ({ id: "binyan-A-" + c, title: A[c][0], html: p(esc(A[c][1])) }));
    return {
      id: "binyanim", title: "בניינים",
      html: p("הבניין הוא התבנית שבה יוצקים את אותיות השורש. שבעת הבניינים העיקריים מתחלקים לזוגות של פעיל וסביל: קַל–נִפְעַל, פִּעֵל–פֻּעַל, הִפְעִיל–הֻפְעַל, ולצדם הִתְפַּעֵל החוזר.") +
        table(["", "פעיל", "סביל / חוזר"], [
          [null, "פשוט", "~קַל", "~נִפְעַל"],
          [null, "מעצים (דגש בע')", "~פִּעֵל", "~פֻּעַל · הִתְפַּעֵל"],
          [null, "גורם", "~הִפְעִיל", "~הֻפְעַל"],
        ]),
      children: [
        { id: "binyanim-H", title: "שבעת הבניינים העיקריים", sub: "הדוגמאות מהשורש פקד", children: main },
        { id: "binyanim-H-rare", title: "בניינים נדירים וצורות מיוחדות", children: rare },
        { id: "binyanim-A", title: "בנייני הארמית", sub: "דניאל, עזרא", children: arc },
      ],
    };
  }

  const PERSONS = [
    ["1cs", "אני"], ["2ms", "אתה"], ["2fs", "את"], ["3ms", "הוא"], ["3fs", "היא"],
    ["1cp", "אנחנו"], ["2mp", "אתם"], ["2fp", "אתן"], ["3mp", "הם"], ["3fp", "הן"],
  ];
  const PAST = { "1cs": ["פָּקַדְתִּי", "־תִּי"], "2ms": ["פָּקַדְתָּ", "־תָּ"], "2fs": ["פָּקַדְתְּ", "־תְּ"], "3ms": ["פָּקַד", "—"],
    "3fs": ["פָּקְדָה", "־ָה"], "1cp": ["פָּקַדְנוּ", "־נוּ"], "2mp": ["פְּקַדְתֶּם", "־תֶּם"], "2fp": ["פְּקַדְתֶּן", "־תֶּן"], "3cp": ["פָּקְדוּ", "־וּ"] };
  const FUT = { "1cs": ["אֶפְקֹד", "אֶ־"], "2ms": ["תִּפְקֹד", "תִּ־"], "2fs": ["תִּפְקְדִי", "תִּ־ ־ִי"], "3ms": ["יִפְקֹד", "יִ־"],
    "3fs": ["תִּפְקֹד", "תִּ־"], "1cp": ["נִפְקֹד", "נִ־"], "2mp": ["תִּפְקְדוּ", "תִּ־ ־וּ"], "2fp": ["תִּפְקֹדְנָה", "תִּ־ ־נָה"],
    "3mp": ["יִפְקְדוּ", "יִ־ ־וּ"], "3fp": ["תִּפְקֹדְנָה", "תִּ־ ־נָה"] };

  function conjNode() {
    const C = Morph.CONJ;
    const pastRows = Object.entries(PAST).map(([k, [f, m]]) => ["past-" + k, k === "3cp" ? "הם / הן" : PERSONS.find((x) => x[0] === k)[1], "~" + f, m]);
    const futRows = PERSONS.map(([k, name]) => ["fut-" + k, name, "~" + FUT[k][0], FUT[k][1]]);
    const extra = {
      p: table(["גוף", "קַל", "סיומת"], pastRows) + p("סיומות העבר זהות בכל הבניינים: הִפְקַדְתִּי, נִפְקַדְנוּ, הִתְפַּקְּדוּ."),
      q: p("ו' החיבור לפני צורת עבר, בדרך כלל בהמשך לעתיד או לציווי; הטעם עובר לעיתים להברה האחרונה (וְאָמַרְתָּ֫)." ) + ex("וְאָמַרְתָּ, וְהָיָה, וְשָׁמַרְתֶּם"),
      i: table(["גוף", "קַל", "תחילית / סיומת"], futRows) + p("אותיות התחילית אית\"ן (א, י, ת, נ) מסמנות את הגוף בכל הבניינים."),
      w: p("וַ + דגש חזק באות התחילית (וַיִּפְקֹד); לפני א' – וָ (וָאֹמַר). לעיתים קרובות הצורה מקוצרת: וַיִּבֶן, וַיָּקָם, וַיַּפְקֵד.") + ex("וַיֹּאמֶר, וַיְהִי, וַיֵּלֶךְ"),
      h: ex("אֶשְׁמְרָה, נֵלְכָה, אֵרְדָה"),
      j: ex("יְהִי, יָקֻם, יַשְׁמֵד"),
      v: table(["", "קַל"], [["imp-ms", "זכר יחיד", "~פְּקֹד"], ["imp-fs", "נקבה יחידה", "~פִּקְדִי"], ["imp-mp", "זכר רבים", "~פִּקְדוּ"], ["imp-fp", "נקבה רבות", "~פְּקֹדְנָה"]]) +
        p("הציווי בנוי כעתיד בלי תחילית. לעיתים בא בהארכה ב־ה: שִׁמְרָה, שְׁמָעָה."),
      r: table(["", "קַל", "פִּעֵל", "הִפְעִיל"], [["ptc-ms", "זכר יחיד", "~פֹּקֵד", "~מְפַקֵּד", "~מַפְקִיד"], ["ptc-fs", "נקבה יחידה", "~פֹּקֶדֶת", "~מְפַקֶּדֶת", "~מַפְקֶדֶת"],
        ["ptc-mp", "זכר רבים", "~פֹּקְדִים", "~מְפַקְּדִים", "~מַפְקִידִים"], ["ptc-fp", "נקבה רבות", "~פֹּקְדוֹת", "~מְפַקְּדוֹת", "~מַפְקִידוֹת"]]),
      s: ex("פָּקוּד, בָּרוּךְ, כָּתוּב, שְׂנוּאָה"),
      a: ex("פָּקֹד (פָּקֹד יִפְקֹד), שָׁמוֹר, מוֹת תָּמוּת"),
      c: ex("לִפְקֹד, בִּפְקֹד, פָּקְדוֹ, לִשְׁמֹר, לָלֶכֶת"),
    };
    const groups = [
      { id: "conj-finite", title: "זמנים", codes: ["p", "i", "w", "q", "h", "j"] },
      { id: "conj-imp", title: "ציווי", codes: ["v"] },
      { id: "conj-nonfinite", title: "בינוני ומקור", codes: ["r", "s", "c", "a"] },
    ];
    return {
      id: "conj", title: "זמנים וצורות הפועל",
      html: p("כל צורה של פועל היא שילוב של בניין, זמן (או צורה בלתי נטויה) וגוף-מין-מספר."),
      children: groups.map((g) => ({
        id: g.id, title: g.title,
        children: g.codes.map((c) => ({ id: "conj-" + c, title: C[c][0], html: p(esc(C[c][1])) + (extra[c] || "") })),
      })),
    };
  }

  function nounNode() {
    return {
      id: "noun", title: "נטיית השם",
      children: [
        { id: "n-gender-number", title: "מין ומספר",
          html: table(["", "סיומת", "דוגמה"], [
            ["noun-ms", "זכר יחיד", "—", "~סוּס, דָּבָר"],
            ["noun-fs", "נקבה יחידה", "~־ָה / ־ֶת / ־ִית / ־וּת", "~סוּסָה, מַמְלָכָה, דַּעַת"],
            ["noun-mp", "זכר רבים", "~־ִים", "~סוּסִים, דְּבָרִים"],
            ["noun-fp", "נקבה רבות", "~־וֹת", "~סוּסוֹת, מַמְלָכוֹת"],
            ["noun-d", "זוגי", "~־ַיִם", "~יָדַיִם, עֵינַיִם, שְׁנָתַיִם"],
          ]) + p("יש שמות זכר ברבים ב־וֹת (אָבוֹת) ושמות נקבה ב־ִים (נָשִׁים). המין הדקדוקי נקבע לפי ההתאמה לתואר ולפועל.") },
        { id: "n-state", title: "נפרד ונסמך",
          html: p("הנסמך הוא צורת השם כשהוא קשור למילה שאחריו (בֵּית הַמֶּלֶךְ). הטעם עובר אל המילה הבאה, ולכן תנועות הנסמך מתקצרות.") +
            table(["", "נפרד", "נסמך"], [
              ["state-ms", "זכר יחיד", "~דָּבָר", "~דְּבַר"],
              ["state-fs", "נקבה יחידה", "~מַמְלָכָה", "~מַמְלֶכֶת (־ַת)"],
              ["state-mp", "זכר רבים", "~דְּבָרִים", "~דִּבְרֵי (־ֵי)"],
              ["state-fp", "נקבה רבות", "~מַמְלָכוֹת", "~מַמְלְכוֹת"],
              ["state-d", "זוגי", "~עֵינַיִם", "~עֵינֵי (־ֵי)"],
            ]) + p("ה' הידיעה באה רק על המילה האחרונה בצירוף הסמיכות: בֵּית הַמֶּלֶךְ ולא הַבֵּית הַמֶּלֶךְ.") },
        { id: "n-suffixes", title: "שם עם כינוי חבור", html: p("כינויי הקניין מצטרפים לצורת הנסמך: דְּבַר → דְּבָרוֹ, דִּבְרֵי → דְּבָרָיו. ראו בטבלת הכינויים החבורים.") },
      ],
    };
  }

  function prefixNode() {
    return {
      id: "prefixes", title: "תחיליות",
      children: [
        { id: "p-vav", title: "ו' החיבור", sub: "וְ",
          html: ul(["בדרך כלל בשווא: " + heb("וְהָאָרֶץ") + ".",
            "לפני האותיות בומ\"ף (ב, ו, מ, פ) ולפני שווא – שורוק: " + heb("וּבַיִת, וּמֶלֶךְ, וּשְׁמוֹ") + ".",
            "לפני יְ – " + heb("וִי") + ": " + heb("וִיהוּדָה") + ".",
            "לפני חטף – התנועה המקבילה: " + heb("וַאֲנִי, וֶאֱמֶת") + ".",
            "לפני הברה מוטעמת, בעיקר בזוגות – קמץ: " + heb("טוֹב וָרָע") + "."]) },
        { id: "p-vav-hipuch", title: "ו' ההיפוך", sub: "וַיִּ / וְקָטַל",
          html: ul(["לפני עתיד: " + heb("וַ") + " + דגש חזק באות התחילית – משמעות של עבר סיפורי: " + heb("וַיֹּאמֶר, וַיֵּלֶךְ") + ".",
            "לפני א' (שאינה מקבלת דגש) – קמץ: " + heb("וָאֹמַר, וָאֵרֶא") + ".",
            "לפני עבר: " + heb("וְ") + " רגילה, אך המשמעות לרוב עתידית או הרגלית: " + heb("וְאָמַרְתָּ") + "."]) },
        { id: "p-article", title: "ה' הידיעה", sub: "הַ",
          html: ul([heb("הַ") + " + דגש חזק באות הבאה: " + heb("הַמֶּלֶךְ") + ".",
            "לפני א, ע, ר (שאינן מקבלות דגש) – תשלום דגש בקמץ: " + heb("הָאָרֶץ, הָעִיר, הָרֹאשׁ") + ".",
            "לפני ה, ח – פתח בלי דגש (דגש חזק משתמע): " + heb("הַחֹשֶׁךְ, הַהוּא") + ".",
            "לפני הָ, עָ, חָ שאינן מוטעמות – סגול: " + heb("הֶהָרִים, הֶחָכָם") + ".",
            "אחרי אותיות בכ\"ל הה' נשמטת והתנועה שלה עוברת אליהן: " + heb("בַּבַּיִת, לָעִיר") + "."]) },
        { id: "p-he-sheela", title: "ה' השאלה", sub: "הֲ",
          html: ul(["בחטף פתח: " + heb("הֲשֹׁמֵר אָחִי אָנֹכִי") + ".", "לפני שווא – פתח: " + heb("הַבְּרָכָה") + "; לפני גרונית – פתח או סגול: " + heb("הַאַתָּה, הֶעָנִי") + ".",
            "בניגוד לה' הידיעה – אין אחריה דגש."]) },
        { id: "p-bkl", title: "אותיות היחס ב, כ, ל", sub: "בְּ כְּ לְ",
          html: ul(["בדרך כלל בשווא: " + heb("בְּבַיִת, לְמֶלֶךְ") + ".",
            "לפני שווא – חיריק: " + heb("בִּשְׁמוֹ, לִפְנֵי") + "; לפני יְ – " + heb("בִּי") + ": " + heb("בִּירוּשָׁלַיִם") + ".",
            "לפני חטף – התנועה המקבילה: " + heb("לַאֲדֹנִי, בֶּאֱמֶת, כָּאֳנִיָּה") + ".",
            "עם ה' הידיעה – הה' נבלעת: " + heb("בַּבַּיִת, לָאָרֶץ, כַּיּוֹם") + ".",
            "לפני הברה מוטעמת – לעיתים קמץ: " + heb("לָשֶׁבֶת, לָנֶצַח") + "; ובמילה אֱלֹהִים – " + heb("לֵאלֹהִים, בֵּאלֹהִים") + "."]) },
        { id: "p-mem", title: "מ' היחס", sub: "מִן",
          html: ul(["מִן מקוצרת לתחילית " + heb("מִ") + " + דגש חזק (הנ' נבלעת): " + heb("מִבַּיִת, מִשָּׁם") + ".",
            "לפני גרונית – תשלום דגש בצירה: " + heb("מֵאֶרֶץ, מֵעִיר") + "; לפני ח' לעיתים חיריק בלי דגש: " + heb("מִחוּץ") + ".",
            "לפני ה' הידיעה בדרך כלל באה כמילה נפרדת: " + heb("מִן הָאָרֶץ") + "."]) },
        { id: "p-shin", title: "ש' הזיקה", sub: "שֶׁ",
          html: p(heb("שֶׁ") + " + דגש חזק (כמו אֲשֶׁר). נפוצה בספרים המאוחרים ובשיר השירים: " + heb("שֶׁהָיָה, שַׁלָּמָה") + ".") },
      ],
    };
  }

  function suffixNode() {
    const S = Morph.SUFFIX_MEANING;
    const forms = { "1cs": "סוּסִי", "1cp": "סוּסֵנוּ", "2ms": "סוּסְךָ", "2fs": "סוּסֵךְ", "2mp": "סוּסְכֶם", "2fp": "סוּסְכֶן",
      "3ms": "סוּסוֹ", "3fs": "סוּסָהּ", "3mp": "סוּסָם", "3fp": "סוּסָן" };
    const rows = PERSONS.map(([k, name]) => ["suf-" + k, name, "~" + forms[k], S[k][0], S[k][1], S[k][2]]);
    return {
      id: "suffixes", title: "סופיות",
      children: [
        { id: "s-pron", title: "כינויים חבורים", sub: "שלו, אותו, לו",
          html: p("כינוי חבור בסוף שם הוא כינוי קניין (סוּסוֹ = הסוס שלו); בסוף פועל – מושא (שְׁמָרוֹ = שמר אותו); בסוף מילת יחס – כמו " + heb("לוֹ, בּוֹ, מִמֶּנּוּ") + ".") +
            table(["גוף", "על שם", "שם", "פועל", "יחס"], rows) +
            p("על שם ברבים מופיעה י' לפני הכינוי: " + heb("סוּסָיו, סוּסֶיהָ, סוּסֵיהֶם") + ".") },
        { id: "s-he-megama", title: "ה' המגמה", sub: "־ָה",
          html: p("ה' בלי מפיק ובלי טעם בסוף שם מקום או כיוון, במשמעות 'אל': " + heb("אַרְצָה, הַבַּיְתָה, מִצְרַיְמָה, צָפוֹנָה") + ".") },
        { id: "s-nun", title: "נ' יתירה (נון פרגוגית)", html: p("נ' בסוף פעלי עתיד ברבים או בנקבה, בלי שינוי משמעות: " + heb("יִשְׁמְרוּן, תֵּדְעוּן") + ".") },
        { id: "s-he-yetera", title: "ה' יתירה", html: p("ה' נוספת בסוף מילים בלי שינוי משמעות, בעיקר בשירה: " + heb("עֶזְרָתָה, לַיְלָה") + ".") },
        { id: "s-aram-def", title: "יידוע בארמית", sub: "־ָא", html: p("בארמית היידוע בא בסוף המילה בסיומת ־ָא (או ־ָה): " + heb("מַלְכָּא, אַרְעָא") + " = המלך, הארץ.") },
      ],
    };
  }

  function particlesNode() {
    return {
      id: "particles", title: "מיליות",
      children: [
        { id: "t-et", title: "אֶת – סימן המושא", html: p("מילית לפני מושא ישיר מיודע; אין לה תרגום. עם כינויים: " + heb("אֹתִי, אֹתְךָ, אֹתוֹ, אֹתָם") + ". שימו לב: " + heb("אִתּוֹ") + " = עמו (מילת היחס אֵת).") },
        { id: "t-neg", title: "מילות שלילה", html: ul([heb("לֹא") + " – שלילה כללית; לפני עתיד – איסור מוחלט (לֹא תִרְצָח).", heb("אַל") + " – איסור או משאלה, לפני עתיד מקוצר (אַל תִּירָא).", heb("אֵין") + " – שלילת קיום (אֵין אִישׁ).", heb("בַּל, בְּלִי, בִּלְתִּי") + " – בעיקר בשירה ובמקור (לְבִלְתִּי)."]) },
        { id: "t-other", title: "מיליות נוספות", html: ul([heb("הִנֵּה") + " – מילת הצבעה (הִנְנִי, הִנּוֹ).", heb("נָא") + " – מילת בקשה (לְכָה נָּא).", heb("אֲשֶׁר") + " – מילת זיקה; גם ש'.", heb("גַּם, אַף") + " – חיזוק.", heb("הוֹי, אָהּ, אוֹי") + " – קריאה."]) },
      ],
    };
  }

  function gizrotNode() {
    const G = [
      ["g-shlemim", "שלמים", "כל אותיות השורש יציבות ונשמעות בכל הנטיות.", "שָׁמַר, יִשְׁמֹר, פָּקַד"],
      ["g-pn", "פ\"נ", "נ' בראש השורש נבלעת בדגש חזק כשאין אחריה תנועה: בעתיד קל, בנפעל עבר, בהפעיל ובהופעל. בציווי ובמקור היא נושרת לגמרי (גַּשׁ, גֶּשֶׁת).", "נָפַל → יִפֹּל, הִפִּיל, הֻגַּד; נָגַשׁ → גַּשׁ"],
      ["g-py", "פ\"י / פ\"ו", "שתי קבוצות: פ\"ו מקורית – בעתיד קל הי' נושרת (יֵשֵׁב, לָדַעַת), ובנפעל ובהפעיל חוזרת ו' (נוֹשַׁב, הוֹשִׁיב); פ\"י מקורית – הי' נחה (יִיטַב, הֵיטִיב).", "יָשַׁב → יֵשֵׁב, שֵׁב, שֶׁבֶת, הוֹשִׁיב; יָטַב → הֵיטִיב"],
      ["g-pa", "פ\"א", "א' בראש השורש היא גרונית: חטף פתח ותנועת a (יַאֲסֹף). בחמישה פעלים – אבה, אבד, אכל, אמר, אפה – היא נחה בעתיד קל ותחילית העתיד בחולם.", "יֹאמַר, וַיֹּאכַל, יַאֲסֹף"],
      ["g-ayw", "ע\"ו / ע\"י", "האות האמצעית נחה ונשמעת כתנועה. בקל עבר בן הברה אחת (קָם, שָׂם), בעתיד יָקוּם / יָשִׂים, ובהפעיל הֵקִים. בבנייני הדגש במקום פִּעֵל באים פּוֹלֵל והִתְפּוֹלֵל.", "קוּם → קָם, יָקוּם, הֵקִים, קוֹמֵם; שִׂים → יָשִׂים"],
      ["g-lh", "ל\"ה (ל\"י)", "האות האחרונה היא במקורה י' או ו'. בסוף המילה כתובה ה' (בָּנָה, יִבְנֶה), לפני סיומות עיצוריות היא חוזרת כי' (בָּנִיתִי), לפני סיומות תנועה היא נושרת (בָּנוּ), במקור ־וֹת (בְּנוֹת), ובעתיד המקוצר נשמטת (וַיִּבֶן).", "בָּנָה, בָּנִיתִי, יִבְנֶה, וַיִּבֶן, לִבְנוֹת"],
      ["g-la", "ל\"א", "א' בסוף השורש נחה כשאין אחריה תנועה; התנועה שלפניה מתארכת (מָצָאתִי, יִמְצָא) ובנקבה רבות לעיתים סגול (תִּמְצֶאנָה).", "מָצָא, מָצָאתִי, יִמְצָא, קְרָא"],
      ["g-ayin", "כפולים (ע\"ע)", "שתי האותיות האחרונות זהות. לעיתים הן מתמזגות לאות אחת עם דגש כשמתווספת סיומת (סַבּוּ), ובעתיד קל ובהפעיל צורות קצרות (יָסֹב, הֵסֵב). במקום פִּעֵל באים פּוֹלֵל ופִלְפֵּל.", "סָבַב / סַב, יָסֹב, סַבּוֹתָ, הֵסֵב"],
      ["g-gut-p", "פ' גרונית", "גרונית (ה, ח, ע) בראש השורש מקבלת חטף במקום שווא, ותנועת התחילית מתאימה לה (יַעֲמֹד, נֶעֱזַב).", "עָמַד → יַעֲמֹד; חָזַק → יֶחֱזַק"],
      ["g-gut-a", "ע' גרונית", "גרונית באמצע השורש אינה מקבלת דגש חזק: בבנייני הדגש יש תשלום דגש (בֵּרַךְ במקום *בִּרֵּךְ) או דגש חזק משתמע (נִחַם). במקום שווא נע – חטף פתח (שָׁאֲלוּ).", "שָׁאַל, שָׁאֲלוּ; בֵּרַךְ, מְבָרֵךְ"],
      ["g-gut-l", "ל' גרונית", "ח' או ע' בסוף השורש מושכות אליהן תנועת a: יִשְׁמַע במקום *יִשְׁמֹע; אחרי תנועה ארוכה – פתח גנובה (שׁוֹמֵעַ, הִשְׁמִיעַ).", "שָׁמַע, יִשְׁמַע, שֹׁמֵעַ, שָׁלַח"],
      ["g-two", "שורש דו-עיצורי", "השורש רשום במילון בשתי אותיות – לרוב שורש ע\"ו/ע\"י או כפולים, או מילה קדומה שאינה נגזרת מפועל (אָב, יָד).", "אָב, יָד, דָּם"],
      ["g-four", "שורש מרובע", "שורש בן ארבע אותיות; נוטה בדרך כלל בבנייני הדגש (פִּעֵל וחבריו).", "כִּלְכֵּל, כִּרְסֵם"],
      ["g-special", "שורשים מיוחדים", "כמה פעלים נפוצים חורגים מגזרתם: הלך נוטה כפ\"י (יֵלֵךְ, לֵךְ), לקח נוטה כפ\"נ (יִקַּח, קַח), ונתן הוא גם פ\"נ וגם ל\"נ (יִתֵּן, נָתַתִּי).", "וַיֵּלֶךְ, קַח, נָתַתִּי"],
    ];
    return {
      id: "gizrot", title: "גזרות",
      html: p("הגזרה היא קבוצת שורשים שאחת מאותיותיהם 'חלשה' (נ, י, ו, א, ה או גרונית) ומשנה את הנטייה הרגילה. שם הגזרה מציין את מקום האות לפי פ-ע-ל: פ\"נ = נ' במקום פ' הפועל."),
      children: G.map(([id, title, expl, exs]) => ({ id, title, html: p(esc(expl)) + ex(exs) })),
    };
  }

  function mishkalimNode() {
    return {
      id: "mishkalim", title: "משקלים (שמות ותארים)",
      html: p("המשקל הוא התבנית של שם או תואר: אותיות השורש (מסומנות פ-ע-ל) ועמן תנועות, דגשים ואותיות נוספות. הזיהוי באתר נעשה אוטומטית לפי צורת המילון של המילה, ולכן הוא משוער."),
      children: Mishkal.MISHKALIM.map((g) => ({
        id: "mg-" + g.id, title: g.title,
        children: g.items.map((it) => ({ id: it.id, title: it.name, html: (it.expl ? p(esc(it.expl)) : "") + ex(it.ex) })),
      })),
    };
  }

  function basicsNode() {
    return {
      id: "basics", title: "כללי יסוד בניקוד",
      children: [
        { id: "b-dagesh", title: "דגש קל ודגש חזק", html: ul(["<b>דגש קל</b> – רק באותיות בג\"ד כפ\"ת, בתחילת מילה או אחרי שווא נח: " + heb("בַּיִת, מִשְׁפָּט") + ".", "<b>דגש חזק</b> – מכפיל את האות; בא אחרי תנועה. סימן לבניינים פִּעֵל/פֻּעַל/הִתְפַּעֵל, לה' הידיעה ולאות שנבלעה (נ' בפ\"נ).", "האותיות א, ה, ח, ע, ר אינן מקבלות דגש חזק: בא תשלום דגש (התנועה שלפניהן מתארכת) או דגש משתמע."]) },
        { id: "b-shva", title: "שווא נע ושווא נח", html: ul(["<b>נע</b> – בראש מילה, תחת אות דגושה, אחרי תנועה גדולה בלי טעם, וכשהשני מבין שני שוואים רצופים: " + heb("שְׁמוּאֵל, יִשְׁמְרוּ") + ".", "<b>נח</b> – סוגר הברה: " + heb("יִשְׁ־מֹר") + "."]) },
        { id: "b-chataf", title: "חטפים", html: p("תחת אותיות גרוניות בא חטף (ֲ ֱ ֳ) במקום שווא נע: " + heb("אֲנִי, אֱמֶת, חֳלִי") + ". אות שלפני חטף מקבלת את התנועה המקבילה לו (יַעֲמֹד).") },
        { id: "b-patah-genuva", title: "פתח גנובה", html: p("פתח תחת ח, ע או ה (במפיק) בסוף מילה אחרי תנועה שאינה a – נקרא לפני האות: " + heb("רוּחַ, שֹׁמֵעַ, גָּבֹהַּ") + ".") },
      ],
    };
  }

  // ------------------------------------------------------------ rendering

  let built = false;
  const nodes = {}; // id → <details>

  function nodeHTML(n, depth) {
    return '<details class="cs-node depth-' + depth + '" data-id="' + n.id + '"><summary><span class="cs-title">' + esc(n.title) + "</span>" +
      (n.sub ? '<span class="cs-sub">' + esc(n.sub) + "</span>" : "") + "</summary>" +
      '<div class="cs-body">' + (n.html || "") + (n.children ? n.children.map((c) => nodeHTML(c, depth + 1)).join("") : "") + "</div></details>";
  }

  function build() {
    if (built) return;
    built = true;
    const tree = [binyanimNode(), conjNode(), gizrotNode(), mishkalimNode(), nounNode(), prefixNode(), suffixNode(), particlesNode(), basicsNode()];
    $("cs-tree").innerHTML = tree.map((n) => nodeHTML(n, 0)).join("");
    $("cs-tree").querySelectorAll("details[data-id]").forEach((d) => { nodes[d.dataset.id] = d; });
  }

  // ------------------------------------------------------------ word → nodes

  /** The cheat-sheet nodes (and table rows) that explain an analysed word. */
  function targetsFor(ctx) {
    const ids = [], keys = [];
    const add = (id) => { if (id && !ids.includes(id)) ids.push(id); };
    const a = ctx.analysis;
    const main = a.main;
    const c = (main.code || "").split("");
    const gn = (g, n) => (n === "d" ? "d" : (g === "f" ? "f" : "m") + (n === "p" ? "p" : "s"));
    if (main.kind === "verb") {
      add("binyan-" + (a.lang === "A" ? "A" : "H") + "-" + c[1]);
      add("conj-" + c[2]);
      if ("pq".includes(c[2])) keys.push("past-" + (c[3] === "3" && c[5] === "p" ? "3cp" : c.slice(3, 6).join("")));
      else if ("iwhj".includes(c[2])) keys.push("fut-" + c.slice(3, 6).join("").replace(/^1[mf]/, "1c"));
      else if (c[2] === "v") keys.push("imp-" + c[4] + c[5]);
      else if ("rs".includes(c[2])) {
        keys.push("ptc-" + gn(c[3], c[4]));
        if (c[5] === "c") { add("n-state"); keys.push("state-" + gn(c[3], c[4])); }
      }
    } else if (main.kind === "noun" || main.kind === "adjective") {
      const [g, n, st] = [c[2], c[3], c[4]];
      if (!(main.kind === "noun" && c[1] === "p")) {
        if (ctx.mishkal) add(ctx.mishkal.item.id);
        if (n) { add("n-gender-number"); keys.push("noun-" + gn(g, n)); }
        if (st === "c") { add("n-state"); keys.push("state-" + gn(g, n)); }
      }
    } else if (main.kind === "prep" && "bklm".includes(main.lemma || "")) {
      add(main.lemma === "m" ? "p-mem" : "p-bkl");
    } else if (main.kind === "particle") {
      const t = c[1];
      add(t === "o" ? "t-et" : t === "n" ? "t-neg" : t === "i" ? "p-he-sheela" : "t-other");
    }
    for (const s of a.segments) {
      if (s.role === "main") continue;
      const sc = s.code || "";
      if (s.kind === "conj") add(s.title === "ו' ההיפוך" ? "p-vav-hipuch" : "p-vav");
      else if (s.kind === "particle" && sc[1] === "d") add(s.role === "suffix" ? "s-aram-def" : "p-article");
      else if (s.kind === "particle" && sc[1] === "i") add("p-he-sheela");
      else if (s.kind === "particle" && sc[1] === "r") add("p-shin");
      else if (s.kind === "prep") {
        add(s.lemma === "m" ? "p-mem" : "p-bkl");
        if (sc[1] === "d") add("p-article");
      } else if (s.kind === "suffix") {
        if (sc[1] === "p") {
          add("s-pron");
          keys.push("suf-" + sc.slice(2, 5).replace(/^1[mf]/, "1c").replace(/^([23])c/, "$1m"));
          if (main.kind === "noun") add("n-suffixes");
        } else if (sc[1] === "d") add("s-he-megama");
        else if (sc[1] === "n") add("s-nun");
        else if (sc[1] === "h") add("s-he-yetera");
      }
    }
    for (const r of ctx.roots || []) for (const g of Roots.gizrot(r.root)) add(g[2]);
    return { ids, keys };
  }

  /** Mishkal of the word's lexicon entry (nouns and adjectives only). */
  function mishkalFor(entry, roots, mainCode) {
    if (!entry || !roots || !roots.length || !mainCode || "NA".indexOf(mainCode[0]) < 0 || mainCode[1] === "p") return null;
    for (const r of roots) {
      const m = Mishkal.mishkalOf(entry, r.key.split(""));
      if (m) return m;
    }
    return null;
  }

  // ------------------------------------------------------------ reveal

  let focus = null; // {ctx, targets, label}
  const sheetOpen = () => !$("cheatsheet").hidden;

  function clearHits() {
    $("cs-tree").querySelectorAll(".hit").forEach((e) => e.classList.remove("hit"));
  }

  function openPath(el) {
    for (let d = el.closest("details"); d; d = d.parentElement.closest("details")) d.open = true;
  }

  function setAll(open) {
    Object.values(nodes).forEach((d) => { d.open = open; });
  }

  function scrollToEl(el) {
    const box = $("cheatsheet");
    const head = $("cs-head").offsetHeight;
    box.scrollTop += el.getBoundingClientRect().top - box.getBoundingClientRect().top - head - 8;
  }

  /** Collapse the tree and open it exactly at the given nodes/rows. */
  function reveal(targets, onlyId) {
    build();
    clearFilter();
    clearHits();
    setAll(false);
    const ids = onlyId ? [onlyId] : targets.ids;
    const hits = [];
    for (const id of ids) {
      const d = nodes[id];
      if (!d) continue;
      d.classList.add("hit");
      openPath(d);
      hits.push(d);
    }
    if (!onlyId) {
      for (const k of targets.keys) {
        $("cs-tree").querySelectorAll('[data-key="' + k + '"]').forEach((row) => {
          const d = row.closest("details");
          if (!ids.includes(d.dataset.id)) return; // only rows inside the relevant nodes
          row.classList.add("hit");
          openPath(row);
        });
      }
    }
    renderContext(hits);
    if (hits.length) requestAnimationFrame(() => scrollToEl(hits.sort((x, y) => (x.compareDocumentPosition(y) & 4 ? -1 : 1))[0]));
  }

  function renderContext(hits) {
    const el = $("cs-context");
    if (!focus) {
      el.innerHTML = '<span class="muted">בחרו מילה בטקסט, והלוח ייפתח במקומות הרלוונטיים לה.</span>';
      $("cs-focus").disabled = true;
      return;
    }
    $("cs-focus").disabled = false;
    const titles = hits.map((d) => '<button type="button" class="chip" data-goto="' + d.dataset.id + '">' + esc(d.querySelector(".cs-title").textContent) + "</button>");
    el.innerHTML = '<span class="cs-word">' + heb(focus.label) + "</span>" + (titles.length ? '<div class="chips">' + titles.join("") + "</div>" : '<span class="muted">אין ללוח מה להוסיף על מילה זו.</span>');
  }

  // ------------------------------------------------------------ filter

  const NIQQUD = /[֑-ׇ]/g;
  function applyFilter(q) {
    q = q.replace(NIQQUD, "").trim();
    const all = Object.values(nodes);
    if (!q) { clearFilter(); return; }
    clearHits();
    for (const d of all) {
      const match = d.textContent.replace(NIQQUD, "").includes(q);
      d.hidden = !match;
      d.open = match;
    }
  }
  function clearFilter() {
    const f = $("cs-filter");
    if (f.value) f.value = "";
    Object.values(nodes).forEach((d) => { d.hidden = false; });
  }

  // ------------------------------------------------------------ open / close

  function setOpen(open) {
    build();
    $("cheatsheet").hidden = !open;
    document.body.classList.toggle("sheet-open", open);
    $("toggle-sheet").setAttribute("aria-pressed", open ? "true" : "false");
    try { localStorage.setItem("roots-sheet", open ? "1" : "0"); } catch (e) { /* ignore */ }
    if (open) {
      measureTopbar();
      if (focus) reveal(focus.targets);
      else renderContext([]);
    }
  }

  function measureTopbar() {
    const h = document.querySelector(".topbar").offsetHeight;
    document.documentElement.style.setProperty("--topbar-h", h + "px");
  }

  /** Called whenever a word is analysed (reader panel, practice feedback). */
  function focusWord(ctx) {
    const mainCode = ctx.analysis.main.code;
    if (ctx.mishkal === undefined) ctx.mishkal = mishkalFor(ctx.entry, ctx.roots, mainCode);
    focus = { ctx, targets: targetsFor(ctx), label: ctx.label };
    if (sheetOpen()) reveal(focus.targets);
  }

  function clearFocus() {
    focus = null;
    if (sheetOpen()) { clearHits(); renderContext([]); }
  }

  /** Open the sheet at one node (from a link in the word panel). */
  function show(id) {
    if (!sheetOpen()) setOpen(true);
    reveal(focus ? focus.targets : { ids: [], keys: [] }, id);
    if (focus) {
      // Keep the relevant rows highlighted inside the shown node.
      for (const k of focus.targets.keys) {
        nodes[id] && nodes[id].querySelectorAll('[data-key="' + k + '"]').forEach((r) => r.classList.add("hit"));
      }
      renderContext(focus.targets.ids.map((x) => nodes[x]).filter(Boolean));
    }
  }

  function bind() {
    $("toggle-sheet").addEventListener("click", () => setOpen(!sheetOpen()));
    $("cs-close").addEventListener("click", () => setOpen(false));
    $("cs-expand").addEventListener("click", () => { clearFilter(); setAll(true); });
    $("cs-collapse").addEventListener("click", () => { clearFilter(); setAll(false); });
    $("cs-focus").addEventListener("click", () => { if (focus) reveal(focus.targets); });
    $("cs-filter").addEventListener("input", (e) => applyFilter(e.target.value));
    $("cs-context").addEventListener("click", (e) => {
      const b = e.target.closest("[data-goto]");
      if (b && nodes[b.dataset.goto]) { openPath(nodes[b.dataset.goto]); scrollToEl(nodes[b.dataset.goto]); }
    });
    window.addEventListener("resize", measureTopbar);
    let saved = null;
    try { saved = localStorage.getItem("roots-sheet"); } catch (e) { /* ignore */ }
    if (saved === "1") setOpen(true);
  }

  window.Cheat = { focusWord, clearFocus, show, mishkalFor, targetsFor, setOpen };
  bind();
})();

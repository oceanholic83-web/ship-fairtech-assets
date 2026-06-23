## Homepage Pick Section Rebuild

3 files to modify: config.json, build.js, template.html

---

### FILE 1: config.json

Replace the entire file content with:

```json
{
  "site": "https://faircast.kr",
  "excludeCategoryIds": [47],
  "deskPick": [
    "ten-shipping-routes-korea-perspective-2026",
    "classification-society-iacs-12-korean-register-kr-guide",
    "pi-clubs-mutual-insurance-korea-shipping-explained"
  ],
  "proPick": [
    "shadow-fleet-dark-fleet-2026-korea-5-touchpoints-guide",
    "hormuz-reopening-tanker-rate-floor-supply-constraint-korea-2026",
    "vlcc-fleet-900-effective-570-supply-gap-korea-2026"
  ],
  "categoryLabels": {
    "1": "Hello Korea",
    "8": "Hello World",
    "47": "항만",
    "192": "분석",
    "228": "시장",
    "229": "산업",
    "230": "항로·항만",
    "231": "지정학",
    "232": "일반",
    "233": "Korea Market",
    "234": "Korea Industry",
    "235": "Explainer"
  },
  "fallbackImage": "https://res.cloudinary.com/dzatgu3y7/image/upload/q_auto/f_auto/v1/ship-fairtech/placeholder.jpg",
  "excerptMaxLen": 90
}
```

---

### FILE 2: build.js

**Change 1:** After line 17 (`const PICK_SLUGS = cfg.editorsPick || [];`), replace that line with:

Find:
```
const PICK_SLUGS = cfg.editorsPick || [];
```

Replace with:
```
const DESK_SLUGS = cfg.deskPick || [];
const PRO_SLUGS = cfg.proPick || [];
```

**Change 2:** In the main async block, find:

```
  // 1. Editor's Pick 슬러그 → 글 fetch (병렬)
  console.log('1. Fetching Editor\'s Pick posts...');
  const picks = await Promise.all(PICK_SLUGS.map(fetchPostBySlug));
  const validPicks = picks.filter(Boolean);
  if (validPicks.length < 3) {
    console.warn(`  ⚠ Only ${validPicks.length} Editor's Picks resolved (expected 3)`);
  }
  const pickIds = new Set(validPicks.map(p => p.id));
```

Replace with:

```
  // 1. Desk Pick + Pro Pick 슬러그 → 글 fetch (병렬)
  console.log('1. Fetching Desk Pick posts...');
  const deskPicks = await Promise.all(DESK_SLUGS.map(fetchPostBySlug));
  const validDesk = deskPicks.filter(Boolean);
  if (validDesk.length < 3) {
    console.warn(`  ⚠ Only ${validDesk.length} Desk Picks resolved (expected 3)`);
  }

  console.log('   Fetching Pro Pick posts...');
  const proPicks = await Promise.all(PRO_SLUGS.map(fetchPostBySlug));
  const validPro = proPicks.filter(Boolean);
  if (validPro.length < 3) {
    console.warn(`  ⚠ Only ${validPro.length} Pro Picks resolved (expected 3)`);
  }

  const pickIds = new Set([...validDesk, ...validPro].map(p => p.id));
```

**Change 3:** Find:

```
  const pickMeta = validPicks.map(extractMeta);
```

Replace with:

```
  const deskMeta = validDesk.map(extractMeta);
  const proMeta = validPro.map(extractMeta);
```

**Change 4:** Find the entire "Editor's Pick 3편" replacement block:

```
  // Editor's Pick 3편
  for (let i = 0; i < 3; i++) {
    const m = pickMeta[i] || { url: '#', title: '(Pick 슬러그 확인 필요)', excerpt: '', imgUrl: FALLBACK_IMG };
    const n = i + 1;
    out = out.replace(new RegExp(`\\{\\{PICK_${n}_URL\\}\\}`, 'g'), escHtml(m.url));
    out = out.replace(new RegExp(`\\{\\{PICK_${n}_IMG\\}\\}`, 'g'), escHtml(m.imgUrl));
    out = out.replace(new RegExp(`\\{\\{PICK_${n}_TITLE\\}\\}`, 'g'), escHtml(m.title));
    out = out.replace(new RegExp(`\\{\\{PICK_${n}_EXC\\}\\}`, 'g'), escHtml(m.excerpt));
  }
```

Replace with:

```
  // Desk Pick 3편
  for (let i = 0; i < 3; i++) {
    const m = deskMeta[i] || { url: '#', title: '(Desk Pick 슬러그 확인 필요)', excerpt: '', imgUrl: FALLBACK_IMG };
    const n = i + 1;
    out = out.replace(new RegExp(`\\{\\{DESK_${n}_URL\\}\\}`, 'g'), escHtml(m.url));
    out = out.replace(new RegExp(`\\{\\{DESK_${n}_IMG\\}\\}`, 'g'), escHtml(m.imgUrl));
    out = out.replace(new RegExp(`\\{\\{DESK_${n}_TITLE\\}\\}`, 'g'), escHtml(m.title));
    out = out.replace(new RegExp(`\\{\\{DESK_${n}_EXC\\}\\}`, 'g'), escHtml(m.excerpt));
  }

  // Pro Pick 3편
  for (let i = 0; i < 3; i++) {
    const m = proMeta[i] || { url: '#', title: '(Pro Pick 슬러그 확인 필요)', excerpt: '', imgUrl: FALLBACK_IMG };
    const n = i + 1;
    out = out.replace(new RegExp(`\\{\\{PRO_${n}_URL\\}\\}`, 'g'), escHtml(m.url));
    out = out.replace(new RegExp(`\\{\\{PRO_${n}_IMG\\}\\}`, 'g'), escHtml(m.imgUrl));
    out = out.replace(new RegExp(`\\{\\{PRO_${n}_TITLE\\}\\}`, 'g'), escHtml(m.title));
    out = out.replace(new RegExp(`\\{\\{PRO_${n}_EXC\\}\\}`, 'g'), escHtml(m.excerpt));
  }
```

**Change 5:** Find the console.log line:

```
  console.log(`  Picks:  ${pickMeta.map(m => m.title.slice(0, 30)).join(' | ')}`);
```

Replace with:

```
  console.log(`  Desk:   ${deskMeta.map(m => m.title.slice(0, 30)).join(' | ')}`);
  console.log(`  Pro:    ${proMeta.map(m => m.title.slice(0, 30)).join(' | ')}`);
```

---

### FILE 3: template.html

Find the entire Editor's Pick section (lines 22-32):

```
<div class="fct-section-head"><h2 class="fct-section-h">Editor's Pick</h2><span class="fct-section-sub">매체가 추천하는 시그니처 분석 3편</span></div>

<section class="fct-grid">

<a href="{{PICK_1_URL}}" class="fct-card"><img class="fct-card-img" src="{{PICK_1_IMG}}" alt="{{PICK_1_TITLE}}" loading="lazy"><div class="fct-card-body"><span class="fct-card-tag pick">PICK</span><h3 class="fct-card-ttl">{{PICK_1_TITLE}}</h3><p class="fct-card-exc">{{PICK_1_EXC}}</p></div></a>

<a href="{{PICK_2_URL}}" class="fct-card"><img class="fct-card-img" src="{{PICK_2_IMG}}" alt="{{PICK_2_TITLE}}" loading="lazy"><div class="fct-card-body"><span class="fct-card-tag pick">PICK</span><h3 class="fct-card-ttl">{{PICK_2_TITLE}}</h3><p class="fct-card-exc">{{PICK_2_EXC}}</p></div></a>

<a href="{{PICK_3_URL}}" class="fct-card"><img class="fct-card-img" src="{{PICK_3_IMG}}" alt="{{PICK_3_TITLE}}" loading="lazy"><div class="fct-card-body"><span class="fct-card-tag pick">PICK</span><h3 class="fct-card-ttl">{{PICK_3_TITLE}}</h3><p class="fct-card-exc">{{PICK_3_EXC}}</p></div></a>

</section>
```

Replace with:

```
<div class="fct-section-head"><h2 class="fct-section-h">K-Junior Desk's Pick</h2><span class="fct-section-sub">해운 입문자를 위한 추천 3편</span></div>

<section class="fct-grid">

<a href="{{DESK_1_URL}}" class="fct-card"><img class="fct-card-img" src="{{DESK_1_IMG}}" alt="{{DESK_1_TITLE}}" loading="lazy"><div class="fct-card-body"><span class="fct-card-tag pick">PICK</span><h3 class="fct-card-ttl">{{DESK_1_TITLE}}</h3><p class="fct-card-exc">{{DESK_1_EXC}}</p></div></a>

<a href="{{DESK_2_URL}}" class="fct-card"><img class="fct-card-img" src="{{DESK_2_IMG}}" alt="{{DESK_2_TITLE}}" loading="lazy"><div class="fct-card-body"><span class="fct-card-tag pick">PICK</span><h3 class="fct-card-ttl">{{DESK_2_TITLE}}</h3><p class="fct-card-exc">{{DESK_2_EXC}}</p></div></a>

<a href="{{DESK_3_URL}}" class="fct-card"><img class="fct-card-img" src="{{DESK_3_IMG}}" alt="{{DESK_3_TITLE}}" loading="lazy"><div class="fct-card-body"><span class="fct-card-tag pick">PICK</span><h3 class="fct-card-ttl">{{DESK_3_TITLE}}</h3><p class="fct-card-exc">{{DESK_3_EXC}}</p></div></a>

</section>

<div class="fct-section-head"><h2 class="fct-section-h">K-Junior Pro's Pick</h2><span class="fct-section-sub">실무자를 위한 심층 분석 3편</span></div>

<section class="fct-grid">

<a href="{{PRO_1_URL}}" class="fct-card"><img class="fct-card-img" src="{{PRO_1_IMG}}" alt="{{PRO_1_TITLE}}" loading="lazy"><div class="fct-card-body"><span class="fct-card-tag pick">PICK</span><h3 class="fct-card-ttl">{{PRO_1_TITLE}}</h3><p class="fct-card-exc">{{PRO_1_EXC}}</p></div></a>

<a href="{{PRO_2_URL}}" class="fct-card"><img class="fct-card-img" src="{{PRO_2_IMG}}" alt="{{PRO_2_TITLE}}" loading="lazy"><div class="fct-card-body"><span class="fct-card-tag pick">PICK</span><h3 class="fct-card-ttl">{{PRO_2_TITLE}}</h3><p class="fct-card-exc">{{PRO_2_EXC}}</p></div></a>

<a href="{{PRO_3_URL}}" class="fct-card"><img class="fct-card-img" src="{{PRO_3_IMG}}" alt="{{PRO_3_TITLE}}" loading="lazy"><div class="fct-card-body"><span class="fct-card-tag pick">PICK</span><h3 class="fct-card-ttl">{{PRO_3_TITLE}}</h3><p class="fct-card-exc">{{PRO_3_EXC}}</p></div></a>

</section>
```

---

### After all edits, run:

```
cd pages\homepage
node build.js
```

### Verify:

1. `homepage.html` contains `K-Junior Desk's Pick` section heading
2. `homepage.html` contains `K-Junior Pro's Pick` section heading
3. `homepage.html` does NOT contain `{{DESK_` or `{{PRO_` unresolved placeholders
4. `homepage.html` does NOT contain `Editor's Pick`
5. `homepage.html` contains 6 pick cards total (3 Desk + 3 Pro)

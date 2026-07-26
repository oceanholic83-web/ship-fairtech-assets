# Cursor Order — Port Guide directory + version pinning (2026-07-26, order 1 of 2)

## Goal

Three things:

1. Render the 98 agency records in `data.js` as static, crawlable HTML. They are currently
   drawn only by client-side JS, so Googlebot sees none of them.
2. **Close the stale-data hole.** `loader.js` loads `data.js` from jsDelivr using the commit
   pin embedded in `loaderUrl`. That pin is hardcoded to `@b28d9de` in `config.json`, so
   edits to `data.js` never reach the map. `build.js` will now rewrite the pin to the
   current git HEAD on every build.
3. Stamp the generated page with the `data.js` revision hash and build date, so a later
   monitor check can detect "data.js was updated but the WordPress page was never re-pasted".

Files changed: `pages/port-guide/build.js`, `pages/port-guide/template.html`, `loader.js`.
**Do not touch `data.js`, `port-atlas.js`, `port-atlas-header.js`, `config.json`.**
The interactive map and directory UI are unchanged — this is additive.

Measured effect (verified by dry run):
- static body text: 1,239 chars → 8,517 chars
- external primary-source links: 17 → 96
- agency entries rendered: 98

---

## Step 1 — Replace `pages/port-guide/build.js`

Overwrite with EXACTLY this content:

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

// data.js is an IIFE that assigns window.PORT_ATLAS_DATA. Shim window for Node.
const crypto = require('crypto');
const { execSync } = require('child_process');

global.window = global.window || {};
require(path.join(__dirname, '..', '..', 'data.js'));
const ATLAS = global.window.PORT_ATLAS_DATA;

function loadConfig(dir) {
  const base = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));

  const localPath = path.join(dir, 'config.local.json');
  if (!fs.existsSync(localPath)) {
    console.error('\n[ERROR] config.local.json 이 없습니다.');
    console.error('  경로: ' + localPath);
    console.error('  config.local.json.example 을 복사한 뒤 실제 키를 입력하세요.\n');
    process.exit(1);
  }

  const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));
  const cfg = Object.assign({}, base, local);

  if (!cfg.monitorKey) {
    console.error('\n[ERROR] monitorKey 가 설정되지 않았습니다. config.local.json 을 확인하세요.\n');
    process.exit(1);
  }

  return cfg;
}

const cfg = loadConfig(__dirname);
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const OUTPUT = path.join(__dirname, 'port-guide.html');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function stripHtml(s) {
  return (s || '')
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&#8217;/g, "'").replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&').replace(/&#8230;/g, '…')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, '').replace(/<[^>]*>/g, '').trim();
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escJs(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function fmtDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function fetchPostBySlug(slug) {
  try {
    const url = `${cfg.monitorApi}?key=${encodeURIComponent(cfg.monitorKey)}&mode=post&slug=${encodeURIComponent(slug)}`;
    const post = await fetchJson(url);
    return post && post.id ? post : null;
  } catch (e) {
    console.warn(`  ⚠ Failed: ${slug}: ${e.message}`);
    return null;
  }
}

function extractMeta(post) {
  let imgUrl = cfg.fallbackImage;
  const fifu = post.meta?.fifu_image_url || post.featured_image_url;
  if (fifu) imgUrl = fifu;
  else if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    imgUrl = post._embedded['wp:featuredmedia'][0].source_url;
  }

  const TAG_EXCLUDE = cfg.excludeCategoryIds || [];
  const CAT_LABELS = cfg.categoryLabels || {};
  let catTags = [];
  if (post._embedded?.['wp:term']) {
    const terms = post._embedded['wp:term'][0] || [];
    catTags = terms
      .filter(t => !TAG_EXCLUDE.includes(t.id))
      .map(t => (CAT_LABELS[String(t.id)] || t.name || '').toUpperCase())
      .filter(Boolean);
  }

  let rawExc = stripHtml(post.excerpt?.rendered || '');
  if (!rawExc && post.content?.rendered) {
    rawExc = stripHtml(post.content.rendered);
  }
  const excerpt = rawExc.length > cfg.excerptMaxLen ? rawExc.slice(0, cfg.excerptMaxLen) + '…' : rawExc;

  return {
    url: post.link,
    title: stripHtml(post.title.rendered),
    excerpt,
    catTags: catTags.join(' · ') || '항만 가이드',
    imgUrl,
    date: fmtDate(post.date),
  };
}


// ============================================================
// Agency directory — static HTML from data.js (crawlable)
// ============================================================
function flattenGrouped(obj) {
  const out = [];
  Object.values(obj).forEach(g => (g.items || []).forEach(i => out.push(i)));
  return out;
}

function renderDirItem(it) {
  const title = (it.abbr && it.abbr !== it.name)
    ? `${escHtml(it.name)} <span class="fct-dir-abbr">${escHtml(it.abbr)}</span>`
    : escHtml(it.name);

  const head = it.url
    ? `<a href="${escHtml(it.url)}" target="_blank" rel="noopener">${title}</a>`
    : `<span class="fct-dir-plain">${title}</span>`;

  const meta = [];
  const scope = it.port || it.portKey || it.coverage || it.role || it.sub;
  if (scope) meta.push(escHtml(scope));
  if (it.channel) meta.push(escHtml(it.channel));

  const contact = [];
  if (it.address) contact.push(escHtml(it.address) + (it.postcode ? ` (${escHtml(it.postcode)})` : ''));
  const tels = [];
  if (it.tel) tels.push('대표 ' + escHtml(it.tel));
  if (it.telControl) tels.push('관제 ' + escHtml(it.telControl));
  if (it.telNight) tels.push('야간 ' + escHtml(it.telNight));
  if (it.telCivil) tels.push('민원 ' + escHtml(it.telCivil));
  if (it.telAnimal) tels.push('축산 ' + escHtml(it.telAnimal));
  if (it.telPlant) tels.push('식물 ' + escHtml(it.telPlant));
  if (tels.length) contact.push(tels.join(' · '));
  if (it.fax) contact.push('팩스 ' + escHtml(it.fax));
  if (it.email) contact.push(escHtml(it.email));

  return `<li class="fct-dir-item">
<div class="fct-dir-name">${head}</div>${meta.length ? `
<div class="fct-dir-meta">${meta.join(' · ')}</div>` : ''}${contact.length ? `
<div class="fct-dir-contact">${contact.join('<br>')}</div>` : ''}${it.note ? `
<div class="fct-dir-note">${escHtml(it.note)}</div>` : ''}
</li>`;
}

function buildDirectoryHtml() {
  const groups = [
    { title: '지방해양수산청', items: flattenGrouped(ATLAS.OFFICES), open: true,
      desc: '입출항 신고, 부두 사용 허가, 항만 운영 행정의 1차 창구입니다.' },
    { title: '항만공사', items: ATLAS.PORT_AUTHORITIES, open: true,
      desc: '항만 시설 운영과 마케팅을 맡습니다. 항만공사가 없는 항만은 관할 지방청이 직접 운영합니다.' },
    { title: '도선사회', items: ATLAS.PILOTS, open: true,
      desc: '도선사 배정을 담당합니다. 강제도선 대상 선박은 도선사 승선이 의무입니다.' },
    { title: '해상교통관제센터 VTS', items: ATLAS.VTS_CENTERS, open: false,
      desc: '입출항 선박의 통항을 관제합니다. 관제 구역과 호출 채널이 센터마다 다릅니다.' },
    { title: '세관', items: ATLAS.CUSTOMS_HQ.concat(flattenGrouped(ATLAS.CUSTOMS_PORTS)), open: false,
      desc: '수출입 통관과 보세 화물을 관할합니다.' },
    { title: '해양경찰', items: ATLAS.KCG_AGENCIES, open: false,
      desc: '해상 치안, 수색구조, 해양오염 대응을 담당합니다.' },
    { title: '검역·검사', items: ATLAS.QUARANTINE_AGENCIES, open: false,
      desc: '동식물 검역, 수산물 품질 관리, 선급 검사를 담당합니다.' },
    { title: '항만보안', items: ATLAS.PORT_SECURITY, open: false,
      desc: 'ISPS 코드에 따른 항만시설 보안을 담당합니다.' },
    { title: '해양수산부 산하기관', items: ATLAS.MOF_AGENCIES, open: false,
      desc: '해사 안전, 연구, 교육, 해양환경 등 기능별 전문 기관입니다.' },
  ];

  const total = groups.reduce((s, g) => s + g.items.length, 0);

  const html = groups.map(g => `
<details class="fct-dir-group"${g.open ? ' open' : ''}>
<summary class="fct-dir-summary">${escHtml(g.title)} <span class="fct-dir-count">${g.items.length}</span></summary>
<p class="fct-dir-desc">${escHtml(g.desc)}</p>
<ul class="fct-dir-list">
${g.items.map(renderDirItem).join('\n')}
</ul>
</details>`).join('\n');

  return { html, total };
}


// ============================================================
// Version pinning + data stamp
// ------------------------------------------------------------
// The map loads data.js from jsDelivr using the commit pin embedded in
// loaderUrl. If that pin is stale, edits to data.js never reach the map.
// We therefore rewrite the pin to the current git HEAD on every build.
// ============================================================
const DATA_PATH = path.join(__dirname, '..', '..', 'data.js');

function gitHead() {
  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: path.join(__dirname, '..', '..'),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
  } catch (e) {
    return null;
  }
}

function dataIsDirty() {
  try {
    const out = execSync('git status --porcelain data.js', {
      cwd: path.join(__dirname, '..', '..'),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
    return out.length > 0;
  } catch (e) {
    return false;
  }
}

function resolveLoaderUrl(configured) {
  const head = gitHead();
  if (!head) {
    console.warn('   ! git HEAD unavailable — using loaderUrl from config.json as-is.');
    return configured;
  }
  const pinned = configured.replace(
    /(ship-fairtech-assets)@[^/]+/,
    `$1@${head}`
  );
  if (pinned !== configured) {
    console.log(`   loaderUrl pinned to ${head}`);
  }
  return pinned;
}

function dataStamp() {
  const raw = fs.readFileSync(DATA_PATH);
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 8);
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { hash, date, text: `기관 정보 최종 갱신 ${date}` };
}

async function main() {
  console.log('Building Port Guide page...');

  if (!cfg.mapboxToken) {
    console.error('mapboxToken missing. Copy config.local.json.example → config.local.json and set your token.');
    process.exit(1);
  }

  console.log(`1. Fetching articles in category ${cfg.categoryId}...`);
  const monitorUrl = `${cfg.monitorApi}?key=${encodeURIComponent(cfg.monitorKey)}`;
  const monitor = await fetchJson(monitorUrl);
  const categoryPosts = monitor.posts
    .filter(p => p.categories.includes(cfg.categoryId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  console.log(`   Found ${categoryPosts.length} articles`);

  console.log(`2. Fetching full data for ${categoryPosts.length} posts...`);
  const fullPosts = await Promise.all(categoryPosts.map(p => fetchPostBySlug(p.slug)));
  const metas = fullPosts.filter(Boolean).map(extractMeta);

  const cardsHtml = metas.map(m => `
<a href="${escHtml(m.url)}" class="fct-bigcard"><img class="fct-bigcard-img" src="${escHtml(m.imgUrl)}" alt="${escHtml(m.title)}" loading="lazy"><div class="fct-bigcard-body"><span class="fct-bigcard-tag">${escHtml(m.catTags)} · ${escHtml(m.date)}</span><h3 class="fct-bigcard-ttl">${escHtml(m.title)}</h3><p class="fct-bigcard-exc">${escHtml(m.excerpt)}</p></div></a>`).join('\n');

  console.log('3. Building agency directory from data.js...');
  const directory = buildDirectoryHtml();
  console.log(`   Agencies: ${directory.total}`);

  console.log('4. Resolving version pin and data stamp...');
  if (dataIsDirty()) {
    console.warn('   !! data.js has UNCOMMITTED changes.');
    console.warn('   !! The map loads data.js from the pinned commit, so those edits will NOT appear.');
    console.warn('   !! Commit and push data.js first, then rebuild.');
  }
  const loaderUrl = resolveLoaderUrl(cfg.loaderUrl);
  const stamp = dataStamp();
  console.log(`   data.js rev ${stamp.hash} (${stamp.date})`);

  const articleCount = metas.length;
  const badge = (cfg.badge || '{{articleCount}} / 12 ports').replace(/\{\{articleCount\}\}/g, String(articleCount));
  const sectionTitle = `${articleCount}개 무역항 가이드`;

  let out = TEMPLATE;
  const vars = {
    title: escHtml(cfg.title),
    eyebrow: escHtml(cfg.eyebrow),
    description: escHtml(cfg.description),
    badge: escHtml(badge),
    sectionTitle: escHtml(sectionTitle),
    articleCount: String(articleCount),
    heroImage: cfg.heroImage,
    mapboxToken: escJs(cfg.mapboxToken),
    loaderUrl: loaderUrl,
    dataStamp: escHtml(stamp.text),
    dataRev: escHtml(stamp.hash),
    buildDate: escHtml(stamp.date),
    cards: cardsHtml,
    directory: directory.html,
    directoryCount: String(directory.total),
  };

  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  fs.writeFileSync(OUTPUT, out);
  console.log(`✓ Generated: ${OUTPUT}`);
  console.log(`  Article cards: ${metas.length}`);
  console.log(`  Agency entries: ${directory.total}`);
  console.log(`  data rev: ${stamp.hash}`);
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
```

New behaviour:
- requires `../../data.js` via a `global.window` shim (data.js is a browser IIFE)
- `buildDirectoryHtml()` renders 98 agency records grouped into 9 `<details>` sections
- `resolveLoaderUrl()` rewrites the `@<commit>` pin in loaderUrl to the current git HEAD
- `dataIsDirty()` warns loudly if `data.js` has uncommitted changes, because the map
  would then load a commit that does not contain them
- `dataStamp()` produces a sha256-8 hash of `data.js` plus the build date

---

## Step 2 — Replace `pages/port-guide/template.html`

Overwrite with EXACTLY this content. Preserve every character including the single-line
`<style>` block and all `{{placeholder}}` tokens.

```html
<!-- wp:html -->
<!-- faircast-port-guide data-rev:{{dataRev}} built:{{buildDate}} -->
<style>body.page-id-522 .entry-hero,body.page-id-522 .page-title,body.page-id-522 .entry-title{display:none!important}body.page-id-522 .content-area{margin-top:0.5rem!important;margin-bottom:1rem!important}body.page-id-522 .entry-content-wrap{padding-top:0!important;padding-bottom:0.5rem!important}.fct-port{font-family:ui-sans-serif,system-ui,-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#0f172a;line-height:1.7;max-width:1100px;margin:0 auto}.fct-port *{box-sizing:border-box}.fct-cat-hero{background:linear-gradient(to right,rgba(15,23,42,0.95) 0%,rgba(15,23,42,0.6) 50%,rgba(15,23,42,0.2) 100%),url('{{heroImage}}');background-size:cover;background-position:right center;background-repeat:no-repeat;background-color:#0f172a;border-radius:14px;padding:32px 40px;margin:0 0 24px;color:#f1f5f9;position:relative;overflow:hidden}.fct-cat-hero::before{content:"";position:absolute;top:-50%;right:-20%;width:500px;height:500px;background:radial-gradient(circle,rgba(94,234,212,0.08) 0%,transparent 70%);pointer-events:none}.fct-cat-label{font-size:11px;font-weight:700;color:#5eead4;letter-spacing:0.2em;margin-bottom:6px;text-transform:uppercase}.fct-cat-title{font-size:28px;font-weight:800;color:#f1f5f9;margin:0 0 6px 0;letter-spacing:-0.02em}.fct-cat-desc{font-size:14.5px;color:#cbd5e1;margin:0 0 12px 0;line-height:1.65;max-width:620px}.fct-cat-count{display:inline-block;font-size:12px;font-weight:700;color:#5eead4;background:rgba(94,234,212,0.1);padding:6px 14px;border-radius:20px;border:1px solid rgba(94,234,212,0.2)}.fct-port-articles{margin:40px 0 32px}.fct-section-header{margin:0 0 20px;padding-bottom:12px;border-bottom:2px solid #0f172a}.fct-section-title{font-size:22px;font-weight:800;color:#0f172a;margin:0 0 8px 0;letter-spacing:-0.01em}.fct-section-desc{font-size:14px;color:#64748b;margin:0;line-height:1.65}.fct-card-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin:0 0 32px}.fct-bigcard{display:block;text-decoration:none;color:inherit;background:#fff;border-radius:10px;overflow:hidden;transition:transform 0.2s ease,box-shadow 0.2s ease;border:1px solid #e2e8f0}.fct-bigcard:hover{transform:translateY(-4px);box-shadow:0 16px 32px -12px rgba(15,23,42,0.15)}.fct-bigcard-img{aspect-ratio:16/10;background:#f1f5f9;display:block;width:100%;height:auto;object-fit:cover}.fct-bigcard-body{padding:18px 20px 22px}.fct-bigcard-tag{display:inline-block;font-size:10px;font-weight:600;color:#64748b;letter-spacing:0.06em;margin-bottom:8px;line-height:1.6}.fct-bigcard-ttl{font-size:16px;font-weight:700;color:#0f172a;margin:0 0 8px 0;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.fct-bigcard-exc{font-size:13.5px;color:#64748b;line-height:1.6;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.fct-pg-lead{background:#f0fdfa;border:1px solid #ccfbf1;border-left:4px solid #14b8a6;border-radius:6px;padding:18px 22px;margin:0 0 24px}.fct-pg-lead p{font-size:14.5px;color:#334155;line-height:1.75;margin:0 0 10px}.fct-pg-lead p:last-child{margin-bottom:0}.fct-pg-ref{margin:40px 0 8px;padding-top:28px;border-top:1px solid #e2e8f0}.fct-pg-ref h2{font-size:20px;font-weight:800;color:#0f172a;margin:0 0 14px;letter-spacing:-0.01em}.fct-pg-ref h3{font-size:15px;font-weight:700;color:#0f172a;margin:24px 0 10px}.fct-pg-ref p{font-size:14.5px;color:#334155;line-height:1.8;margin:0 0 12px}.fct-pg-off{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:0 0 8px;padding:0;list-style:none}.fct-pg-off li{margin:0}.fct-pg-off a{display:block;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #14b8a6;border-radius:5px;font-size:13px;font-weight:600;color:#0f172a;text-decoration:none;transition:background 0.15s ease}.fct-pg-off a:hover{background:#f0fdfa}.fct-pg-off span{display:block;font-size:11px;font-weight:500;color:#64748b;margin-top:2px}.fct-pg-note{font-size:12.5px;color:#64748b;line-height:1.7;margin:14px 0 0}.fct-dir{margin:36px 0 8px}.fct-dir-group{border:1px solid #e2e8f0;border-radius:8px;margin:0 0 10px;background:#fff;overflow:hidden}.fct-dir-summary{cursor:pointer;list-style:none;padding:14px 18px;font-size:15px;font-weight:700;color:#0f172a;background:#f8fafc;display:flex;align-items:center;gap:10px}.fct-dir-summary::-webkit-details-marker{display:none}.fct-dir-summary::before{content:"+";display:inline-block;width:16px;font-size:15px;font-weight:700;color:#14b8a6}.fct-dir-group[open] .fct-dir-summary::before{content:"\2212"}.fct-dir-count{font-size:11px;font-weight:700;color:#0f766e;background:#ccfbf1;padding:2px 9px;border-radius:12px}.fct-dir-desc{font-size:13px;color:#64748b;line-height:1.65;margin:0;padding:14px 18px 0}.fct-dir-list{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;list-style:none;margin:0;padding:14px 18px 18px}.fct-dir-item{background:#f8fafc;border:1px solid #e2e8f0;border-left:3px solid #14b8a6;border-radius:5px;padding:11px 13px;margin:0}.fct-dir-name{font-size:13px;font-weight:700;line-height:1.4;margin-bottom:4px}.fct-dir-name a{color:#0f172a;text-decoration:none}.fct-dir-name a:hover{color:#0f766e;text-decoration:underline}.fct-dir-abbr{font-size:11px;font-weight:600;color:#0f766e}.fct-dir-meta{font-size:11.5px;font-weight:600;color:#0f766e;margin-bottom:5px}.fct-dir-contact{font-size:11.5px;color:#64748b;line-height:1.6}.fct-dir-note{font-size:11.5px;color:#94a3b8;line-height:1.6;margin-top:5px}.fct-dir-stamp{font-size:12px;color:#64748b;margin:14px 0 0;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:5px}.fct-dir-stamp b{font-weight:700;color:#0f172a}@media (max-width:1024px){.fct-card-grid{grid-template-columns:repeat(2,1fr)}.fct-pg-off{grid-template-columns:repeat(2,1fr)}.fct-dir-list{grid-template-columns:repeat(2,1fr)}}@media (max-width:768px){.fct-cat-hero{background:linear-gradient(to right,rgba(15,23,42,0.95) 0%,rgba(15,23,42,0.85) 100%),url('{{heroImage}}');background-size:cover;background-position:right center;background-repeat:no-repeat;padding:28px 24px}.fct-cat-title{font-size:24px}.fct-card-grid{grid-template-columns:1fr}.fct-pg-off{grid-template-columns:1fr}.fct-dir-list{grid-template-columns:1fr}}</style>

<div class="fct-port">

<section class="fct-cat-hero"><div class="fct-cat-label">{{eyebrow}}</div><h1 class="fct-cat-title">{{title}}</h1><p class="fct-cat-desc">{{description}}</p><div class="fct-cat-count">{{badge}}</div></section>

<div class="fct-pg-lead">
<p>배 한 척이 한국 항구에 들어오려면 여러 기관을 동시에 거칩니다. 관할 지방해양수산청이 항만 운영을 총괄하고, 항만공사가 시설을 관리하며, 도선사회가 도선사를 배정하고, 해상교통관제센터(VTS)가 진입 순서를 통제합니다. 세관과 검역도 별도의 절차입니다.</p>
<p>이 페이지는 그 기관들이 항만별로 어디에 있고 어떻게 연결되는지를 한 화면에 모은 것입니다. 아래 지도에서 항만을 클릭하면 관할청·항만공사·도선사회·VTS 채널과 주요 부두 구성이 나옵니다. 개별 항만의 산업 구조와 과제를 다룬 분석은 그 아래 카드에 있습니다.</p>
</div>

<script>window.PORT_ATLAS_CONFIG = {
  mapboxToken: '{{mapboxToken}}',
  hideIntro: true
};</script>
<div id="korea-port-app"></div>
<script src="{{loaderUrl}}"></script>

<section class="fct-port-articles">
  <div class="fct-section-header">
    <h2 class="fct-section-title">{{sectionTitle}}</h2>
    <p class="fct-section-desc">각 무역항의 입항 절차, 시설, 운영 구조를 정리한 글입니다.</p>
  </div>
  <div class="fct-card-grid">
{{cards}}
  </div>
</section>

<section class="fct-pg-ref">
<h2>한국 항만 행정 구조</h2>

<p>항만법은 지정항만을 무역항과 연안항으로 나눕니다. 무역항은 외항선이 드나들며 국제 화물을 처리하는 항만이고, 연안항은 국내 연안 수송과 어업 기반이 중심입니다. 무역항은 다시 국가가 직접 관리하는 곳과 지방자치단체가 관리하는 곳으로 갈립니다. 컨테이너·원유·LNG 같은 국가 기간 물류를 다루는 항만이 앞쪽에 해당합니다.</p>

<p>운영 주체도 항만마다 다릅니다. 부산·인천·울산·여수광양은 항만공사(PA)가 설립되어 시설 운영과 마케팅을 맡고, 나머지 항만은 관할 지방해양수산청이 직접 운영합니다. 같은 무역항이라도 접안 신청 창구와 요율 체계가 달라지는 이유가 여기에 있습니다.</p>

<h3>기관 디렉토리</h3>

<p>항만 운영에 관여하는 기관 {{directoryCount}}곳입니다. 각 항목은 공식 홈페이지로 연결됩니다.</p>

<div class="fct-dir">
{{directory}}
</div>

<p class="fct-dir-stamp"><b>{{dataStamp}}</b> · 기관 조직 개편과 이전이 있을 수 있습니다. 실제 업무 시에는 각 기관 공식 홈페이지에서 최신 정보를 확인하시기 바랍니다.</p>

<p class="fct-pg-note">기관 정보는 해양수산부 및 각 기관 공개 자료를 바탕으로 정리했습니다.</p>

</section>

</div>
<!-- /wp:html -->
```

Changes:
- `.fct-dir-*` CSS for the directory (3-col grid, collapses to 2 then 1)
- removed the two hand-written `<ul class="fct-pg-off">` lists (지방해양수산청 / 항만공사) —
  the generated directory contains the same links, so they were duplicates
- new slots: `{{directory}}`, `{{directoryCount}}`, `{{dataStamp}}`, `{{dataRev}}`, `{{buildDate}}`
- a machine-readable HTML comment near the top for the monitor to read

---

## Step 3 — Edit `loader.js` (one line)

`loader.js` still contains the old "12개 무역항" claim in its intro block. It is currently
hidden by `hideIntro: true`, but remove it so the wording cannot resurface.

Find this exact string:

```
한국 12개 무역항의 입항 절차, 시설, 운영 정보를 정리한 실용 가이드입니다. 지도에서 항만을 클릭하거나, 아래 카드에서 각 항만의 상세 가이드로 이동할 수 있습니다.
```

Replace with:

```
한국 주요 무역항의 관할 기관과 운영 정보를 정리했습니다. 지도에서 항만을 클릭하면 관할청·항만공사·도선사회·VTS 채널을 볼 수 있습니다.
```

Change nothing else in `loader.js`.

---

## Step 4 — Verify before building

Run from repo root.

```
findstr /C:"12개 무역항" loader.js pages\port-guide\config.json pages\port-guide\template.html
```

Expected: **no matches**.

```
findstr /C:"fct-pg-off" pages\port-guide\template.html
```

Expected: **no matches**.

```
findstr /C:"{{directory}}" /C:"{{directoryCount}}" /C:"{{dataStamp}}" /C:"{{dataRev}}" /C:"{{buildDate}}" pages\port-guide\template.html
```

Expected: all five found.

---

## Step 5 — Commit and push FIRST, then build

⚠️ **Order matters.** `build.js` pins the map to the current git HEAD, so the commit must
already exist and be pushed before the build runs. Building first would pin to the previous
commit.

Run each line separately. PowerShell does not support `&&`.

```
git status
git add pages/port-guide/build.js pages/port-guide/template.html loader.js
git commit -m "port-guide: static agency directory, auto commit pin, data stamp"
git push
```

`git status` must NOT list `config.local.json` or `port-guide.html` as staged.

---

## Step 6 — Build

```
cd pages\port-guide
node build.js
```

Expected console output — all of these lines must appear:

```
   Found 10 articles
3. Building agency directory from data.js...
   Agencies: 98
4. Resolving version pin and data stamp...
   loaderUrl pinned to <7-char hash>
   data.js rev <8-char hash> (2026-07-26)
  Article cards: 10
  Agency entries: 98
  data rev: <8-char hash>
```

STOP and report if any of these happen:
- `Agencies:` is not 98 — the window shim failed to load data.js
- `!! data.js has UNCOMMITTED changes` — commit and push data.js, then rebuild
- `! git HEAD unavailable` — the pin was not updated; the map will keep loading stale data

---

## Step 7 — Sanity-check the output

```
findstr /C:"fct-dir-item" pages\port-guide\port-guide.html
```

Expected: many matches.

```
findstr /C:"{{" pages\port-guide\port-guide.html
```

Expected: **no matches**.

Confirm the pin was rewritten — this must show the hash from Step 5, not `b28d9de`:

```
findstr /C:"ship-fairtech-assets@" pages\port-guide\port-guide.html
```

---

## Step 8 — Report back

Report the full console output from Step 6, the loaderUrl line from Step 7, and
`git log -1 --oneline`. Do NOT paste the generated HTML — it is ~40 KB.

---

## Do NOT

- Do not edit `data.js`, `port-atlas.js`, `port-atlas-header.js`, `config.json`.
- Do not commit `config.local.json` or `port-guide.html`.
- Do not build before pushing — the commit pin would be wrong.
- Do not hand-edit the generated HTML. It is regenerated on every build.

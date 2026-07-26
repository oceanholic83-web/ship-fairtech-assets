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

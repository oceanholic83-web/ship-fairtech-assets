// build.js — Faircast 홈페이지 정적 HTML 빌더
//
// 실행: node build.js
// 출력: dist/homepage.html
//
// 의존성 없음 (Node 18+ 내장 fetch만 사용)

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf-8'));
const tpl = fs.readFileSync(path.join(ROOT, 'template.html'), 'utf-8');

const SITE = cfg.site.replace(/\/$/, '');
const EXCLUDE_CATS = cfg.excludeCategoryIds || [];
const DESK_SLUGS = cfg.deskPick || [];
const PRO_SLUGS = cfg.proPick || [];
const CAT_LABELS = cfg.categoryLabels || {};
const FALLBACK_IMG = cfg.fallbackImage;
const EXC_MAX = cfg.excerptMaxLen || 90;

// ── 유틸 ──────────────────────────────────────────

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;/g, '—')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8230;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&hellip;/g, '…')
    .replace(/&#038;/g, '&')
    .replace(/&#0?39;/g, "'")
    .replace(/&[a-zA-Z]+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(s, n) {
  if (!s) return '';
  if (s.length <= n) return s;
  return s.slice(0, n).replace(/[\s,.]+$/, '') + '…';
}

function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fmtDate(iso) {
  // 2026-06-22T10:24:00 → 2026.06
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}.${m}`;
}

// 글에서 카테고리 라벨, 이미지 URL 추출
function extractMeta(post) {
  let catLabel = '분석';
  let catTags = [];
  let imgUrl = FALLBACK_IMG;

  if (post._embedded && post._embedded['wp:term']) {
    const terms = post._embedded['wp:term'][0] || [];
    const filtered = terms.filter(t => !EXCLUDE_CATS.includes(t.id));
    if (filtered.length > 0) {
      catLabel = CAT_LABELS[String(filtered[0].id)] || filtered[0].name || '분석';
      catTags = filtered.map(t => (CAT_LABELS[String(t.id)] || t.name || '').toUpperCase()).filter(Boolean);
    }
  }

  // featured image: _embedded["wp:featuredmedia"]
  if (post._embedded && post._embedded['wp:featuredmedia']) {
    const media = post._embedded['wp:featuredmedia'][0];
    if (media && media.source_url) {
      imgUrl = media.source_url;
    }
  }

  // FIFU fallback: content에서 첫 이미지
  if (imgUrl === FALLBACK_IMG && post.content && post.content.rendered) {
    const m = post.content.rendered.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m) imgUrl = m[1];
  }

  // 발췌
  let excerpt = stripHtml(post.excerpt && post.excerpt.rendered || '');
  if (!excerpt) {
    excerpt = stripHtml(post.content && post.content.rendered || '');
  }
  excerpt = truncate(excerpt, EXC_MAX);

  return {
    url: post.link,
    title: stripHtml(post.title.rendered),
    excerpt,
    catLabel,
    catTags: catTags.join(' · '),
    imgUrl,
    date: fmtDate(post.date),
    slug: post.slug,
    id: post.id,
  };
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Faircast-Home-Builder/1.0' },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return res.json();
}

async function fetchPostsByCount(n) {
  const url = `${SITE}/wp-json/wp/v2/posts?_embed&per_page=${n}&orderby=date&order=desc`;
  console.log(`  → fetching latest ${n} posts...`);
  return fetchJson(url);
}

async function fetchPostBySlug(slug) {
  const url = `${SITE}/wp-json/wp/v2/posts?_embed&slug=${encodeURIComponent(slug)}`;
  const arr = await fetchJson(url);
  if (!arr || arr.length === 0) {
    console.warn(`  ⚠ slug not found: ${slug}`);
    return null;
  }
  return arr[0];
}

async function fetchTotalCount() {
  // 총 발행 수: HEAD 요청 X-WP-Total 헤더 사용
  const url = `${SITE}/wp-json/wp/v2/posts?per_page=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Faircast-Home-Builder/1.0' },
  });
  const total = res.headers.get('x-wp-total');
  return total ? parseInt(total, 10) : 0;
}

// ── 메인 ──────────────────────────────────────────

(async () => {
  console.log('Faircast Home Builder\n');

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

  // 2. 최신 글 30편 fetch (Pick 제외하고 11편 + 여유분)
  console.log('2. Fetching latest posts...');
  const allLatest = await fetchPostsByCount(30);
  const latest = allLatest.filter(p => !pickIds.has(p.id) && !p.categories.some(cid => EXCLUDE_CATS.includes(cid)));
  
  const latest3 = latest.slice(0, 3);
  const list8 = latest.slice(3, 11);

  // 3. 총 발행 수
  console.log('3. Fetching total post count...');
  const total = await fetchTotalCount();
  const statPosts = total > 0 ? `${total}+` : `${allLatest.length}+`;

  // 4. 데이터 추출
  const latestMeta = latest3.map(extractMeta);
  const deskMeta = validDesk.map(extractMeta);
  const proMeta = validPro.map(extractMeta);
  const listMeta = list8.map(extractMeta);

  // 5. 치환
  let out = tpl;
  out = out.replace(/\{\{STAT_POSTS\}\}/g, escHtml(statPosts));
  // BUILD_TIME removed

  // 최신 3편
  for (let i = 0; i < 3; i++) {
    const m = latestMeta[i] || { url: '#', title: '(글 없음)', excerpt: '', catLabel: '', imgUrl: FALLBACK_IMG };
    const n = i + 1;
    out = out.replace(new RegExp(`\\{\\{LATEST_${n}_URL\\}\\}`, 'g'), escHtml(m.url));
    out = out.replace(new RegExp(`\\{\\{LATEST_${n}_IMG\\}\\}`, 'g'), escHtml(m.imgUrl));
    out = out.replace(new RegExp(`\\{\\{LATEST_${n}_TITLE\\}\\}`, 'g'), escHtml(m.title));
    out = out.replace(new RegExp(`\\{\\{LATEST_${n}_EXC\\}\\}`, 'g'), escHtml(m.excerpt));
    out = out.replace(new RegExp(`\\{\\{LATEST_${n}_CAT\\}\\}`, 'g'), escHtml(m.catLabel));
    out = out.replace(new RegExp(`\\{\\{LATEST_${n}_CATS\\}\\}`, 'g'), escHtml(m.catTags));
  }

  // Desk Pick 3편
  for (let i = 0; i < 3; i++) {
    const m = deskMeta[i] || { url: '#', title: '(Desk Pick 슬러그 확인 필요)', excerpt: '', imgUrl: FALLBACK_IMG };
    const n = i + 1;
    out = out.replace(new RegExp(`\\{\\{DESK_${n}_URL\\}\\}`, 'g'), escHtml(m.url));
    out = out.replace(new RegExp(`\\{\\{DESK_${n}_IMG\\}\\}`, 'g'), escHtml(m.imgUrl));
    out = out.replace(new RegExp(`\\{\\{DESK_${n}_TITLE\\}\\}`, 'g'), escHtml(m.title));
    out = out.replace(new RegExp(`\\{\\{DESK_${n}_EXC\\}\\}`, 'g'), escHtml(m.excerpt));
    out = out.replace(new RegExp(`\\{\\{DESK_${n}_CATS\\}\\}`, 'g'), escHtml(m.catTags));
  }

  // Pro Pick 3편
  for (let i = 0; i < 3; i++) {
    const m = proMeta[i] || { url: '#', title: '(Pro Pick 슬러그 확인 필요)', excerpt: '', imgUrl: FALLBACK_IMG };
    const n = i + 1;
    out = out.replace(new RegExp(`\\{\\{PRO_${n}_URL\\}\\}`, 'g'), escHtml(m.url));
    out = out.replace(new RegExp(`\\{\\{PRO_${n}_IMG\\}\\}`, 'g'), escHtml(m.imgUrl));
    out = out.replace(new RegExp(`\\{\\{PRO_${n}_TITLE\\}\\}`, 'g'), escHtml(m.title));
    out = out.replace(new RegExp(`\\{\\{PRO_${n}_EXC\\}\\}`, 'g'), escHtml(m.excerpt));
    out = out.replace(new RegExp(`\\{\\{PRO_${n}_CATS\\}\\}`, 'g'), escHtml(m.catTags));
  }

  // 단축 리스트 8편
  for (let i = 0; i < 8; i++) {
    const m = listMeta[i] || { url: '#', title: '(글 없음)', excerpt: '', catLabel: '', date: '' };
    const n = i + 1;
    out = out.replace(new RegExp(`\\{\\{LIST_${n}_URL\\}\\}`, 'g'), escHtml(m.url));
    out = out.replace(new RegExp(`\\{\\{LIST_${n}_TITLE\\}\\}`, 'g'), escHtml(m.title));
    out = out.replace(new RegExp(`\\{\\{LIST_${n}_EXC\\}\\}`, 'g'), escHtml(m.excerpt));
    out = out.replace(new RegExp(`\\{\\{LIST_${n}_META\\}\\}`, 'g'), escHtml(`${m.catTags} · ${m.date}`));
  }

  // 미치환 변수 검사
  const leftovers = out.match(/\{\{[A-Z0-9_]+\}\}/g);
  if (leftovers) {
    console.warn(`  ⚠ Unresolved placeholders: ${[...new Set(leftovers)].join(', ')}`);
  }

  // 6. 출력
  const outPath = path.join(ROOT, 'homepage.html');
  fs.writeFileSync(outPath, out, 'utf-8');

  console.log('\n✓ Build complete');
  console.log(`  Output: ${outPath}`);
  console.log(`  Latest: ${latestMeta.map(m => m.title.slice(0, 30)).join(' | ')}`);
  console.log(`  Desk:   ${deskMeta.map(m => m.title.slice(0, 30)).join(' | ')}`);
  console.log(`  Pro:    ${proMeta.map(m => m.title.slice(0, 30)).join(' | ')}`);
  console.log(`  List:   ${listMeta.length} posts`);
  console.log('\nNext: open dist/homepage.html, copy all, paste into WordPress code editor.');
})().catch(err => {
  console.error('\n✗ Build failed:', err.message);
  process.exit(1);
});

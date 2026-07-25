'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const DELAY_MS = 400;
const MAX_CONCURRENCY = 3;
const MAX_RETRIES = 2;
const TIMEOUT_MS = 20000;

const ROOT = path.join(__dirname, '..');
const EXPECTED_PATH = path.join(ROOT, 'monitor', 'expected-state.json');
const REPORTS_DIR = path.join(ROOT, 'monitor', 'reports');

const QUICK = process.argv.includes('--quick');

const results = {
  critical: [],
  warning: [],
  ok: [],
};

const detail = {
  keyPages: [],
  legacyRedirects: [],
  categoryRedirects: [],
  categoryNoindex: [],
  robotsTxt: { body: '', checks: [] },
  adsTxt: { body: '', ok: false },
  sitemaps: [],
  snippets: [],
  policyRedFlags: [],
};

let samplePostUrl = null;
let htmlCache = new Map();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function nowStamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}`, ymd: `${yyyy}${mm}${dd}` };
}

function addCritical(item, expect, actual, why) {
  results.critical.push({ item, expect, actual, why });
}

function addWarning(item, expect, actual, why) {
  results.warning.push({ item, expect, actual, why });
}

function addOk(item) {
  results.ok.push({ item });
}

function isDescCssPolluted(desc) {
  if (!desc) return false;
  if (/\{[^}]*:[^}]*\}/.test(desc)) return true;
  if (desc.includes('!important')) return true;
  if (desc.startsWith('body.page-id')) return true;
  return false;
}

function hasKorean(text) {
  return /[가-힣]/.test(text || '');
}

function locationsMatch(actual, expected) {
  if (!actual || !expected) return false;
  const a = actual.trim();
  const e = expected.trim();
  if (a === e) return true;
  // trailing slash tolerance
  const aSlash = a.replace(/\/$/, '');
  const eSlash = e.replace(/\/$/, '');
  if (aSlash === eSlash) return true;
  // relative vs absolute
  try {
    const absA = new URL(a, 'https://faircast.kr').href.replace(/\/$/, '');
    const absE = new URL(e, 'https://faircast.kr').href.replace(/\/$/, '');
    return absA === absE;
  } catch (_) {
    return false;
  }
}

async function fetchOnce(url, opts = {}) {
  const maxRedirects = opts.maxRedirects !== undefined ? opts.maxRedirects : 5;
  const responseType = opts.responseType || 'text';
  const res = await axios.get(url, {
    headers: {
      'User-Agent': GOOGLEBOT_UA,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    timeout: TIMEOUT_MS,
    maxRedirects,
    validateStatus: () => true,
    responseType,
    // axios follows redirects by default; when maxRedirects:0, Location is available
    transitional: { clarifyTimeoutError: true },
  });
  return res;
}

async function fetchWithRetry(url, opts = {}, retries = MAX_RETRIES) {
  try {
    return await fetchOnce(url, opts);
  } catch (e) {
    if (retries > 0) {
      await sleep(1000);
      return fetchWithRetry(url, opts, retries - 1);
    }
    throw e;
  }
}

async function mapPool(items, concurrency, fn) {
  const list = [...items];
  const out = [];
  let idx = 0;

  async function worker() {
    while (idx < list.length) {
      const i = idx++;
      const item = list[i];
      await sleep(DELAY_MS);
      out[i] = await fn(item, i);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, list.length) }, () => worker());
  await Promise.all(workers);
  return out;
}

async function getHtml(url) {
  if (htmlCache.has(url)) return htmlCache.get(url);
  const res = await fetchWithRetry(url, { maxRedirects: 5, responseType: 'text' });
  const html = typeof res.data === 'string' ? res.data : String(res.data || '');
  const entry = { status: res.status, html, headers: res.headers };
  htmlCache.set(url, entry);
  return entry;
}

async function resolveSamplePost(expected) {
  const sitemapUrl = 'https://faircast.kr/wp-sitemap-posts-post-1.xml';
  try {
    const res = await fetchWithRetry(sitemapUrl, { responseType: 'text' });
    const body = typeof res.data === 'string' ? res.data : String(res.data || '');
    const locs = [...body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map((m) => m[1].trim());
    if (locs.length > 0) {
      // WordPress post sitemaps are typically newest-first; take first
      samplePostUrl = locs[0];
      return samplePostUrl;
    }
  } catch (e) {
    addWarning('SAMPLE_POST', '게시글 URL 1개', `실패: ${e.message}`, '사이트맵에서 샘플 글을 못 가져옴');
  }
  // fallback: use homepage if sitemap fails
  samplePostUrl = expected.site + '/';
  return samplePostUrl;
}

function resolveCheckUrl(checkUrl) {
  if (checkUrl === 'SAMPLE_POST') return samplePostUrl;
  return checkUrl;
}

// ─── A. keyPages ───────────────────────────────────────────
async function checkKeyPages(expected) {
  const entries = Object.entries(expected.keyPages);
  await mapPool(entries, MAX_CONCURRENCY, async ([url, cfg]) => {
    let status = null;
    let html = '';
    let error = null;
    try {
      const res = await fetchWithRetry(url, { maxRedirects: 5, responseType: 'text' });
      status = res.status;
      html = typeof res.data === 'string' ? res.data : String(res.data || '');
      htmlCache.set(url, { status, html, headers: res.headers });
    } catch (e) {
      error = e.message;
    }

    const $ = cheerio.load(html || '');
    const robots = $('meta[name="robots"]').attr('content') || '';
    const hasNoindex = /noindex/i.test(robots);
    const indexable = !hasNoindex;
    const desc = ($('meta[name="description"]').attr('content') || '').trim();
    const canonical = $('link[rel="canonical"]').attr('href') || '';

    const row = {
      label: cfg.label,
      url,
      status: status ?? 'ERR',
      indexable,
      robots,
      description: desc,
      descStatus: 'ok',
      canonical: !!canonical,
      verdict: '✅',
    };

    if (error) {
      addCritical(`${cfg.label} (${url})`, `HTTP ${cfg.expectStatus}`, `요청 실패: ${error}`, '페이지 접근 불가');
      row.verdict = '🔴';
      row.descStatus = 'error';
      detail.keyPages.push(row);
      return;
    }

    if (status !== cfg.expectStatus) {
      addCritical(
        `${cfg.label} (${url})`,
        `HTTP ${cfg.expectStatus}`,
        `HTTP ${status}`,
        '기대 HTTP 상태와 다름'
      );
      row.verdict = '🔴';
    } else {
      addOk(`${cfg.label} HTTP ${status}`);
    }

    if (cfg.expectIndexable === true && hasNoindex) {
      addCritical(
        `${cfg.label} 색인`,
        'indexable (noindex 없음)',
        `noindex: "${robots}"`,
        '색인되어야 하는 페이지에 noindex'
      );
      row.verdict = '🔴';
    } else if (cfg.expectIndexable === false && !hasNoindex) {
      addCritical(
        `${cfg.label} 색인`,
        'noindex',
        robots || '(robots meta 없음)',
        'noindex여야 하는 페이지가 색인 가능'
      );
      row.verdict = '🔴';
    } else {
      addOk(`${cfg.label} 색인 상태 OK`);
    }

    if (!desc) {
      addCritical(`${cfg.label} description`, '비어 있지 않은 description', '(비어 있음)', 'meta description 없음');
      row.descStatus = 'empty';
      row.verdict = '🔴';
    } else if (isDescCssPolluted(desc)) {
      addCritical(
        `${cfg.label} description`,
        '깨끗한 description',
        desc.slice(0, 120),
        'CSS 오염 CRITICAL'
      );
      row.descStatus = 'css-polluted';
      row.verdict = '🔴';
    } else if (cfg.descriptionMustBeKorean && !hasKorean(desc)) {
      addWarning(
        `${cfg.label} description`,
        '한글 포함',
        desc.slice(0, 120),
        'descriptionMustBeKorean인데 한글 없음'
      );
      row.descStatus = 'no-korean';
      if (row.verdict === '✅') row.verdict = '🟡';
    } else {
      addOk(`${cfg.label} description OK`);
    }

    if (!canonical) {
      addWarning(`${cfg.label} canonical`, 'canonical 존재', '(없음)', 'canonical 링크 없음');
      if (row.verdict === '✅') row.verdict = '🟡';
    } else {
      addOk(`${cfg.label} canonical OK`);
    }

    detail.keyPages.push(row);
  });
}

// ─── B. legacyRedirects ────────────────────────────────────
async function checkLegacyRedirects(expected) {
  const cfg = expected.legacyRedirects;
  const urls = cfg.urls || [];
  await mapPool(urls, MAX_CONCURRENCY, async (url) => {
    let status = null;
    let location = '';
    let error = null;
    try {
      const res = await fetchWithRetry(url, { maxRedirects: 0, responseType: 'text' });
      status = res.status;
      location = res.headers.location || res.headers.Location || '';
    } catch (e) {
      // axios may throw on maxRedirects:0 depending on version — treat as redirect if response present
      if (e.response) {
        status = e.response.status;
        location = e.response.headers.location || e.response.headers.Location || '';
      } else {
        error = e.message;
      }
    }

    const row = { url, status: status ?? 'ERR', location, verdict: '✅' };

    if (error) {
      addCritical(`legacy ${url}`, '301/302 → 홈', `요청 실패: ${error}`, '리디렉션 확인 불가');
      row.verdict = '🔴';
      detail.legacyRedirects.push(row);
      return;
    }

    if (status === 200) {
      addCritical(
        `legacy ${url}`,
        '301/302 → 홈',
        'HTTP 200',
        '축구 페이지가 살아있음. 색인에 남는다'
      );
      row.verdict = '🔴';
    } else if (status === 404) {
      addWarning(
        `legacy ${url}`,
        '301/302 → 홈',
        'HTTP 404',
        '301이 아니라 404. 색인 제거는 되지만 느림'
      );
      row.verdict = '🟡';
    } else if ((status === 301 || status === 302) && locationsMatch(location, cfg.expectRedirectTo)) {
      addOk(`legacy ${url} → 홈`);
      row.verdict = '✅';
    } else if (status === 301 || status === 302) {
      addCritical(
        `legacy ${url}`,
        `301/302 → ${cfg.expectRedirectTo}`,
        `${status} → ${location || '(Location 없음)'}`,
        '홈이 아닌 곳으로 리디렉션'
      );
      row.verdict = '🔴';
    } else {
      addCritical(
        `legacy ${url}`,
        '301/302 → 홈',
        `HTTP ${status} Location=${location || '-'}`,
        '예상치 못한 응답'
      );
      row.verdict = '🔴';
    }

    detail.legacyRedirects.push(row);
  });
}

// ─── C. categoryRedirects ──────────────────────────────────
async function checkCategoryRedirects(expected) {
  const map = expected.categoryRedirects || {};
  const entries = Object.entries(map).filter(([k]) => !k.startsWith('_'));
  await mapPool(entries, MAX_CONCURRENCY, async ([url, expectTo]) => {
    let status = null;
    let location = '';
    let error = null;
    try {
      const res = await fetchWithRetry(url, { maxRedirects: 0, responseType: 'text' });
      status = res.status;
      location = res.headers.location || res.headers.Location || '';
    } catch (e) {
      if (e.response) {
        status = e.response.status;
        location = e.response.headers.location || e.response.headers.Location || '';
      } else {
        error = e.message;
      }
    }

    const row = { url, expectTo, status: status ?? 'ERR', location, verdict: '✅' };

    if (error) {
      addCritical(`categoryRedirect ${url}`, expectTo, `요청 실패: ${error}`, '리디렉션 확인 불가');
      row.verdict = '🔴';
    } else if ((status === 301 || status === 302) && locationsMatch(location, expectTo)) {
      addOk(`categoryRedirect ${url}`);
      row.verdict = '✅';
    } else {
      addCritical(
        `categoryRedirect ${url}`,
        `${expectTo} (301/302)`,
        `${status} → ${location || '(없음)'}`,
        'Location이 기대값과 불일치'
      );
      row.verdict = '🔴';
    }

    detail.categoryRedirects.push(row);
  });
}

// ─── D. categoryNoindex ────────────────────────────────────
async function checkCategoryNoindex(expected) {
  const urls = (expected.categoryNoindex && expected.categoryNoindex.urls) || [];
  await mapPool(urls, MAX_CONCURRENCY, async (url) => {
    let status = null;
    let html = '';
    let error = null;
    try {
      const res = await fetchWithRetry(url, { maxRedirects: 5, responseType: 'text' });
      status = res.status;
      html = typeof res.data === 'string' ? res.data : String(res.data || '');
    } catch (e) {
      error = e.message;
    }

    const $ = cheerio.load(html || '');
    const robots = $('meta[name="robots"]').attr('content') || '';
    const hasNoindex = /noindex/i.test(robots);
    const row = { url, status: status ?? 'ERR', robots, hasNoindex, verdict: '✅' };

    if (error) {
      addCritical(`categoryNoindex ${url}`, 'noindex', `요청 실패: ${error}`, '확인 불가');
      row.verdict = '🔴';
    } else if (!hasNoindex) {
      addCritical(
        `categoryNoindex ${url}`,
        'noindex',
        robots || '(robots meta 없음)',
        '리디렉션되지 않는 카테고리는 noindex여야 함'
      );
      row.verdict = '🔴';
    } else {
      addOk(`categoryNoindex ${url}`);
      row.verdict = '✅';
    }

    detail.categoryNoindex.push(row);
  });
}

// ─── E. robotsTxt ──────────────────────────────────────────
async function checkRobotsTxt(expected) {
  const cfg = expected.robotsTxt;
  const url = `${expected.site.replace(/\/$/, '')}/robots.txt`;
  let body = '';
  try {
    const res = await fetchWithRetry(url, { responseType: 'text' });
    body = typeof res.data === 'string' ? res.data : String(res.data || '');
  } catch (e) {
    addCritical('robots.txt', '접근 가능', `실패: ${e.message}`, 'robots.txt 읽기 실패');
    detail.robotsTxt.body = '';
    return;
  }

  detail.robotsTxt.body = body;

  for (const needle of cfg.mustContain || []) {
    if (body.includes(needle)) {
      addOk(`robots.txt mustContain: ${needle}`);
      detail.robotsTxt.checks.push({ needle, type: 'mustContain', ok: true });
    } else {
      addCritical('robots.txt', `포함: ${needle}`, '없음', '필수 항목 누락');
      detail.robotsTxt.checks.push({ needle, type: 'mustContain', ok: false });
    }
  }

  for (const needle of cfg.mustNotContain || []) {
    if (body.includes(needle)) {
      addCritical(
        'robots.txt',
        `포함하지 않음: ${needle}`,
        '포함됨',
        cfg.mustNotContainReason || '금지 패턴 발견'
      );
      detail.robotsTxt.checks.push({ needle, type: 'mustNotContain', ok: false });
    } else {
      addOk(`robots.txt mustNotContain: ${needle}`);
      detail.robotsTxt.checks.push({ needle, type: 'mustNotContain', ok: true });
    }
  }
}

// ─── F. adsTxt ─────────────────────────────────────────────
async function checkAdsTxt(expected) {
  const url = `${expected.site.replace(/\/$/, '')}/ads.txt`;
  const must = expected.adsTxt.mustContain;
  let body = '';
  try {
    const res = await fetchWithRetry(url, { responseType: 'text' });
    body = typeof res.data === 'string' ? res.data : String(res.data || '');
  } catch (e) {
    addCritical('ads.txt', must, `실패: ${e.message}`, 'ads.txt 읽기 실패');
    detail.adsTxt = { body: '', ok: false };
    return;
  }

  const ok = body.includes(must);
  detail.adsTxt = { body, ok };
  if (ok) {
    addOk('ads.txt OK');
  } else {
    addCritical('ads.txt', must, body.slice(0, 200) || '(비어 있음)', '필수 publisher 라인 없음');
  }
}

// ─── G. sitemaps ───────────────────────────────────────────
async function checkSitemaps(expected) {
  const entries = Object.entries(expected.sitemaps || {});
  await mapPool(entries, MAX_CONCURRENCY, async ([url, cfg]) => {
    let count = 0;
    let error = null;
    try {
      const res = await fetchWithRetry(url, { responseType: 'text' });
      const body = typeof res.data === 'string' ? res.data : String(res.data || '');
      // count <loc> — sitemap index or urlset
      count = (body.match(/<loc>/gi) || []).length;
    } catch (e) {
      error = e.message;
    }

    const row = { url, count, minUrls: cfg.minUrls, verdict: '✅' };
    if (error) {
      addCritical(`sitemap ${url}`, `minUrls ≥ ${cfg.minUrls}`, `실패: ${error}`, '사이트맵 읽기 실패');
      row.verdict = '🔴';
    } else if (count < cfg.minUrls) {
      addCritical(
        `sitemap ${url}`,
        `minUrls ≥ ${cfg.minUrls}`,
        `${count}개`,
        '사이트맵 URL 수 부족'
      );
      row.verdict = '🔴';
    } else {
      addOk(`sitemap ${url} (${count})`);
      row.verdict = '✅';
    }
    detail.sitemaps.push(row);
  });
}

// ─── H. snippetFootprints ──────────────────────────────────
async function checkSnippetFootprints(expected) {
  const footprints = expected.snippetFootprints || {};
  const keys = Object.keys(footprints).filter((k) => !k.startsWith('_'));

  // sequential-ish via pool to respect delay; html cache helps
  await mapPool(keys, MAX_CONCURRENCY, async (key) => {
    const fp = footprints[key];
    const checkUrl = resolveCheckUrl(fp.checkUrl);
    const row = {
      key,
      expect: fp.expect,
      actual: null,
      verdict: '✅',
      checkUrl,
      reason: fp.reason || '',
    };

    let html = '';
    let status = null;
    try {
      const entry = await getHtml(checkUrl);
      html = entry.html;
      status = entry.status;
    } catch (e) {
      addCritical(`snippet ${key}`, fp.expect, `요청 실패: ${e.message}`, '스니펫 확인 불가');
      row.actual = 'error';
      row.verdict = '🔴';
      detail.snippets.push(row);
      return;
    }

    let detectedActive = false;

    if (fp.test === 'metaDescriptionIsClean') {
      const $ = cheerio.load(html);
      const desc = ($('meta[name="description"]').attr('content') || '').trim();
      const clean = !!desc && !isDescCssPolluted(desc);
      detectedActive = clean; // "active" means the clean-meta snippet is working
      row.detail = desc ? desc.slice(0, 80) : '(empty)';
    } else if (fp.test === 'htmlContains') {
      detectedActive = html.includes(fp.needle);
    } else if (fp.test === 'htmlNotContains') {
      // active means the bad pattern IS present; inactive means absent
      // For expect inactive + htmlNotContains: pass when needle absent
      const present = html.includes(fp.needle);
      detectedActive = present; // "active" = footprint of the bad/good code is present
      // Wait — for htmlNotContains with expect inactive:
      //   if needle absent → actual = inactive → match expect → OK
      //   if needle present → actual = active → mismatch → CRITICAL
      // So detectedActive = present is correct for matching against expect active/inactive.
    } else {
      addWarning(`snippet ${key}`, fp.test, 'unknown test', '알 수 없는 test 타입');
      row.actual = 'unknown';
      row.verdict = '🟡';
      detail.snippets.push(row);
      return;
    }

    const actual = detectedActive ? 'active' : 'inactive';
    row.actual = actual;

    if (actual === fp.expect) {
      addOk(`snippet ${key} = ${actual}`);
      row.verdict = '✅';
    } else {
      const why = fp.reason
        ? `기대(${fp.expect}) ≠ 실제(${actual}). ${fp.reason}`
        : `기대(${fp.expect}) ≠ 실제(${actual})`;
      addCritical(`snippet ${key}`, fp.expect, `${actual} (HTTP ${status})`, why);
      row.verdict = '🔴';
    }

    detail.snippets.push(row);
  });
}

// ─── I. policyRedFlags ─────────────────────────────────────
async function checkPolicyRedFlags(expected) {
  const needles = (expected.policyRedFlags && expected.policyRedFlags.htmlMustNotContain) || [];
  const keyUrls = Object.keys(expected.keyPages || {});

  // ensure html cached
  for (const url of keyUrls) {
    if (!htmlCache.has(url)) {
      try {
        await getHtml(url);
        await sleep(DELAY_MS);
      } catch (_) {}
    }
  }

  for (const { needle, why } of needles) {
    const foundOn = [];
    for (const url of keyUrls) {
      const entry = htmlCache.get(url);
      if (entry && entry.html && entry.html.includes(needle)) {
        foundOn.push(url);
      }
    }
    if (foundOn.length > 0) {
      addWarning(
        `policyRedFlag: ${needle}`,
        '없어야 함',
        foundOn.join(', '),
        why
      );
      detail.policyRedFlags.push({ needle, why, foundOn, verdict: '🟡' });
    } else {
      addOk(`policyRedFlag clean: ${needle}`);
      detail.policyRedFlags.push({ needle, why, foundOn: [], verdict: '✅' });
    }
  }
}

// ─── Report ────────────────────────────────────────────────
function overallStatus() {
  if (results.critical.length > 0) return '위험';
  if (results.warning.length > 0) return '주의';
  return '정상';
}

function formatIssueList(list) {
  if (list.length === 0) return '_없음_\n';
  return list
    .map(
      (x) =>
        `- **${x.item}**\n  - 기대: ${x.expect}\n  - 실제: ${x.actual}\n  - 왜: ${x.why}`
    )
    .join('\n\n') + '\n';
}

function buildReport(stamp) {
  const status = overallStatus();
  const lines = [];

  lines.push(`# 사이트 상태 점검 — ${stamp.date} ${stamp.time}`);
  lines.push('');
  lines.push('> User-Agent: Googlebot | 캐시 무력화 적용');
  if (QUICK) lines.push('> 모드: `--quick` (legacyRedirects + robotsTxt + snippetFootprints)');
  lines.push('');
  lines.push('## 종합');
  lines.push('');
  lines.push('| 판정 | 개수 |');
  lines.push('|------|------|');
  lines.push(`| 🔴 CRITICAL | ${results.critical.length} |`);
  lines.push(`| 🟡 경고 | ${results.warning.length} |`);
  lines.push(`| ✅ 정상 | ${results.ok.length} |`);
  lines.push('');
  lines.push(`**상태: ${status}**`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## 🔴 CRITICAL');
  lines.push('');
  lines.push(formatIssueList(results.critical));
  lines.push('## 🟡 경고');
  lines.push('');
  lines.push(formatIssueList(results.warning));
  lines.push('---');
  lines.push('');
  lines.push('## 상세');
  lines.push('');

  if (!QUICK) {
    lines.push(`### 핵심 페이지 (${detail.keyPages.length}개)`);
    lines.push('| 페이지 | 상태 | 색인 | description |');
    lines.push('|--------|------|------|-------------|');
    for (const r of detail.keyPages) {
      const descShort = (r.description || '').slice(0, 60).replace(/\|/g, '\\|');
      lines.push(
        `| ${r.label} ${r.verdict} | ${r.status} | ${r.indexable ? '가능' : 'noindex'} | ${r.descStatus}${descShort ? ': ' + descShort : ''} |`
      );
    }
    lines.push('');
  }

  lines.push(`### World Cup 잔재 리디렉션 (${detail.legacyRedirects.length}개)`);
  lines.push('| URL | 상태 | Location | 판정 |');
  lines.push('|-----|------|----------|------|');
  for (const r of detail.legacyRedirects) {
    lines.push(`| ${r.url} | ${r.status} | ${r.location || '-'} | ${r.verdict} |`);
  }
  lines.push('');

  if (!QUICK && detail.categoryRedirects.length) {
    lines.push('### 카테고리 리디렉션');
    lines.push('| URL | 기대 Location | 실제 | 판정 |');
    lines.push('|-----|---------------|------|------|');
    for (const r of detail.categoryRedirects) {
      lines.push(`| ${r.url} | ${r.expectTo} | ${r.status} → ${r.location || '-'} | ${r.verdict} |`);
    }
    lines.push('');
  }

  if (!QUICK && detail.categoryNoindex.length) {
    lines.push('### 카테고리 noindex');
    lines.push('| URL | robots | 판정 |');
    lines.push('|-----|--------|------|');
    for (const r of detail.categoryNoindex) {
      lines.push(`| ${r.url} | ${r.robots || '-'} | ${r.verdict} |`);
    }
    lines.push('');
  }

  lines.push('### 스니펫 상태 (외부 탐지)');
  if (samplePostUrl) lines.push(`> SAMPLE_POST: ${samplePostUrl}`);
  lines.push('| 스니펫 | 기대 | 실제 | 판정 |');
  lines.push('|--------|------|------|------|');
  for (const r of detail.snippets) {
    lines.push(`| ${r.key} | ${r.expect} | ${r.actual} | ${r.verdict} |`);
  }
  lines.push('');

  lines.push('### robots.txt');
  lines.push('');
  lines.push('```');
  lines.push(detail.robotsTxt.body || '(empty)');
  lines.push('```');
  lines.push('');

  if (!QUICK) {
    lines.push('### 사이트맵');
    lines.push('| Sitemap | URL 수 | 기준 | 판정 |');
    lines.push('|---------|--------|------|------|');
    for (const r of detail.sitemaps) {
      lines.push(`| ${r.url} | ${r.count} | ≥ ${r.minUrls} | ${r.verdict} |`);
    }
    lines.push('');

    lines.push('### ads.txt');
    lines.push('');
    lines.push('```');
    lines.push(detail.adsTxt.body || '(empty)');
    lines.push('```');
    lines.push('');

    if (detail.policyRedFlags.length) {
      lines.push('### 정책 레드플래그');
      lines.push('| needle | 발견 | 판정 |');
      lines.push('|--------|------|------|');
      for (const r of detail.policyRedFlags) {
        lines.push(
          `| \`${r.needle}\` | ${r.foundOn.length ? r.foundOn.join(', ') : '없음'} | ${r.verdict} |`
        );
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function printConsoleSummary(stamp) {
  const status = overallStatus();
  console.log('');
  console.log('══════════════════════════════════════');
  console.log(` 사이트 상태 점검 — ${stamp.date} ${stamp.time}`);
  console.log(` 모드: ${QUICK ? 'quick' : 'full'} | UA: Googlebot`);
  console.log('══════════════════════════════════════');
  console.log(` 🔴 CRITICAL: ${results.critical.length}`);
  console.log(` 🟡 경고:     ${results.warning.length}`);
  console.log(` ✅ 정상:     ${results.ok.length}`);
  console.log(` 상태: ${status}`);
  console.log('──────────────────────────────────────');
  if (results.critical.length) {
    console.log(' CRITICAL 항목:');
    for (const c of results.critical) {
      console.log(`  - ${c.item}: ${c.actual} (기대: ${c.expect})`);
    }
  }
  if (results.warning.length) {
    console.log(' 경고 항목:');
    for (const w of results.warning) {
      console.log(`  - ${w.item}: ${w.actual}`);
    }
  }
  console.log('');
}

async function main() {
  if (!fs.existsSync(EXPECTED_PATH)) {
    console.error(`expected-state.json 없음: ${EXPECTED_PATH}`);
    process.exit(1);
  }

  const expected = JSON.parse(fs.readFileSync(EXPECTED_PATH, 'utf8'));
  const stamp = nowStamp();

  console.log(`로드: ${EXPECTED_PATH}`);
  console.log(`사이트: ${expected.site} | lastUpdated: ${expected.lastUpdated}`);
  console.log(`모드: ${QUICK ? '--quick' : 'full'}`);

  // SAMPLE_POST needed for snippets (always run in both modes)
  await resolveSamplePost(expected);
  if (samplePostUrl) console.log(`SAMPLE_POST: ${samplePostUrl}`);

  if (QUICK) {
    console.log('\n[1/3] legacyRedirects...');
    await checkLegacyRedirects(expected);
    console.log('[2/3] robotsTxt...');
    await checkRobotsTxt(expected);
    console.log('[3/3] snippetFootprints...');
    await checkSnippetFootprints(expected);
  } else {
    console.log('\n[1/9] keyPages...');
    await checkKeyPages(expected);
    console.log('[2/9] legacyRedirects...');
    await checkLegacyRedirects(expected);
    console.log('[3/9] categoryRedirects...');
    await checkCategoryRedirects(expected);
    console.log('[4/9] categoryNoindex...');
    await checkCategoryNoindex(expected);
    console.log('[5/9] robotsTxt...');
    await checkRobotsTxt(expected);
    console.log('[6/9] adsTxt...');
    await checkAdsTxt(expected);
    console.log('[7/9] sitemaps...');
    await checkSitemaps(expected);
    console.log('[8/9] snippetFootprints...');
    await checkSnippetFootprints(expected);
    console.log('[9/9] policyRedFlags...');
    await checkPolicyRedFlags(expected);
  }

  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const reportPath = path.join(REPORTS_DIR, `state-${stamp.ymd}.md`);
  const report = buildReport(stamp);
  fs.writeFileSync(reportPath, report, 'utf8');

  printConsoleSummary(stamp);
  console.log(`리포트: ${reportPath}`);

  process.exit(results.critical.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('치명적 오류:', e);
  process.exit(1);
});

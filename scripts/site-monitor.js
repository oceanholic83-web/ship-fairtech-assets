'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const GOOGLEBOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const DELAY_MS = 400;
const MAX_CONCURRENCY = 3;
const MAX_RETRIES = 2;
const TIMEOUT_MS = 20000;
const SITE = 'https://faircast.kr';

const ROOT = path.join(__dirname, '..');
const EXPECTED_PATH = path.join(ROOT, 'monitor', 'expected-state.json');
const REPORTS_DIR = path.join(ROOT, 'monitor', 'reports');
const SLUGS_PATH = path.join(ROOT, 'monitor', 'slugs.md');

const QUICK = process.argv.includes('--quick');
const POSTS_ONLY = process.argv.includes('--posts');

// Infra check results
const results = { critical: [], warning: [], ok: [] };

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
  buildStamp: null,
};

// Post audit state (kept separate from infra results for clean grouping)
const postAudit = {
  connected: false,
  apiPostCount: 0,
  apiPosts: [],
  sitemapCount: 0,
  liveChecks: [],
};

let samplePostUrl = null;
const htmlCache = new Map();

// ── Utilities ──────────────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function pad2(n) { return String(n).padStart(2, '0'); }

function nowStamp() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
    ymd: `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`,
  };
}

function addCritical(item, expect, actual, why) { results.critical.push({ item, expect, actual, why }); }
function addWarning(item, expect, actual, why) { results.warning.push({ item, expect, actual, why }); }
function addOk(item) { results.ok.push({ item }); }

function isDescCssPolluted(desc) {
  if (!desc) return false;
  if (/\{[^}]*:[^}]*\}/.test(desc)) return true;
  if (desc.includes('!important')) return true;
  if (desc.startsWith('body.page-id')) return true;
  return false;
}

function hasKorean(text) { return /[가-힣]/.test(text || ''); }

function locationsMatch(actual, expected) {
  if (!actual || !expected) return false;
  const norm = s => s.trim().replace(/\/$/, '');
  if (norm(actual) === norm(expected)) return true;
  try {
    const a = new URL(actual, SITE).href.replace(/\/$/, '');
    const e = new URL(expected, SITE).href.replace(/\/$/, '');
    return a === e;
  } catch (_) { return false; }
}

async function fetchOnce(url, opts = {}) {
  return axios.get(url, {
    headers: { 'User-Agent': GOOGLEBOT_UA, 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    timeout: TIMEOUT_MS,
    maxRedirects: opts.maxRedirects !== undefined ? opts.maxRedirects : 5,
    validateStatus: () => true,
    responseType: opts.responseType || 'text',
    transitional: { clarifyTimeoutError: true },
  });
}

async function fetchWithRetry(url, opts = {}, retries = MAX_RETRIES) {
  try {
    return await fetchOnce(url, opts);
  } catch (e) {
    if (retries > 0) { await sleep(1000); return fetchWithRetry(url, opts, retries - 1); }
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
      await sleep(DELAY_MS);
      out[i] = await fn(list[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, worker));
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

// ── Config ─────────────────────────────────────────────────────────────────────

function loadMonitorConfig() {
  const p = path.join(ROOT, 'monitor', 'config.local.json');
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { console.warn('[WARN] config.local.json 파싱 실패:', e.message); return null; }
}

// ── API ────────────────────────────────────────────────────────────────────────

async function fetchApiPosts(cfg) {
  if (!cfg || !cfg.monitorApi || !cfg.monitorKey) return null;
  try {
    const res = await axios.get(`${cfg.monitorApi}?key=${encodeURIComponent(cfg.monitorKey)}`, {
      headers: { 'User-Agent': GOOGLEBOT_UA },
      timeout: TIMEOUT_MS,
      validateStatus: () => true,
    });
    if (res.status !== 200) { console.warn(`[WARN] API HTTP ${res.status}`); return null; }
    if (!res.data || !Array.isArray(res.data.posts)) { console.warn('[WARN] API 응답에 posts 없음'); return null; }
    return res.data.posts;
  } catch (e) {
    console.warn('[WARN] API 실패:', e.message);
    return null;
  }
}

// ── Post Audit ─────────────────────────────────────────────────────────────────

function countInternalLinks($) {
  let n = 0;
  $('a[href]').each((_, el) => {
    const h = $(el).attr('href') || '';
    if (h.includes('faircast.kr') || (h.startsWith('/') && !h.startsWith('//'))) n++;
  });
  return n;
}

function countMissingAlt($) {
  let n = 0;
  $('img').each((_, el) => {
    const a = $(el).attr('alt');
    if (a === undefined || a === '') n++;
  });
  return n;
}

function bodyCharCount($) {
  const $c = cheerio.load($.html());
  $c('script, style, nav, header, footer, noscript').remove();
  return $c('body').text().replace(/\s+/g, ' ').trim().length;
}

async function checkSinglePost(apiPost) {
  const slug = apiPost.slug;
  const url = `${SITE}/${slug}/`;
  const excerptEmpty = !apiPost.excerpt || String(apiPost.excerpt).trim() === '';

  const r = {
    slug, url,
    title: apiPost.title || slug,
    date: apiPost.date || '',
    excerptEmpty,
    status: null, error: null,
    metaDesc: '', descMissing: false, descCssPolluted: false, descLenWarn: false,
    hasArticleSchema: false, hasDatePublished: false, hasAuthorBio: false,
    hasNoindex: false,
    canonical: '', canonicalMismatch: false,
    bodyLen: 0, bodyShort: false,
    internalLinks: 0, fewLinks: false,
    imgAltMissing: 0, imgAltWarn: false,
  };

  let html = '';
  try {
    const res = await fetchWithRetry(url, { maxRedirects: 5, responseType: 'text' });
    r.status = res.status;
    html = typeof res.data === 'string' ? res.data : String(res.data || '');
  } catch (e) {
    r.error = e.message;
    return r;
  }

  if (r.status !== 200) return r;

  const $ = cheerio.load(html);

  r.hasNoindex = /noindex/i.test($('meta[name="robots"]').attr('content') || '');

  r.metaDesc = ($('meta[name="description"]').attr('content') || '').trim();
  r.descMissing = !r.metaDesc;
  r.descCssPolluted = !r.descMissing && isDescCssPolluted(r.metaDesc);
  r.descLenWarn = !r.descMissing && (r.metaDesc.length < 50 || r.metaDesc.length > 300);

  const ldJson = $('script[type="application/ld+json"]').map((_, el) => $(el).html()).get().join('\n');
  r.hasArticleSchema = /\"@type\"\s*:\s*\"Article\"/.test(ldJson);
  r.hasDatePublished = ldJson.includes('"datePublished"');

  r.hasAuthorBio = html.includes('ABOUT THE EDITORIAL DESK');

  r.canonical = ($('link[rel="canonical"]').attr('href') || '').trim();
  r.canonicalMismatch = !!r.canonical && r.canonical.replace(/\/$/, '') !== url.replace(/\/$/, '');

  r.bodyLen = bodyCharCount($);
  r.bodyShort = r.bodyLen < 800;

  r.internalLinks = countInternalLinks($);
  r.fewLinks = r.internalLinks < 3;

  r.imgAltMissing = countMissingAlt($);
  r.imgAltWarn = r.imgAltMissing >= 2;

  return r;
}

async function fetchSitemapUrls() {
  try {
    const res = await fetchWithRetry(`${SITE}/wp-sitemap-posts-post-1.xml`, { responseType: 'text' });
    const body = typeof res.data === 'string' ? res.data : '';
    return [...body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m => m[1].trim());
  } catch (_) { return []; }
}

async function runPostAudit(apiPosts) {
  console.log(`  ${apiPosts.length}편 라이브 검사 (동시 ${MAX_CONCURRENCY}, ${DELAY_MS}ms 딜레이)...`);
  let done = 0;
  const checks = await mapPool(apiPosts, MAX_CONCURRENCY, async post => {
    const r = await checkSinglePost(post);
    done++;
    process.stdout.write(`  [${done}/${apiPosts.length}] ${r.slug.slice(0, 50)}${' '.repeat(10)}\r`);
    return r;
  });
  process.stdout.write('\n');
  return checks;
}

// ── V1 Checks ──────────────────────────────────────────────────────────────────

async function resolveSamplePost(expected) {
  try {
    const res = await fetchWithRetry(`${SITE}/wp-sitemap-posts-post-1.xml`, { responseType: 'text' });
    const body = typeof res.data === 'string' ? res.data : '';
    const locs = [...body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m => m[1].trim());
    if (locs.length > 0) { samplePostUrl = locs[0]; return; }
  } catch (e) {
    addWarning('SAMPLE_POST', '게시글 URL', `실패: ${e.message}`, '사이트맵 읽기 실패');
  }
  samplePostUrl = expected.site + '/';
}

function resolveCheckUrl(url) { return url === 'SAMPLE_POST' ? samplePostUrl : url; }

async function checkKeyPages(expected) {
  await mapPool(Object.entries(expected.keyPages), MAX_CONCURRENCY, async ([url, cfg]) => {
    let status = null, html = '', error = null;
    try {
      const res = await fetchWithRetry(url, { maxRedirects: 5, responseType: 'text' });
      status = res.status;
      html = typeof res.data === 'string' ? res.data : '';
      htmlCache.set(url, { status, html, headers: res.headers });
    } catch (e) { error = e.message; }

    const $ = cheerio.load(html || '');
    const robots = $('meta[name="robots"]').attr('content') || '';
    const hasNoindex = /noindex/i.test(robots);
    const desc = ($('meta[name="description"]').attr('content') || '').trim();
    const canonical = $('link[rel="canonical"]').attr('href') || '';

    const row = { label: cfg.label, url, status: status ?? 'ERR', indexable: !hasNoindex, robots, description: desc, descStatus: 'ok', canonical: !!canonical, verdict: '✅' };

    if (error) {
      addCritical(`${cfg.label} (${url})`, `HTTP ${cfg.expectStatus}`, `요청 실패: ${error}`, '페이지 접근 불가');
      row.verdict = '🔴'; row.descStatus = 'error'; detail.keyPages.push(row); return;
    }

    if (status !== cfg.expectStatus) { addCritical(`${cfg.label}`, `HTTP ${cfg.expectStatus}`, `HTTP ${status}`, '기대 HTTP 상태 불일치'); row.verdict = '🔴'; }
    else addOk(`${cfg.label} HTTP`);

    if (cfg.expectIndexable === true && hasNoindex) { addCritical(`${cfg.label} 색인`, 'indexable', `noindex: "${robots}"`, '색인되어야 하는 페이지에 noindex'); row.verdict = '🔴'; }
    else if (cfg.expectIndexable === false && !hasNoindex) { addCritical(`${cfg.label} 색인`, 'noindex', robots || '없음', 'noindex여야 함'); row.verdict = '🔴'; }
    else addOk(`${cfg.label} 색인`);

    if (!desc) { addCritical(`${cfg.label} description`, 'description 있음', '없음', 'meta description 없음'); row.descStatus = 'empty'; row.verdict = '🔴'; }
    else if (isDescCssPolluted(desc)) { addCritical(`${cfg.label} description`, '깨끗한 description', desc.slice(0, 120), 'CSS 오염'); row.descStatus = 'css-polluted'; row.verdict = '🔴'; }
    else if (cfg.descriptionMustBeKorean && !hasKorean(desc)) { addWarning(`${cfg.label} description`, '한글 포함', desc.slice(0, 120), '한글 없음'); row.descStatus = 'no-korean'; if (row.verdict === '✅') row.verdict = '🟡'; }
    else addOk(`${cfg.label} description`);

    if (!canonical) { addWarning(`${cfg.label} canonical`, 'canonical 존재', '없음', 'canonical 없음'); if (row.verdict === '✅') row.verdict = '🟡'; }
    else addOk(`${cfg.label} canonical`);

    detail.keyPages.push(row);
  });
}

async function checkLegacyRedirects(expected) {
  await mapPool(expected.legacyRedirects.urls || [], MAX_CONCURRENCY, async url => {
    let status = null, location = '', error = null;
    try {
      const res = await fetchWithRetry(url, { maxRedirects: 0, responseType: 'text' });
      status = res.status; location = res.headers.location || '';
    } catch (e) {
      if (e.response) { status = e.response.status; location = e.response.headers.location || ''; }
      else error = e.message;
    }
    const row = { url, status: status ?? 'ERR', location, verdict: '✅' };
    if (error) { addCritical(`legacy ${url}`, '301→홈', `실패: ${error}`, '확인 불가'); row.verdict = '🔴'; }
    else if (status === 200) { addCritical(`legacy ${url}`, '301→홈', 'HTTP 200', '축구 페이지 살아있음'); row.verdict = '🔴'; }
    else if (status === 404) { addWarning(`legacy ${url}`, '301→홈', 'HTTP 404', '301 아닌 404'); row.verdict = '🟡'; }
    else if ((status === 301 || status === 302) && locationsMatch(location, expected.legacyRedirects.expectRedirectTo)) { addOk(`legacy ${url}`); }
    else if (status === 301 || status === 302) { addCritical(`legacy ${url}`, `301→${expected.legacyRedirects.expectRedirectTo}`, `${status}→${location || '-'}`, '홈 아닌 곳으로 리디렉션'); row.verdict = '🔴'; }
    else { addCritical(`legacy ${url}`, '301→홈', `HTTP ${status}`, '예상 밖 응답'); row.verdict = '🔴'; }
    detail.legacyRedirects.push(row);
  });
}

async function checkCategoryRedirects(expected) {
  const entries = Object.entries(expected.categoryRedirects || {}).filter(([k]) => !k.startsWith('_'));
  await mapPool(entries, MAX_CONCURRENCY, async ([url, expectTo]) => {
    let status = null, location = '', error = null;
    try {
      const res = await fetchWithRetry(url, { maxRedirects: 0, responseType: 'text' });
      status = res.status; location = res.headers.location || '';
    } catch (e) {
      if (e.response) { status = e.response.status; location = e.response.headers.location || ''; }
      else error = e.message;
    }
    const row = { url, expectTo, status: status ?? 'ERR', location, verdict: '✅' };
    if (error) { addCritical(`catRedirect ${url}`, expectTo, `실패: ${error}`, '확인 불가'); row.verdict = '🔴'; }
    else if ((status === 301 || status === 302) && locationsMatch(location, expectTo)) addOk(`catRedirect ${url}`);
    else { addCritical(`catRedirect ${url}`, `${expectTo} (301/302)`, `${status}→${location || '-'}`, 'Location 불일치'); row.verdict = '🔴'; }
    detail.categoryRedirects.push(row);
  });
}

async function checkCategoryNoindex(expected) {
  const urls = (expected.categoryNoindex && expected.categoryNoindex.urls) || [];
  await mapPool(urls, MAX_CONCURRENCY, async url => {
    let status = null, html = '', error = null;
    try {
      const res = await fetchWithRetry(url, { maxRedirects: 5, responseType: 'text' });
      status = res.status; html = typeof res.data === 'string' ? res.data : '';
    } catch (e) { error = e.message; }
    const $ = cheerio.load(html || '');
    const robots = $('meta[name="robots"]').attr('content') || '';
    const hasNoindex = /noindex/i.test(robots);
    const row = { url, status: status ?? 'ERR', robots, hasNoindex, verdict: '✅' };
    if (error) { addCritical(`catNoindex ${url}`, 'noindex', `실패: ${error}`, '확인 불가'); row.verdict = '🔴'; }
    else if (!hasNoindex) { addCritical(`catNoindex ${url}`, 'noindex', robots || '없음', 'noindex 없음'); row.verdict = '🔴'; }
    else addOk(`catNoindex ${url}`);
    detail.categoryNoindex.push(row);
  });
}

async function checkRobotsTxt(expected) {
  const url = `${expected.site.replace(/\/$/, '')}/robots.txt`;
  const cfg = expected.robotsTxt;
  let body = '';
  try {
    const res = await fetchWithRetry(url, { responseType: 'text' });
    body = typeof res.data === 'string' ? res.data : '';
  } catch (e) { addCritical('robots.txt', '접근 가능', `실패: ${e.message}`, '읽기 실패'); detail.robotsTxt.body = ''; return; }
  detail.robotsTxt.body = body;
  for (const n of cfg.mustContain || []) {
    if (body.includes(n)) { addOk(`robots.txt mustContain: ${n}`); detail.robotsTxt.checks.push({ needle: n, type: 'mustContain', ok: true }); }
    else { addCritical('robots.txt', `포함: ${n}`, '없음', '필수 항목 누락'); detail.robotsTxt.checks.push({ needle: n, type: 'mustContain', ok: false }); }
  }
  for (const n of cfg.mustNotContain || []) {
    if (body.includes(n)) { addCritical('robots.txt', `없어야 함: ${n}`, '포함됨', cfg.mustNotContainReason || '금지 패턴'); detail.robotsTxt.checks.push({ needle: n, type: 'mustNotContain', ok: false }); }
    else { addOk(`robots.txt mustNotContain: ${n}`); detail.robotsTxt.checks.push({ needle: n, type: 'mustNotContain', ok: true }); }
  }
}

async function checkAdsTxt(expected) {
  const url = `${expected.site.replace(/\/$/, '')}/ads.txt`;
  const must = expected.adsTxt.mustContain;
  let body = '';
  try {
    const res = await fetchWithRetry(url, { responseType: 'text' });
    body = typeof res.data === 'string' ? res.data : '';
  } catch (e) { addCritical('ads.txt', must, `실패: ${e.message}`, '읽기 실패'); detail.adsTxt = { body: '', ok: false }; return; }
  const ok = body.includes(must);
  detail.adsTxt = { body, ok };
  if (ok) addOk('ads.txt OK'); else addCritical('ads.txt', must, body.slice(0, 200) || '(비어 있음)', 'publisher 라인 없음');
}

async function checkSitemaps(expected) {
  await mapPool(Object.entries(expected.sitemaps || {}), MAX_CONCURRENCY, async ([url, cfg]) => {
    let count = 0, error = null;
    try {
      const res = await fetchWithRetry(url, { responseType: 'text' });
      const body = typeof res.data === 'string' ? res.data : '';
      count = (body.match(/<loc>/gi) || []).length;
    } catch (e) { error = e.message; }
    const row = { url, count, minUrls: cfg.minUrls, verdict: '✅' };
    if (error) { addCritical(`sitemap ${url}`, `≥${cfg.minUrls}`, `실패: ${error}`, '읽기 실패'); row.verdict = '🔴'; }
    else if (count < cfg.minUrls) { addCritical(`sitemap ${url}`, `≥${cfg.minUrls}`, `${count}개`, 'URL 수 부족'); row.verdict = '🔴'; }
    else addOk(`sitemap (${count})`);
    detail.sitemaps.push(row);
  });
}

async function checkSnippetFootprints(expected) {
  const keys = Object.keys(expected.snippetFootprints || {}).filter(k => !k.startsWith('_'));
  await mapPool(keys, MAX_CONCURRENCY, async key => {
    const fp = expected.snippetFootprints[key];
    const checkUrl = resolveCheckUrl(fp.checkUrl);
    const row = { key, expect: fp.expect, actual: null, verdict: '✅', checkUrl, reason: fp.reason || '' };
    let html = '', status = null;
    try { const e = await getHtml(checkUrl); html = e.html; status = e.status; }
    catch (e) { addCritical(`snippet ${key}`, fp.expect, `실패: ${e.message}`, '확인 불가'); row.actual = 'error'; row.verdict = '🔴'; detail.snippets.push(row); return; }

    let detectedActive = false;
    if (fp.test === 'metaDescriptionIsClean') {
      const $ = cheerio.load(html);
      const desc = ($('meta[name="description"]').attr('content') || '').trim();
      detectedActive = !!desc && !isDescCssPolluted(desc);
      row.detail = desc ? desc.slice(0, 80) : '(empty)';
    } else if (fp.test === 'htmlContains') {
      detectedActive = html.includes(fp.needle);
    } else if (fp.test === 'htmlNotContains') {
      detectedActive = html.includes(fp.needle);
    } else {
      addWarning(`snippet ${key}`, fp.test, 'unknown test', '알 수 없는 test 타입');
      row.actual = 'unknown'; row.verdict = '🟡'; detail.snippets.push(row); return;
    }

    const actual = detectedActive ? 'active' : 'inactive';
    row.actual = actual;
    if (actual === fp.expect) addOk(`snippet ${key} = ${actual}`);
    else { addCritical(`snippet ${key}`, fp.expect, `${actual} (HTTP ${status})`, fp.reason || `기대(${fp.expect})≠실제(${actual})`); row.verdict = '🔴'; }
    detail.snippets.push(row);
  });
}

async function checkBuildStamp(expected) {
  const cfg = expected.buildStamp;
  if (!cfg) return;

  const srcPath = path.join(ROOT, cfg.sourceFile);
  let localRev = null;
  try {
    localRev = crypto.createHash('sha256').update(fs.readFileSync(srcPath)).digest('hex').slice(0, 8);
  } catch (e) {
    addWarning('buildStamp', `${cfg.sourceFile} 읽기`, `실패: ${e.message}`, '로컬 파일 없음');
    detail.buildStamp = { verdict: '🟡', localRev: null, liveRev: null, builtAt: null, why: '로컬 파일 읽기 실패' };
    return;
  }

  let html = '';
  try {
    const e = await getHtml(cfg.checkUrl);
    html = e.html;
  } catch (e) {
    addCritical('buildStamp', '라이브 페이지 조회', `실패: ${e.message}`, '확인 불가');
    detail.buildStamp = { verdict: '🔴', localRev, liveRev: null, builtAt: null, why: '페이지 조회 실패' };
    return;
  }

  const re = new RegExp(cfg.marker + ' data-rev:([0-9a-f]{8}) built:(\\d{4}-\\d{2}-\\d{2})');
  const m = html.match(re);

  if (!m) {
    addCritical(
      'buildStamp',
      `${cfg.marker} 스탬프 존재`,
      '없음',
      '라이브 페이지에 빌드 스탬프가 없다. 구버전 HTML이 붙어 있을 가능성이 높다.'
    );
    detail.buildStamp = { verdict: '🔴', localRev, liveRev: null, builtAt: null, why: '스탬프 없음' };
    return;
  }

  const liveRev = m[1];
  const builtAt = m[2];
  detail.buildStamp = { verdict: '✅', localRev, liveRev, builtAt, why: '' };

  if (liveRev !== localRev) {
    detail.buildStamp.verdict = '🔴';
    detail.buildStamp.why = '붙여넣기 누락 의심';
    addCritical(
      'buildStamp',
      `data-rev:${localRev} (로컬 ${cfg.sourceFile})`,
      `data-rev:${liveRev} (라이브, ${builtAt} 빌드)`,
      `${cfg.sourceFile}가 라이브에 반영되지 않았다. pages/port-guide 에서 node build.js 실행 후 생성된 port-guide.html을 WordPress 항만 가이드 페이지에 붙여넣을 것.`
    );
  } else {
    addOk(`buildStamp ${liveRev} (${builtAt}) = 로컬 ${cfg.sourceFile}`);
  }
}

async function checkPolicyRedFlags(expected) {
  const needles = (expected.policyRedFlags && expected.policyRedFlags.htmlMustNotContain) || [];
  const keyUrls = Object.keys(expected.keyPages || {});
  for (const url of keyUrls) { if (!htmlCache.has(url)) { try { await getHtml(url); await sleep(DELAY_MS); } catch (_) {} } }
  for (const { needle, why } of needles) {
    const foundOn = keyUrls.filter(url => { const e = htmlCache.get(url); return e && e.html && e.html.includes(needle); });
    if (foundOn.length > 0) { addWarning(`policyRedFlag: ${needle}`, '없어야 함', foundOn.join(', '), why); detail.policyRedFlags.push({ needle, why, foundOn, verdict: '🟡' }); }
    else { addOk(`policyRedFlag clean: ${needle}`); detail.policyRedFlags.push({ needle, why, foundOn: [], verdict: '✅' }); }
  }
}

// ── Slugs file ─────────────────────────────────────────────────────────────────

function loadCategoryLabels() {
  const labels = {};
  for (const dir of ['hello-korea', 'hello-world', 'port-guide']) {
    const cfgPath = path.join(ROOT, 'pages', dir, 'config.json');
    if (!fs.existsSync(cfgPath)) continue;
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      if (cfg.categoryLabels) Object.assign(labels, cfg.categoryLabels);
    } catch (_) {}
  }
  return labels;
}

function writeSlugsFile(stamp, apiPosts, checks, expected) {
  const catLabels = loadCategoryLabels();
  const checksMap = new Map(checks.map(r => [r.slug, r]));
  const sorted = [...apiPosts].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const L = [];
  L.push('# faircast.kr 슬러그 목록');
  L.push(`> 자동 생성 — ${stamp.date} ${stamp.time} | 총 ${sorted.length}편`);
  L.push('> 수정하지 마세요. site-monitor.js 실행 시 덮어써집니다.');
  L.push('');

  L.push(`## 발행글 (${sorted.length})`);
  L.push('| 발행일 | 슬러그 | 카테고리 | 요약 | 색인가능 |');
  L.push('|---|---|---|---|---|');
  for (const p of sorted) {
    const dateStr = (p.date || '').slice(0, 10) || '-';
    const catIds = Array.isArray(p.categories) ? p.categories : [];
    const catName = catIds.map(id => catLabels[String(id)] || String(id)).join(', ') || '-';
    const check = checksMap.get(p.slug);
    const excerptOk = (p.excerpt && String(p.excerpt).trim()) ? '✅' : '❌';
    const indexable = check ? (check.hasNoindex ? '❌' : '✅') : '-';
    L.push(`| ${dateStr} | ${p.slug} | ${catName} | ${excerptOk} | ${indexable} |`);
  }
  L.push('');

  const keyPages = Object.entries(expected.keyPages || {});
  L.push(`## 정적 페이지 (${keyPages.length})`);
  L.push('| 페이지 | URL | 색인가능 |');
  L.push('|---|---|---|');
  for (const [url, cfg] of keyPages) {
    const pageDetail = detail.keyPages.find(p => p.url === url);
    const indexable = pageDetail ? (pageDetail.indexable ? '✅' : '❌') : '-';
    L.push(`| ${cfg.label} | ${url} | ${indexable} |`);
  }
  L.push('');

  L.push('## URL 목록 (복사용)');
  L.push('');
  for (const p of sorted) L.push(`${SITE}/${p.slug}/`);
  L.push('');

  fs.writeFileSync(SLUGS_PATH, L.join('\n'), 'utf8');
  console.log(`슬러그: ${SLUGS_PATH}`);
}

// ── Report ─────────────────────────────────────────────────────────────────────

function buildReport(stamp, apiConnected) {
  const L = [];
  const checks = postAudit.liveChecks;

  // CRITICAL helpers from post checks
  const postHttpErrors = checks.filter(r => r.error || (r.status !== null && r.status !== 200));
  const postNoindex = checks.filter(r => !r.error && r.status === 200 && r.hasNoindex);
  const postDescMissing = checks.filter(r => !r.error && r.status === 200 && r.descMissing);
  const postCssPolluted = checks.filter(r => !r.error && r.status === 200 && r.descCssPolluted);
  const postCriticalCount = new Set([
    ...postHttpErrors, ...postNoindex, ...postDescMissing, ...postCssPolluted
  ].map(r => r.slug)).size;
  const totalCritical = results.critical.length + postCriticalCount;

  // 경고 helpers
  const excerptMissing = checks.filter(r => !r.error && r.status === 200 && r.excerptEmpty);
  const descLenWarnList = checks.filter(r => !r.error && r.status === 200 && r.descLenWarn);
  const noArticleSchema = checks.filter(r => !r.error && r.status === 200 && !r.hasArticleSchema);
  const noAuthorBio = checks.filter(r => !r.error && r.status === 200 && !r.hasAuthorBio);
  const bodyShortList = checks.filter(r => !r.error && r.status === 200 && r.bodyShort);
  const fewLinksList = checks.filter(r => !r.error && r.status === 200 && r.fewLinks);
  const imgAltList = checks.filter(r => !r.error && r.status === 200 && r.imgAltWarn);
  const canonicalMismatchList = checks.filter(r => !r.error && r.status === 200 && r.canonicalMismatch);

  // Header
  L.push(`# faircast.kr 상태 리포트 — ${stamp.date} ${stamp.time}`);
  L.push('');
  L.push(`> Googlebot UA | 캐시 무력화 | API 연결: ${apiConnected ? '성공' : '실패'}`);
  if (QUICK) L.push('> 모드: `--quick` (인프라만)');
  if (POSTS_ONLY) L.push('> 모드: `--posts` (발행글만)');
  L.push('');

  // 한 줄 요약
  L.push('## 한 줄 요약');
  L.push('');
  if (!QUICK && checks.length > 0) {
    const problemSet = new Set([
      ...postHttpErrors, ...postNoindex, ...postDescMissing, ...postCssPolluted,
      ...excerptMissing, ...descLenWarnList, ...noArticleSchema, ...noAuthorBio,
      ...bodyShortList, ...fewLinksList, ...imgAltList, ...canonicalMismatchList,
    ].map(r => r.slug));
    L.push(`발행글 ${postAudit.apiPostCount}편 중 ${problemSet.size}편에 문제. CRITICAL ${totalCritical}건, 경고 ${results.warning.length + excerptMissing.length}건.`);
  } else {
    L.push(`CRITICAL ${results.critical.length}건, 경고 ${results.warning.length}건.`);
  }
  L.push('');

  // 카운트 (발행글 모드에서만)
  if (!QUICK && checks.length > 0) {
    const liveOk = checks.filter(r => !r.error && r.status === 200).length;
    L.push('## 카운트');
    L.push('');
    L.push('| 항목 | 값 |');
    L.push('|---|---|');
    L.push(`| 발행글 (API) | ${postAudit.apiPostCount} |`);
    L.push(`| 사이트맵 URL | ${postAudit.sitemapCount} |`);
    L.push(`| 라이브 검사 성공 | ${liveOk} |`);
    L.push(`| 200 OK | ${checks.filter(r => r.status === 200).length} |`);
    L.push(`| meta description 정상 | ${checks.filter(r => !r.descMissing && !r.descCssPolluted).length} |`);
    L.push(`| **요약(excerpt) 비어 있음** | **${excerptMissing.length}** |`);
    L.push(`| Article 스키마 있음 | ${checks.filter(r => r.hasArticleSchema).length} |`);
    L.push(`| Author Bio 있음 | ${checks.filter(r => r.hasAuthorBio).length} |`);
    L.push(`| 본문 1500자 이상 | ${checks.filter(r => r.bodyLen >= 1500).length} |`);
    L.push(`| 내부 링크 3개 미만 | ${fewLinksList.length} |`);
    L.push('');
  }

  // 🔴 CRITICAL
  L.push('## 🔴 CRITICAL');
  L.push('');

  if (totalCritical === 0) {
    L.push('_없음_');
    L.push('');
  } else {
    // Infra criticals (one by one)
    for (const c of results.critical) {
      L.push(`### ${c.item}`);
      L.push(`- 대상: ${c.item}`);
      L.push(`- 기대: ${c.expect}`);
      L.push(`- 실제: ${c.actual}`);
      L.push(`- 의미: ${c.why}`);
      L.push('');
    }

    // Post criticals (grouped)
    if (postHttpErrors.length > 0) {
      L.push(`### 발행글 HTTP 오류 — ${postHttpErrors.length}편`);
      for (const r of postHttpErrors) {
        L.push(`- \`${r.slug}\`: ${r.error ? '요청 실패' : `HTTP ${r.status}`}`);
      }
      L.push('');
    }
    if (postNoindex.length > 0) {
      L.push(`### 발행글 noindex — ${postNoindex.length}편`);
      for (const r of postNoindex) L.push(`- \`${r.slug}\``);
      L.push('- 의미: 발행글은 색인되어야 함');
      L.push('');
    }
    if (postCssPolluted.length > 0) {
      L.push(`### meta description CSS 오염 — ${postCssPolluted.length}편`);
      for (const r of postCssPolluted) {
        const tag = r.excerptEmpty ? ' ← excerpt 빈값 (확정 원인)' : '';
        L.push(`- \`${r.slug}\`${tag}`);
      }
      L.push('- 의미: 378 스니펫이 CSS를 걸러내지 못함. excerpt 입력 → 재빌드로 해결.');
      L.push('');
    }
    if (postDescMissing.length > 0) {
      L.push(`### meta description 없음 — ${postDescMissing.length}편`);
      for (const r of postDescMissing) L.push(`- \`${r.slug}\``);
      L.push('');
    }
  }

  // 🟡 경고
  L.push('## 🟡 경고');
  L.push('');

  const hasPostWarnings = excerptMissing.length + descLenWarnList.length + noArticleSchema.length +
    noAuthorBio.length + bodyShortList.length + fewLinksList.length + imgAltList.length + canonicalMismatchList.length > 0;
  const hasInfraWarnings = results.warning.length > 0;

  if (!hasPostWarnings && !hasInfraWarnings) {
    L.push('_없음_');
    L.push('');
  } else {
    // Post warnings (grouped)
    if (excerptMissing.length > 0) {
      const sorted = [...excerptMissing].sort((a, b) => b.date.localeCompare(a.date));
      L.push(`### 요약(excerpt) 누락 — ${sorted.length}편`);
      L.push('```');
      for (const r of sorted) L.push(r.slug);
      L.push('```');
      L.push('→ meta description이 본문에서 자동 생성됨. 378 스니펫이 CSS는 걸러내지만, 요약을 넣는 편이 검색 노출에 유리.');
      L.push('');
    }
    if (descLenWarnList.length > 0) {
      L.push(`### meta description 길이 이상 (50자 미만 또는 300자 초과) — ${descLenWarnList.length}편`);
      for (const r of descLenWarnList) L.push(`- \`${r.slug}\` (${r.metaDesc.length}자)`);
      L.push('');
    }
    if (noArticleSchema.length > 0) {
      L.push(`### Article JSON-LD 없음 — ${noArticleSchema.length}편 (575 스니펫 미작동)`);
      for (const r of noArticleSchema) L.push(`- \`${r.slug}\``);
      L.push('');
    }
    if (noAuthorBio.length > 0) {
      L.push(`### Author Bio 없음 — ${noAuthorBio.length}편 (573 스니펫 미작동)`);
      for (const r of noAuthorBio) L.push(`- \`${r.slug}\``);
      L.push('');
    }
    if (bodyShortList.length > 0) {
      L.push(`### 본문 800자 미만 — ${bodyShortList.length}편`);
      for (const r of bodyShortList) L.push(`- \`${r.slug}\` (${r.bodyLen}자)`);
      L.push('');
    }
    if (fewLinksList.length > 0) {
      L.push(`### 내부 링크 3개 미만 — ${fewLinksList.length}편 (고아 페이지 위험)`);
      for (const r of fewLinksList) L.push(`- \`${r.slug}\` (${r.internalLinks}개)`);
      L.push('');
    }
    if (imgAltList.length > 0) {
      L.push(`### 이미지 alt 누락 2개 이상 — ${imgAltList.length}편`);
      for (const r of imgAltList) L.push(`- \`${r.slug}\` (${r.imgAltMissing}개)`);
      L.push('');
    }
    if (canonicalMismatchList.length > 0) {
      L.push(`### canonical 불일치 — ${canonicalMismatchList.length}편`);
      for (const r of canonicalMismatchList) L.push(`- \`${r.slug}\` → \`${r.canonical}\``);
      L.push('');
    }

    // Infra warnings
    for (const w of results.warning) {
      L.push(`### ${w.item}`);
      L.push(`- 기대: ${w.expect}`);
      L.push(`- 실제: ${w.actual}`);
      L.push(`- 의미: ${w.why}`);
      L.push('');
    }
  }

  // 인프라 상태
  if (!POSTS_ONLY) {
    L.push('## 인프라 상태');
    L.push('');
    const robotsWorldCupBlock = detail.robotsTxt.body.includes('Disallow: /match/') || detail.robotsTxt.body.includes('Disallow: /insights/');
    const adsTxtOk = detail.adsTxt.ok;
    const sitemapCounts = detail.sitemaps.map(s => s.count);
    const legacyOk = detail.legacyRedirects.filter(r => r.verdict === '✅').length;
    const legacyTotal = detail.legacyRedirects.length;
    L.push('| 항목 | 상태 |');
    L.push('|---|---|');
    L.push(`| robots.txt | World Cup 차단 ${robotsWorldCupBlock ? '있음 🔴' : '없음 ✅'} |`);
    L.push(`| ads.txt | ${adsTxtOk ? '정상 ✅' : '이상 🔴'} |`);
    L.push(`| 사이트맵 3개 | ${sitemapCounts.join(' / ') || '-'} |`);
    L.push(`| World Cup 리디렉션 ${legacyTotal}개 | ${legacyOk === legacyTotal ? '전부 301 ✅' : `${legacyOk}/${legacyTotal} 정상 🟡`} |`);
    L.push('');
  }

  // 스니펫 상태
  if (!POSTS_ONLY && detail.snippets.length > 0) {
    if (detail.buildStamp) {
    const b = detail.buildStamp;
    L.push('## 빌드 스탬프 (data.js → 라이브 반영)');
    L.push('');
    L.push('| 항목 | 값 |');
    L.push('|---|---|');
    L.push(`| 판정 | ${b.verdict} |`);
    L.push(`| 로컬 data.js rev | ${b.localRev || '—'} |`);
    L.push(`| 라이브 data-rev | ${b.liveRev || '없음'} |`);
    L.push(`| 라이브 빌드일 | ${b.builtAt || '—'} |`);
    if (b.why) L.push(`| 사유 | ${b.why} |`);
    L.push('');
    if (b.verdict !== '✅') {
      L.push('> 대응: `cd pages/port-guide && node build.js` 실행 후 생성된 `port-guide.html`을');
      L.push('> WordPress 항만 가이드 페이지 코드 편집기에 통째로 붙여넣을 것.');
      L.push('');
    }
  }

  L.push('## 스니펫 상태 (외부 탐지)');
    L.push('');
    if (samplePostUrl) L.push(`> SAMPLE_POST: ${samplePostUrl}`);
    L.push('');
    L.push('| 스니펫 | 기대 | 실제 | 판정 |');
    L.push('|---|---|---|---|');
    for (const r of detail.snippets) L.push(`| ${r.key} | ${r.expect} | ${r.actual} | ${r.verdict} |`);
    L.push('');
  }

  // 수동 확인 필요
  L.push('## 수동 확인 필요');
  L.push('');
  L.push('- Search Console 색인 수 (API 미연동)');
  L.push('- Search Console 클릭·노출');
  L.push('- AdSense 심사 상태');
  L.push('');

  // 전체 발행글 슬러그 목록 (발행일 역순)
  if (!QUICK && checks.length > 0) {
    const sorted = [...checks].sort((a, b) => b.date.localeCompare(a.date));
    L.push('## 전체 발행글 슬러그 목록');
    L.push('');
    L.push(`(발행일 역순, ${sorted.length}편)`);
    L.push('');
    L.push('```');
    for (const r of sorted) L.push(r.slug);
    L.push('```');
    L.push('');
  }

  return L.join('\n');
}

function printConsoleSummary(stamp, apiConnected) {
  const status = results.critical.length > 0 ? '위험' : results.warning.length > 0 ? '주의' : '정상';
  const checks = postAudit.liveChecks;
  console.log('');
  console.log('══════════════════════════════════════════');
  console.log(` faircast.kr 상태 리포트 — ${stamp.date} ${stamp.time}`);
  console.log(` 모드: ${QUICK ? 'quick' : POSTS_ONLY ? 'posts' : 'full'} | UA: Googlebot | API: ${apiConnected ? 'OK' : '실패'}`);
  console.log('══════════════════════════════════════════');
  console.log(` 🔴 인프라 CRITICAL: ${results.critical.length}`);
  console.log(` 🟡 인프라 경고:     ${results.warning.length}`);
  console.log(` ✅ 인프라 정상:     ${results.ok.length}`);
  if (checks.length > 0) {
    const postCrit = checks.filter(r => r.error || r.status !== 200 || r.hasNoindex || r.descMissing || r.descCssPolluted).length;
    const excerptMissing = checks.filter(r => r.excerptEmpty).length;
    console.log(`──────────────────────────────────────────`);
    console.log(` 발행글: ${postAudit.apiPostCount}편 검사 | 🔴 이슈: ${postCrit}편 | excerpt 누락: ${excerptMissing}편`);
  }
  console.log(` 상태: ${status}`);
  console.log('──────────────────────────────────────────');
  if (results.critical.length) {
    console.log(' CRITICAL:');
    for (const c of results.critical.slice(0, 8)) console.log(`  - ${c.item}: ${c.actual}`);
    if (results.critical.length > 8) console.log(`  ... 외 ${results.critical.length - 8}건`);
  }
  if (results.warning.length) {
    console.log(' 경고:');
    for (const w of results.warning.slice(0, 5)) console.log(`  - ${w.item}: ${w.actual}`);
    if (results.warning.length > 5) console.log(`  ... 외 ${results.warning.length - 5}건`);
  }
  console.log('');
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(EXPECTED_PATH)) {
    console.error(`expected-state.json 없음: ${EXPECTED_PATH}`);
    process.exit(1);
  }
  const expected = JSON.parse(fs.readFileSync(EXPECTED_PATH, 'utf8'));
  const stamp = nowStamp();
  const monitorCfg = loadMonitorConfig();

  console.log('faircast.kr 상태 모니터 v2');
  console.log(`사이트: ${expected.site} | 모드: ${QUICK ? '--quick' : POSTS_ONLY ? '--posts' : 'full'}`);
  console.log(`API 설정: ${monitorCfg ? '로드됨' : '없음 (monitor/config.local.json 없음)'}`);

  let apiConnected = false;

  // ── 인프라 검사 ──
  if (!POSTS_ONLY) {
    await resolveSamplePost(expected);
    if (samplePostUrl) console.log(`SAMPLE_POST: ${samplePostUrl}`);

    if (QUICK) {
      console.log('\n[1/4] legacyRedirects...');
      await checkLegacyRedirects(expected);
      console.log('[2/4] robotsTxt...');
      await checkRobotsTxt(expected);
      console.log('[3/4] snippetFootprints...');
      await checkSnippetFootprints(expected);
      console.log('[4/4] buildStamp...');
      await checkBuildStamp(expected);
    } else {
      console.log('\n[1/10] keyPages...');
      await checkKeyPages(expected);
      console.log('[2/10] legacyRedirects...');
      await checkLegacyRedirects(expected);
      console.log('[3/10] categoryRedirects...');
      await checkCategoryRedirects(expected);
      console.log('[4/10] categoryNoindex...');
      await checkCategoryNoindex(expected);
      console.log('[5/10] robotsTxt...');
      await checkRobotsTxt(expected);
      console.log('[6/10] adsTxt...');
      await checkAdsTxt(expected);
      console.log('[7/10] sitemaps...');
      await checkSitemaps(expected);
      console.log('[8/10] snippetFootprints...');
      await checkSnippetFootprints(expected);
      console.log('[9/10] policyRedFlags...');
      await checkPolicyRedFlags(expected);
      console.log('[10/10] buildStamp...');
      await checkBuildStamp(expected);
    }
  }

  // ── 발행글 검사 ──
  if (!QUICK) {
    console.log('\n[POST] fairwayeta API에서 발행글 목록 로딩...');
    const apiPosts = await fetchApiPosts(monitorCfg);

    if (apiPosts) {
      apiConnected = true;
      postAudit.connected = true;
      postAudit.apiPostCount = apiPosts.length;
      postAudit.apiPosts = apiPosts;
      console.log(`  API 응답: ${apiPosts.length}편`);

      const sitemapUrls = await fetchSitemapUrls();
      postAudit.sitemapCount = sitemapUrls.length;

      // Cross-check
      const apiSlugs = new Set(apiPosts.map(p => p.slug));
      const sitemapSlugs = new Set(sitemapUrls.map(u => u.replace(/\/$/, '').split('/').pop()));
      for (const slug of sitemapSlugs) {
        if (!apiSlugs.has(slug)) addWarning('사이트맵/API 불일치', '사이트맵=API', slug, '사이트맵에 있지만 API 목록에 없음');
      }
      for (const slug of apiSlugs) {
        if (!sitemapSlugs.has(slug)) addWarning('사이트맵/API 불일치', 'API=사이트맵', slug, 'API에 있지만 사이트맵에 없음');
      }

      console.log('[POST] 발행글 라이브 검사...');
      postAudit.liveChecks = await runPostAudit(apiPosts);

      const postCrit = postAudit.liveChecks.filter(r => r.error || r.status !== 200 || r.hasNoindex || r.descMissing || r.descCssPolluted).length;
      const excerptMissing = postAudit.liveChecks.filter(r => r.excerptEmpty).length;
      console.log(`  완료 — CRITICAL: ${postCrit}편, excerpt 누락: ${excerptMissing}편`);
    } else {
      console.log('  API 미연결 — 발행글 검사 건너뜀');
      addWarning('API 연결', '성공', '실패', 'monitor/config.local.json 확인 또는 키 미등록');
    }
  }

  // ── 저장 ──
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const reportPath = path.join(REPORTS_DIR, `state-${stamp.ymd}.md`);
  const jsonPath = path.join(REPORTS_DIR, `state-${stamp.ymd}.json`);

  fs.writeFileSync(reportPath, buildReport(stamp, apiConnected), 'utf8');

  fs.writeFileSync(jsonPath, JSON.stringify({
    stamp, mode: QUICK ? 'quick' : POSTS_ONLY ? 'posts' : 'full',
    apiConnected,
    summary: { critical: results.critical.length, warning: results.warning.length, ok: results.ok.length },
    critical: results.critical,
    warning: results.warning,
    postAudit: {
      apiPostCount: postAudit.apiPostCount,
      sitemapCount: postAudit.sitemapCount,
      liveChecks: postAudit.liveChecks,
    },
    detail: {
      keyPages: detail.keyPages,
      legacyRedirects: detail.legacyRedirects,
      categoryRedirects: detail.categoryRedirects,
      categoryNoindex: detail.categoryNoindex,
      sitemaps: detail.sitemaps,
      snippets: detail.snippets,
      policyRedFlags: detail.policyRedFlags,
      robotsTxt: detail.robotsTxt,
      adsTxt: { ok: detail.adsTxt.ok },
    },
  }, null, 2), 'utf8');

  // slugs.md (always overwrite when post data available)
  if (postAudit.liveChecks.length > 0) {
    writeSlugsFile(stamp, postAudit.apiPosts, postAudit.liveChecks, expected);
  }

  printConsoleSummary(stamp, apiConnected);
  console.log(`리포트: ${reportPath}`);
  console.log(`JSON:   ${jsonPath}`);

  // Exit code: CRITICAL if infra criticals OR any post has critical issue
  const postCriticalCount = postAudit.liveChecks.filter(
    r => r.error || r.status !== 200 || r.hasNoindex || r.descMissing || r.descCssPolluted
  ).length;
  process.exit(results.critical.length + postCriticalCount > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('치명적 오류:', e);
  process.exit(1);
});

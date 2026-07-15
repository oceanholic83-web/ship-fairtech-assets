'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const SITE = 'https://faircast.kr';
const GOOGLEBOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const ADSENSE_PUB = 'pub-9894725798878226';
const DELAY_MS = 500;
const MAX_CONCURRENCY = 3;
const MAX_RETRIES = 2;
const TIMEOUT_MS = 15000;

const POLICY_KEYWORDS = {
  adult: ['성인물', '야동', '야설', '19금', 'porn', 'xxx', 'nude', 'naked'],
  violence: ['살인', '폭행', '테러', '폭탄', '칼부림'],
  copyright: ['무단 전재', '무단전재', '무단 복제', '저작권 침해'],
};

const PRIORITY_URLS = [
  `${SITE}/`,
  `${SITE}/about/`,
  `${SITE}/port-guide/`,
  `${SITE}/hello-korea-page/`,
  `${SITE}/hello-world-page/`,
];

const PRIORITY_LABELS = {
  [`${SITE}/`]: '홈 (/)',
  [`${SITE}/about/`]: 'About',
  [`${SITE}/port-guide/`]: 'Port Guide',
  [`${SITE}/hello-korea-page/`]: 'Hello Korea',
  [`${SITE}/hello-world-page/`]: 'Hello World',
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  const start = Date.now();
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': GOOGLEBOT_UA },
      timeout: TIMEOUT_MS,
      maxRedirects: 10,
      validateStatus: () => true,
    });
    return { res, elapsed: Date.now() - start, error: null };
  } catch (e) {
    if (retries > 0) {
      await sleep(1000);
      return fetchWithRetry(url, retries - 1);
    }
    return { res: null, elapsed: Date.now() - start, error: e.message };
  }
}

async function parseSitemap(url) {
  const { res } = await fetchWithRetry(url);
  if (!res || res.status !== 200) return [];
  try {
    const parsed = await xml2js.parseStringPromise(res.data);
    if (parsed.sitemapindex && parsed.sitemapindex.sitemap) {
      const subs = parsed.sitemapindex.sitemap.map(s => s.loc[0]);
      const nested = await Promise.all(subs.map(u => parseSitemap(u)));
      return nested.flat();
    }
    if (parsed.urlset && parsed.urlset.url) {
      return parsed.urlset.url.map(u => u.loc[0]);
    }
  } catch (_) {}
  return [];
}

function auditHead($) {
  const issues = [];
  const warnings = [];
  const info = {};

  const title = $('title').first().text().trim();
  info.title = title || null;
  if (!title) issues.push('title 태그 없음');
  else if (title.length < 10) warnings.push(`title 너무 짧음 (${title.length}자)`);
  else if (title.length > 70) warnings.push(`title 너무 김 (${title.length}자)`);

  const desc = $('meta[name="description"]').attr('content') || '';
  info.metaDescription = desc || null;
  if (!desc) {
    issues.push('meta description 없음');
  } else {
    if (desc.length < 50) warnings.push(`meta description 너무 짧음 (${desc.length}자)`);
    else if (desc.length > 160) warnings.push(`meta description 너무 김 (${desc.length}자)`);
    if (/[{}]|!important|color\s*:/i.test(desc)) {
      issues.push(`meta description CSS 코드 오염: "${desc.substring(0, 80)}"`);
    }
  }

  const canonical = $('link[rel="canonical"]').attr('href') || null;
  info.canonical = canonical;
  if (!canonical) warnings.push('canonical 링크 없음');

  const robotsMeta = $('meta[name="robots"]').attr('content') || '';
  info.robotsMeta = robotsMeta || null;
  if (/noindex/i.test(robotsMeta)) issues.push(`noindex 설정됨: "${robotsMeta}"`);

  const lang = $('html').attr('lang') || '';
  info.lang = lang || null;
  if (!lang) warnings.push('html lang 속성 없음');
  else if (!/^(ko|ko-KR|en|en-US)/i.test(lang)) warnings.push(`비표준 lang: "${lang}"`);

  return { issues, warnings, info };
}

function auditBody($, url) {
  const issues = [];
  const warnings = [];
  const info = {};

  $('script, style, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  info.bodyTextLength = bodyText.length;
  if (bodyText.length < 300) issues.push(`얇은 콘텐츠 (본문 ${bodyText.length}자)`);

  const allImgs = $('img');
  let missingAlt = 0;
  allImgs.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined || alt === null) missingAlt++;
  });
  info.imagesMissingAlt = missingAlt;
  if (missingAlt > 0) warnings.push(`이미지 alt 누락 ${missingAlt}개`);

  const internalLinks = $('a[href]').filter((_, el) => {
    const href = $(el).attr('href') || '';
    return href.startsWith('/') || href.startsWith(SITE);
  }).length;
  info.internalLinks = internalLinks;
  if (internalLinks < 3) warnings.push(`고립 페이지 (내부 링크 ${internalLinks}개)`);

  const externalLinks = $('a[href]').filter((_, el) => {
    const href = $(el).attr('href') || '';
    return href.startsWith('http') && !href.startsWith(SITE);
  }).length;
  info.externalLinks = externalLinks;

  const policyDetected = {};
  for (const [cat, keywords] of Object.entries(POLICY_KEYWORDS)) {
    const found = keywords.filter(kw => bodyText.includes(kw));
    if (found.length > 0) {
      policyDetected[cat] = found;
      issues.push(`정책 위반 키워드(${cat}): ${found.join(', ')}`);
    }
  }
  info.policyKeywordsDetected = policyDetected;

  // Re-load html for adsense check (body text had scripts removed)
  return { issues, warnings, info };
}

function auditSchema($) {
  const warnings = [];
  const info = {};

  const scripts = $('script[type="application/ld+json"]');
  if (scripts.length === 0) {
    warnings.push('JSON-LD 구조화 데이터 없음');
    info.schemaTypes = [];
    return { issues: [], warnings, info };
  }

  const schemas = [];
  scripts.each((_, el) => {
    try {
      const json = JSON.parse($(el).html());
      const arr = Array.isArray(json) ? json : [json];
      schemas.push(...arr);
    } catch (_) {}
  });

  const types = schemas.map(s => s['@type']).filter(Boolean);
  info.schemaTypes = types;

  const articleTypes = ['Article', 'NewsArticle', 'BlogPosting'];
  const hasArticle = types.some(t => articleTypes.includes(t));
  const hasAuthor = schemas.some(s => s.author);
  info.hasAuthor = hasAuthor;
  if (hasArticle && !hasAuthor) warnings.push('Article schema에 author 필드 없음');

  info.hasDatePublished = schemas.some(s => s.datePublished);
  info.hasDateModified = schemas.some(s => s.dateModified);
  if (hasArticle && !info.hasDatePublished) warnings.push('Article schema에 datePublished 없음');
  if (hasArticle && !info.hasDateModified) warnings.push('Article schema에 dateModified 없음');

  return { issues: [], warnings, info };
}

async function auditUrl(url) {
  const result = { url, issues: [], warnings: [], info: {} };
  const { res, elapsed, error } = await fetchWithRetry(url);

  result.info.elapsed = elapsed;

  if (error) {
    result.issues.push(`요청 실패: ${error}`);
    result.info.status = null;
    return result;
  }

  result.info.status = res.status;

  if (res.status !== 200) {
    result.issues.push(`HTTP ${res.status}`);
    return result;
  }

  if (elapsed > 5000) {
    result.warnings.push(`응답 시간 ${elapsed}ms (5초 초과)`);
  }

  const html = res.data;
  const $ = cheerio.load(html);

  const headResult = auditHead($);
  const bodyResult = auditBody($, url);
  const schemaResult = auditSchema($);

  result.issues.push(...headResult.issues, ...bodyResult.issues, ...schemaResult.issues);
  result.warnings.push(...headResult.warnings, ...bodyResult.warnings, ...schemaResult.warnings);
  result.info = { ...result.info, ...headResult.info, ...bodyResult.info, ...schemaResult.info };

  // AdSense code check on raw html
  result.info.adsenseCodePresent = html.includes(ADSENSE_PUB);

  // Policy/privacy links check for priority pages
  if (PRIORITY_URLS.includes(url)) {
    const allLinks = $('a[href]').map((_, el) => $(el).attr('href')).get();
    result.info.hasPrivacyLink = allLinks.some(h => /privacy|개인정보/i.test(h));
    result.info.hasTermsLink = allLinks.some(h => /terms|이용약관/i.test(h));
    if (!result.info.hasPrivacyLink) result.warnings.push('privacy 페이지 링크 없음');
    if (!result.info.hasTermsLink) result.warnings.push('terms 페이지 링크 없음');
  }

  return result;
}

async function runInBatches(items, fn, batchSize) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(fn));
    results.push(...batchResults);
    if (i + batchSize < items.length) await sleep(DELAY_MS);
    process.stdout.write(`\r  진행: ${Math.min(i + batchSize, items.length)}/${items.length}   `);
  }
  console.log();
  return results;
}

function formatPriorityPage(r) {
  const label = PRIORITY_LABELS[r.url] || r.url;
  const i = r.info;
  const allIssues = [...(r.issues || [])];
  const allWarnings = [...(r.warnings || [])];
  return `### ${label}
- HTTP 상태: ${i.status || 'N/A'}
- 응답 시간: ${i.elapsed != null ? i.elapsed + 'ms' : 'N/A'}
- Title: "${i.title || '없음'}"
- Meta description: "${i.metaDescription ? i.metaDescription.substring(0, 100) : '없음'}"
- Canonical: ${i.canonical || '없음'}
- Lang: ${i.lang || '없음'}
- 본문 문자 수: ${i.bodyTextLength != null ? i.bodyTextLength + '자' : 'N/A'}
- Schema.org: ${i.schemaTypes && i.schemaTypes.length ? i.schemaTypes.join(', ') : '없음'}
- Author 필드: ${i.hasAuthor === true ? 'O' : i.hasAuthor === false ? 'X' : 'N/A'}
- 내부 링크: ${i.internalLinks != null ? i.internalLinks + '개' : 'N/A'}
- 외부 링크: ${i.externalLinks != null ? i.externalLinks + '개' : 'N/A'}
- 이미지 alt 누락: ${i.imagesMissingAlt != null ? i.imagesMissingAlt + '개' : 'N/A'}
- AdSense 코드: ${i.adsenseCodePresent ? 'O' : 'X'}
- Privacy 링크: ${i.hasPrivacyLink === true ? 'O' : i.hasPrivacyLink === false ? 'X' : '미확인'}
- Terms 링크: ${i.hasTermsLink === true ? 'O' : i.hasTermsLink === false ? 'X' : '미확인'}
- 🔴 심각: ${allIssues.length === 0 ? '없음' : '\n  - ' + allIssues.join('\n  - ')}
- 🟡 경고: ${allWarnings.length === 0 ? '없음' : '\n  - ' + allWarnings.join('\n  - ')}
`;
}

async function main() {
  console.log('=== AdSense Bot Perspective Audit ===');
  console.log(`대상: ${SITE}`);
  console.log(`시작: ${new Date().toISOString()}`);
  console.log();

  console.log('[Step 1] 사이트맵에서 URL 수집...');
  const sitemapUrls = await parseSitemap(`${SITE}/wp-sitemap.xml`);
  console.log(`  사이트맵 URL: ${sitemapUrls.length}개`);

  const allUrls = [...new Set([...PRIORITY_URLS, ...sitemapUrls])];
  console.log(`  감사 대상 URL 총: ${allUrls.length}개`);
  console.log();

  console.log('[Step 2] 전체 URL 감사 중...');
  const auditResults = await runInBatches(allUrls, auditUrl, MAX_CONCURRENCY);
  console.log();

  console.log('[Step 3] robots.txt / ads.txt 확인...');
  const { res: robotsRes } = await fetchWithRetry(`${SITE}/robots.txt`);
  const robotsTxt = robotsRes && robotsRes.status === 200 ? robotsRes.data : null;

  const { res: adsRes } = await fetchWithRetry(`${SITE}/ads.txt`);
  const adsTxt = adsRes && adsRes.status === 200 ? adsRes.data : null;
  const adsenseLineCorrect = adsTxt
    ? adsTxt.includes(`google.com, ${ADSENSE_PUB}, DIRECT, f08c47fec0942fa0`)
    : false;

  console.log(`  robots.txt: HTTP ${robotsRes ? robotsRes.status : 'N/A'}`);
  console.log(`  ads.txt: HTTP ${adsRes ? adsRes.status : 'N/A'} | AdSense 라인: ${adsenseLineCorrect ? 'O' : 'X'}`);
  console.log();

  const ok200 = auditResults.filter(r => r.info.status === 200);
  const stats = {
    total: auditResults.length,
    ok200: ok200.length,
    errors4xx5xx: auditResults.filter(r => r.info.status >= 400).length,
    redirects: auditResults.filter(r => r.info.status >= 300 && r.info.status < 400).length,
    noMetaDesc: ok200.filter(r => !r.info.metaDescription).length,
    cssPolluted: auditResults.filter(r => r.issues.some(i => i.includes('CSS 코드 오염'))).length,
    thinContent: auditResults.filter(r => r.issues.some(i => i.includes('얇은 콘텐츠'))).length,
    isolatedPages: auditResults.filter(r => r.warnings.some(w => w.includes('고립 페이지'))).length,
    noSchema: ok200.filter(r => r.info.schemaTypes && r.info.schemaTypes.length === 0).length,
    noAuthor: ok200.filter(r => r.info.hasAuthor === false).length,
  };

  const critical = auditResults.filter(r => r.issues.length > 0);
  const warningOnly = auditResults.filter(r => r.issues.length === 0 && r.warnings.length > 0);
  const okItems = auditResults.filter(r => r.issues.length === 0 && r.warnings.length === 0);

  const adsenseScore = (() => {
    if (stats.cssPolluted > 0 || stats.errors4xx5xx > 5) return '하';
    if (stats.noMetaDesc > 10 || stats.thinContent > 15) return '중';
    return '상';
  })();

  const priorityDetails = PRIORITY_URLS.map(u =>
    auditResults.find(r => r.url === u) || { url: u, issues: ['감사 데이터 없음'], warnings: [], info: {} }
  );

  const mdReport = `# Bot Perspective Audit Report — 2026-07-15

> 감사 기준: Googlebot UA | 사이트: ${SITE} | 생성: ${new Date().toISOString()}

## 요약

| 항목 | 수치 |
|------|------|
| 감사 대상 URL 총 수 | ${stats.total} |
| 200 OK | ${stats.ok200} |
| 4xx/5xx 오류 | ${stats.errors4xx5xx} |
| 리디렉션 | ${stats.redirects} |
| Meta description 없음 | ${stats.noMetaDesc} |
| Meta description CSS 오염 | ${stats.cssPolluted} |
| 얇은 콘텐츠 (본문 300자 미만) | ${stats.thinContent} |
| 고립 페이지 (내부 링크 3개 미만) | ${stats.isolatedPages} |
| Schema.org 없음 | ${stats.noSchema} |
| Author 없음 | ${stats.noAuthor} |

---

## 심각도별 문제 목록

### 🔴 심각 (즉시 수정) — ${critical.length}건

${critical.length === 0 ? '없음' : critical.map(r =>
  `**${r.url}**\n` + r.issues.map(i => `  - ${i}`).join('\n')
).join('\n\n')}

### 🟡 경고 (검토 필요) — ${warningOnly.length}건

${warningOnly.length === 0 ? '없음' : warningOnly.map(r =>
  `**${r.url}**\n` + r.warnings.map(w => `  - ${w}`).join('\n')
).join('\n\n')}

### 🟢 정상 — ${okItems.length}건

${okItems.map(r => `- ${r.url}`).join('\n') || '없음'}

---

## 5개 핵심 페이지 상세

${priorityDetails.map(formatPriorityPage).join('\n')}

---

## 정책 관점 검증

- 정책 위반 키워드 감지 페이지: ${auditResults.filter(r => Object.keys(r.info.policyKeywordsDetected || {}).length > 0).length}건
- 성인 콘텐츠: ${auditResults.some(r => r.issues.some(i => i.includes('adult'))) ? '⚠️ 감지됨' : '없음'}
- 폭력 콘텐츠: ${auditResults.some(r => r.issues.some(i => i.includes('violence'))) ? '⚠️ 감지됨' : '없음'}
- 저작권 위반 표현: ${auditResults.some(r => r.issues.some(i => i.includes('copyright'))) ? '⚠️ 감지됨' : '없음'}
- AI 자동 생성 의심: 수동 확인 필요

---

## robots.txt 상태

\`\`\`
${robotsTxt || '접근 불가 (HTTP ' + (robotsRes ? robotsRes.status : 'N/A') + ')'}
\`\`\`

---

## ads.txt 상태

- 존재: ${adsTxt ? 'O' : 'X'}
- Google AdSense 라인 정확 여부: ${adsenseLineCorrect ? 'O ✅' : 'X ❌'}

${adsTxt ? '```\n' + adsTxt.substring(0, 500) + (adsTxt.length > 500 ? '\n...(생략)' : '') + '\n```' : ''}

---

## 종합 판정

### AdSense 승인 가능성: **${adsenseScore}**

#### 즉시 조치 필요
${critical.length > 0
  ? critical.slice(0, 15).map(r => `- ${r.url}\n  → ${r.issues[0]}`).join('\n')
  : '- 없음'}

#### 개선 권장
${warningOnly.length > 0
  ? warningOnly.slice(0, 15).map(r => `- ${r.url}\n  → ${r.warnings[0]}`).join('\n')
  : '- 없음'}

---

*User-Agent: ${GOOGLEBOT_UA}*
`;

  console.log('[Step 4] 리포트 저장...');
  const outDir = path.resolve('docs/adsense-approval');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const mdPath = path.join(outDir, 'bot-audit-260715.md');
  const jsonPath = path.join(outDir, 'bot-audit-260715.json');

  fs.writeFileSync(mdPath, mdReport, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify({
    meta: {
      generatedAt: new Date().toISOString(),
      site: SITE,
      userAgent: GOOGLEBOT_UA,
      totalUrls: allUrls.length,
    },
    stats,
    robotsTxt,
    adsTxt,
    adsenseLineCorrect,
    results: auditResults,
  }, null, 2), 'utf8');

  console.log(`  MD: ${mdPath}`);
  console.log(`  JSON: ${jsonPath}`);
  console.log();
  console.log('=== 완료 ===');
  console.log(`총 URL: ${stats.total} | 심각: ${critical.length} | 경고: ${warningOnly.length} | 정상: ${okItems.length}`);
  console.log(`AdSense 승인 가능성: ${adsenseScore}`);
}

main().catch(e => {
  console.error('오류:', e.message);
  process.exit(1);
});

'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const SITE = 'https://faircast.kr';
const FAIRWAYETA = 'https://www.fairwayeta.com';
const GOOGLEBOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const ADSENSE_PUB = 'pub-9894725798878226';
const DELAY_MS = 500;
const MAX_CONCURRENCY = 3;
const MAX_RETRIES = 2;
const TIMEOUT_MS = 15000;
const FAIRWAYETA_DELAY_MS = 1000;

// Step 2-1: 번역체 트리거 목록
const TRANSLATION_TRIGGERS = [
  '에 의해',
  '을 위해서',
  '에도 불구하고',
  '라는 사실',
  '함에 있어',
  '진짜로',
  '이론적이지 않',
  '지문을 안고',
  '지문을 남긴',
];

// Step 3-1: 한국 특화 anchor 키워드
const KOREA_ANCHOR_KEYWORDS = [
  '한국선급', 'KS B 1002', '힘센 엔진', '현대중공업', 'HD현대',
  '삼성중공업', '대우조선', '한화오션', '부산항', '인천항',
  '울산항', '목포항', '여수항', '선박안전법', '해양수산부',
  '한국해양', 'KR 선급', 'Korean Register',
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchWithRetry(url, retries = MAX_RETRIES, ua = GOOGLEBOT_UA) {
  const start = Date.now();
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': ua },
      timeout: TIMEOUT_MS,
      maxRedirects: 10,
      validateStatus: () => true,
    });
    return { res, elapsed: Date.now() - start, error: null };
  } catch (e) {
    if (retries > 0) {
      await sleep(1000);
      return fetchWithRetry(url, retries - 1, ua);
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

// Step 1: 기존 감사 항목
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

function auditBodyBasic($) {
  const issues = [];
  const warnings = [];
  const info = {};

  $('script, style, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  info.bodyTextLength = bodyText.length;
  info.bodyText = bodyText;

  if (bodyText.length < 300) {
    issues.push(`얇은 콘텐츠 — 300자 미만 (${bodyText.length}자)`);
  } else if (bodyText.length < 800) {
    warnings.push(`얇은 콘텐츠 경고 — 300-800자 (${bodyText.length}자)`);
    info.contentTier = '🟡 300-800자';
  } else if (bodyText.length < 1500) {
    info.contentTier = '🟢 800-1500자';
  } else {
    info.contentTier = '✅ 1500자 이상';
  }

  const allImgs = $('img');
  let missingAlt = 0;
  allImgs.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined || alt === null) missingAlt++;
  });
  info.imgCount = allImgs.length;
  info.imagesMissingAlt = missingAlt;
  if (allImgs.length >= 3 && missingAlt >= 2) {
    warnings.push(`이미지 alt 누락 과다: 이미지 ${allImgs.length}개 중 alt 누락 ${missingAlt}개`);
  }

  const internalLinks = $('a[href]').filter((_, el) => {
    const href = $(el).attr('href') || '';
    return href.startsWith('/') || href.startsWith(SITE);
  }).length;
  info.internalLinks = internalLinks;
  if (internalLinks < 3) warnings.push(`고립 페이지 (내부 링크 ${internalLinks}개)`);

  const externalLinkEls = $('a[href]').filter((_, el) => {
    const href = $(el).attr('href') || '';
    return href.startsWith('http') && !href.startsWith(SITE);
  });
  info.externalLinks = externalLinkEls.length;
  const extDomains = new Set();
  externalLinkEls.each((_, el) => {
    try {
      extDomains.add(new URL($(el).attr('href')).hostname);
    } catch (_) {}
  });
  info.externalLinkDomains = extDomains.size;

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

  // author name check
  const authorObj = schemas.find(s => s.author);
  if (authorObj && authorObj.author) {
    const authorName = typeof authorObj.author === 'string'
      ? authorObj.author
      : (authorObj.author.name || '');
    info.authorName = authorName;
  }

  return { issues: [], warnings, info };
}

// Step 2: 콘텐츠 품질 감사
function auditContentQuality(bodyText) {
  const issues = [];
  const warnings = [];
  const info = {};

  // 2-1: 번역체 트리거
  const triggerCounts = {};
  let totalTriggers = 0;
  for (const trigger of TRANSLATION_TRIGGERS) {
    let count = 0;
    let idx = 0;
    while ((idx = bodyText.indexOf(trigger, idx)) !== -1) {
      count++;
      idx += trigger.length;
    }
    if (count > 0) {
      triggerCounts[trigger] = count;
      totalTriggers += count;
    }
  }
  info.translationTriggers = triggerCounts;
  info.totalTranslationTriggers = totalTriggers;
  const charCount = bodyText.length || 1;
  info.translationTriggerDensity = ((totalTriggers / charCount) * 1000).toFixed(2);
  if (totalTriggers >= 3) {
    warnings.push(`번역체 트리거 ${totalTriggers}개 검출 (밀도: ${info.translationTriggerDensity}/1000자)`);
  }

  // 2-2: 중첩 명사구 (X의 Y의 Z)
  const tripleNounMatches = bodyText.match(/[가-힣]+의\s+[가-힣]+의\s+[가-힣]+/g) || [];
  info.tripleNounPhrases = tripleNounMatches.length;
  info.tripleNounExamples = tripleNounMatches.slice(0, 3);
  if (tripleNounMatches.length >= 3) {
    warnings.push(`3중 명사구 ${tripleNounMatches.length}개 검출 (of 구조 직역 의심)`);
  }

  // 2-3: 청유형 남용
  const jeongyuMatches = bodyText.match(/봅시다|보겠습니다|해봅시다/g) || [];
  info.jeongyuCount = jeongyuMatches.length;
  if (jeongyuMatches.length >= 3) {
    warnings.push(`청유형 표현 ${jeongyuMatches.length}회 검출 (AI 청유형 패턴)`);
  }

  // 2-4: 문장 시작 패턴 편향
  const sentences = bodyText.split(/(?<=[.!?。])\s+/);
  const pronounStarts = ['이 ', '그 ', '이것', '그것'];
  let pronounCount = 0;
  for (const s of sentences) {
    if (pronounStarts.some(p => s.startsWith(p))) pronounCount++;
  }
  const sentenceCount = sentences.length || 1;
  info.pronounStartRatio = ((pronounCount / sentenceCount) * 100).toFixed(1);
  info.pronounStartCount = pronounCount;
  info.sentenceCount = sentenceCount;
  if (pronounCount / sentenceCount >= 0.30) {
    warnings.push(`이·그 문장 시작 비율 ${info.pronounStartRatio}% (30% 초과 — 영어 it/this 직역 패턴)`);
  }

  // 2-5: 폐쇄형 종결 연속 (습니다 5문장 이상 연속)
  const sentenceList = bodyText.split(/[.!?。\n]+/).map(s => s.trim()).filter(Boolean);
  let consecutiveCount = 0;
  let consecutiveRuns = 0;
  for (const s of sentenceList) {
    if (s.endsWith('습니다') || s.endsWith('습니다.')) {
      consecutiveCount++;
      if (consecutiveCount >= 5) {
        if (consecutiveCount === 5) consecutiveRuns++;
      }
    } else {
      consecutiveCount = 0;
    }
  }
  info.hamnidaRunsGte5 = consecutiveRuns;
  if (consecutiveRuns >= 2) {
    warnings.push(`"습니다" 종결 5문장 이상 연속 구간 ${consecutiveRuns}회 (문장 형태 다양성 부족)`);
  }

  return { issues, warnings, info };
}

// Step 3-2: Jaccard 유사도
function jaccardSimilarity(textA, textB) {
  const tokenize = t => new Set(t.replace(/\s+/g, ' ').split(' ').filter(Boolean));
  const a = tokenize(textA);
  const b = tokenize(textB);
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function extractFirst3Paragraphs($) {
  $('script, style, noscript').remove();
  const paras = [];
  $('p').each((_, el) => {
    if (paras.length < 3) {
      const text = $(el).text().trim();
      if (text.length > 20) paras.push(text);
    }
  });
  return paras.join(' ');
}

// Step 4: E-E-A-T 산출
function computeEEAT($, schemaInfo, bodyInfo) {
  let score = 0;
  const breakdown = {};

  // 저자 표시
  const hasAuthor = schemaInfo.hasAuthor || false;
  breakdown.author = hasAuthor;
  if (hasAuthor) score++;

  // 출처 명시
  const bodyText = bodyInfo.bodyText || '';
  const hasSource = /출처[:\s]|참고[:\s]|source[:\s]/i.test(bodyText);
  breakdown.source = hasSource;
  if (hasSource) score++;

  // 발행일
  const hasDatePublished = schemaInfo.hasDatePublished || false;
  breakdown.datePublished = hasDatePublished;
  if (hasDatePublished) score++;

  // 최종 수정일
  const hasDateModified = schemaInfo.hasDateModified || false;
  breakdown.dateModified = hasDateModified;
  if (hasDateModified) score++;

  // 내부 링크 참조 (3개 이상)
  const hasInternalRef = (bodyInfo.internalLinks || 0) >= 3;
  breakdown.internalLinks = hasInternalRef;
  if (hasInternalRef) score++;

  // 외부 링크 다양성 (1개 이상 외부 도메인)
  const hasExternalLinks = (bodyInfo.externalLinkDomains || 0) >= 1;
  breakdown.externalLinks = hasExternalLinks;
  if (hasExternalLinks) score++;

  return { score, breakdown };
}

// Step 4-1/4-2: 사이트 신원 감사 (About/Contact/Privacy 페이지)
async function auditIdentityPages() {
  const result = { info: {}, warnings: [], issues: [] };

  // About 페이지
  const aboutUrl = `${SITE}/about/`;
  const { res: aboutRes } = await fetchWithRetry(aboutUrl);
  if (aboutRes && aboutRes.status === 200) {
    const $ = cheerio.load(aboutRes.data);
    $('script, style, noscript').remove();
    const text = $('body').text();
    result.info.aboutStatus = 200;
    result.info.aboutHasFairtech = /fairtech|페어텍/i.test(text);
    result.info.aboutHasEditPolicy = /편집\s*(원칙|방침|기준)/i.test(text);
    result.info.aboutHasContact = /hello@fairtech\.kr/i.test(text);
    result.info.aboutHasPurpose = /매체|목적|범위|소개/i.test(text);
    if (!result.info.aboutHasFairtech) result.warnings.push('About: Fairtech 브랜드 명시 없음');
    if (!result.info.aboutHasEditPolicy) result.warnings.push('About: 편집 원칙 명시 없음');
    if (!result.info.aboutHasContact) result.warnings.push('About: 연락처(hello@fairtech.kr) 명시 없음');
  } else {
    result.issues.push(`About 페이지 접근 불가: HTTP ${aboutRes ? aboutRes.status : 'N/A'}`);
  }

  // Contact 페이지
  const contactUrl = `${SITE}/contact/`;
  const { res: contactRes } = await fetchWithRetry(contactUrl);
  if (contactRes && contactRes.status === 200) {
    const $ = cheerio.load(contactRes.data);
    $('script, style, noscript').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    result.info.contactStatus = 200;
    result.info.contactLength = text.length;
    if (text.length < 500) result.warnings.push(`Contact 페이지 내용 부족 (${text.length}자)`);
  } else {
    result.warnings.push(`Contact 페이지 없거나 오류: HTTP ${contactRes ? contactRes.status : 'N/A'}`);
  }

  // Privacy 페이지
  const privacyUrl = `${SITE}/privacy-policy/`;
  const { res: privacyRes } = await fetchWithRetry(privacyUrl);
  if (privacyRes && privacyRes.status === 200) {
    const $ = cheerio.load(privacyRes.data);
    $('script, style, noscript').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    result.info.privacyStatus = 200;
    result.info.privacyLength = text.length;
    result.info.privacyHasAdsense = /adsense|애드센스/i.test(text);
    result.info.privacyHasGA = /google analytics|구글 애널리틱스/i.test(text);
    result.info.privacyHasCloudinary = /cloudinary/i.test(text);
    if (text.length < 500) result.warnings.push(`Privacy 페이지 내용 부족 (${text.length}자)`);
    if (!result.info.privacyHasAdsense) result.warnings.push('Privacy: AdSense 명시 없음');
    if (!result.info.privacyHasGA) result.warnings.push('Privacy: Google Analytics 명시 없음');
  } else {
    result.warnings.push(`Privacy 페이지 없거나 오류: HTTP ${privacyRes ? privacyRes.status : 'N/A'}`);
  }

  // Terms 페이지
  const termsUrl = `${SITE}/terms/`;
  const { res: termsRes } = await fetchWithRetry(termsUrl);
  if (termsRes && termsRes.status === 200) {
    const $ = cheerio.load(termsRes.data);
    $('script, style, noscript').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    result.info.termsStatus = 200;
    result.info.termsLength = text.length;
    if (text.length < 500) result.warnings.push(`Terms 페이지 내용 부족 (${text.length}자)`);
  } else {
    result.warnings.push(`Terms 페이지 없거나 오류: HTTP ${termsRes ? termsRes.status : 'N/A'}`);
  }

  return result;
}

// Step 5-1: Doorway page 감지 (title 유사도)
function detectDoorwayPages(auditResults) {
  const warnings = [];
  const titleMap = {};
  for (const r of auditResults) {
    if (!r.info.title) continue;
    // title 앞 10자를 키로 그룹핑
    const key = r.info.title.substring(0, 10);
    if (!titleMap[key]) titleMap[key] = [];
    titleMap[key].push(r.url);
  }
  for (const [key, urls] of Object.entries(titleMap)) {
    if (urls.length >= 3) {
      warnings.push(`Doorway page 의심: title 시작 "${key}" — ${urls.length}개 페이지`);
    }
  }
  return warnings;
}

// Step 3-1: fairwayeta 크로스 사이트 매칭
async function auditFairwayetaMatch(faircastUrl, fairwayetaUrls) {
  const result = { matched: null, info: {} };

  // slug 매칭 시도
  let faircastSlug = '';
  try {
    const u = new URL(faircastUrl);
    faircastSlug = u.pathname.replace(/\//g, '').toLowerCase();
  } catch (_) {
    return result;
  }

  // 가장 유사한 fairwayeta URL 찾기
  let bestScore = 0;
  let bestUrl = null;
  for (const fUrl of fairwayetaUrls) {
    let fSlug = '';
    try {
      fSlug = new URL(fUrl).pathname.replace(/\//g, '').toLowerCase();
    } catch (_) {
      continue;
    }
    // 공통 단어 비율
    const fcWords = new Set(faircastSlug.split('-').filter(Boolean));
    const fwWords = new Set(fSlug.split('-').filter(Boolean));
    if (fcWords.size === 0 || fwWords.size === 0) continue;
    const inter = new Set([...fcWords].filter(x => fwWords.has(x)));
    const union = new Set([...fcWords, ...fwWords]);
    const score = inter.size / union.size;
    if (score > bestScore) {
      bestScore = score;
      bestUrl = fUrl;
    }
  }

  if (!bestUrl || bestScore < 0.2) {
    result.info.matchScore = bestScore;
    result.info.note = '매칭 후보 없음 (유사도 0.2 미만)';
    return result;
  }

  result.matched = bestUrl;
  result.info.matchScore = bestScore.toFixed(2);

  // 원문 fetch
  await sleep(FAIRWAYETA_DELAY_MS);
  const { res: fwRes } = await fetchWithRetry(bestUrl);
  if (!fwRes || fwRes.status !== 200) {
    result.info.fetchError = `HTTP ${fwRes ? fwRes.status : 'N/A'}`;
    return result;
  }

  const $fw = cheerio.load(fwRes.data);
  $fw('script, style, noscript').remove();
  const fwText = $fw('body').text().replace(/\s+/g, ' ').trim();
  const fwWords = fwText.split(/\s+/).filter(Boolean).length;
  result.info.fairwayetaWordCount = fwWords;

  // faircast 본문
  const { res: fcRes } = await fetchWithRetry(faircastUrl);
  let fcCharCount = 0;
  let fcText = '';
  let koreaAnchorCount = 0;
  let fwH2Count = 0;
  let fcH2Count = 0;

  if (fcRes && fcRes.status === 200) {
    const $fc = cheerio.load(fcRes.data);
    $fc('script, style, noscript').remove();
    fcText = $fc('body').text().replace(/\s+/g, ' ').trim();
    fcCharCount = fcText.length;

    // 한국 특화 anchor
    for (const kw of KOREA_ANCHOR_KEYWORDS) {
      if (fcText.includes(kw)) koreaAnchorCount++;
    }

    // H2 개수
    fcH2Count = $fc('h2').length;
    fwH2Count = $fw('h2').length;
  }

  result.info.faircastCharCount = fcCharCount;
  result.info.lengthRatio = fwWords > 0
    ? (fcCharCount / (fwWords * 5)).toFixed(2)  // 영어 단어당 평균 5자로 환산
    : 'N/A';
  result.info.koreaAnchorCount = koreaAnchorCount;
  result.info.fcH2Count = fcH2Count;
  result.info.fwH2Count = fwH2Count;

  // 판정
  const ratio = parseFloat(result.info.lengthRatio);
  if (koreaAnchorCount >= 3 && ratio >= 0.8) {
    result.info.verdict = '✅ 정상 (한국 특화 anchor 3개 이상 + 본문 80% 이상)';
  } else if (koreaAnchorCount < 3 && ratio < 0.8) {
    result.info.verdict = '🔴 심각 (한국 특화 anchor 부족 + 본문 짧음 — Replicated content 위험)';
  } else if (koreaAnchorCount < 3) {
    result.info.verdict = '🟡 경고 (한국 특화 anchor 부족 — anchor 보강 필요)';
  } else {
    result.info.verdict = '🟡 경고 (본문 비율 80% 미만 — 내용 보강 필요)';
  }

  return result;
}

// 메인 URL 감사 (Step 1 + Step 2 + E-E-A-T)
async function auditUrl(url) {
  const result = {
    url,
    issues: [],
    warnings: [],
    info: {},
    contentQuality: {},
    eeat: {},
    first3Paragraphs: '',
  };

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
  const bodyResult = auditBodyBasic($);
  const schemaResult = auditSchema($);

  result.issues.push(...headResult.issues, ...bodyResult.issues, ...schemaResult.issues);
  result.warnings.push(...headResult.warnings, ...bodyResult.warnings, ...schemaResult.warnings);
  result.info = { ...result.info, ...headResult.info, ...bodyResult.info, ...schemaResult.info };

  result.info.adsenseCodePresent = html.includes(ADSENSE_PUB);

  // Step 2: 콘텐츠 품질 (발행글만 — 본문 300자 이상)
  const bodyText = bodyResult.info.bodyText || '';
  if (bodyText.length >= 100) {
    const cqResult = auditContentQuality(bodyText);
    result.issues.push(...cqResult.issues);
    result.warnings.push(...cqResult.warnings);
    result.contentQuality = cqResult.info;
  }

  // E-E-A-T
  const eeScore = computeEEAT($, schemaResult.info, bodyResult.info);
  result.eeat = eeScore;
  if (eeScore.score < 4) {
    result.warnings.push(`E-E-A-T 점수 ${eeScore.score}/6 (4 미만 — 신뢰 신호 부족)`);
  }

  // 내부 중복 감지용 첫 3문단 추출
  result.first3Paragraphs = extractFirst3Paragraphs($);

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

// Step 3-2: 내부 중복 감지
function detectInternalDuplicates(auditResults) {
  const pairs = [];
  const articles = auditResults.filter(r => r.first3Paragraphs && r.first3Paragraphs.length > 50);
  for (let i = 0; i < articles.length; i++) {
    for (let j = i + 1; j < articles.length; j++) {
      const sim = jaccardSimilarity(articles[i].first3Paragraphs, articles[j].first3Paragraphs);
      if (sim >= 0.7) {
        pairs.push({
          urlA: articles[i].url,
          urlB: articles[j].url,
          similarity: sim.toFixed(2),
        });
      }
    }
  }
  return pairs;
}

async function main() {
  console.log('=== AdSense Content Audit v2 — 콘텐츠 품질·정책 위반 감지 ===');
  console.log(`대상: ${SITE}`);
  console.log(`시작: ${new Date().toISOString()}`);
  console.log();

  // Step 1: URL 수집
  console.log('[Step 1] 사이트맵에서 URL 수집...');
  const sitemapUrls = await parseSitemap(`${SITE}/wp-sitemap.xml`);
  console.log(`  faircast.kr 사이트맵 URL: ${sitemapUrls.length}개`);

  const PRIORITY_URLS = [
    `${SITE}/`,
    `${SITE}/about/`,
    `${SITE}/port-guide/`,
  ];
  const allUrls = [...new Set([...PRIORITY_URLS, ...sitemapUrls])];
  const articleUrls = allUrls.filter(u => {
    try {
      const p = new URL(u).pathname;
      return p !== '/' && !p.match(/^\/(about|page|category|tag|author|feed|wp-)\/?/);
    } catch (_) { return false; }
  });
  console.log(`  감사 대상 총: ${allUrls.length}개 (발행글 후보: ${articleUrls.length}개)`);
  console.log();

  // Step 3-1: fairwayeta URL 수집
  console.log('[Step 2] fairwayeta.com 사이트맵 수집...');
  let fairwayetaUrls = [];
  try {
    fairwayetaUrls = await parseSitemap(`${FAIRWAYETA}/sitemap.xml`);
    if (fairwayetaUrls.length === 0) {
      fairwayetaUrls = await parseSitemap(`${FAIRWAYETA}/sitemap-0.xml`);
    }
    console.log(`  fairwayeta.com URL: ${fairwayetaUrls.length}개`);
  } catch (e) {
    console.log(`  fairwayeta.com 수집 실패: ${e.message}`);
  }
  console.log();

  // Step 2 + E-E-A-T: 전체 URL 감사
  console.log('[Step 3] 전체 URL 감사 중...');
  const auditResults = await runInBatches(allUrls, auditUrl, MAX_CONCURRENCY);
  console.log();

  // Step 3-1: fairwayeta 크로스 사이트 매칭 (발행글만)
  console.log('[Step 4] fairwayeta 원문 대비 유사도 분석...');
  const fairwayetaMatches = {};
  let fwMatchIdx = 0;
  for (const url of articleUrls.slice(0, 30)) { // 최대 30개 발행글 분석
    fwMatchIdx++;
    process.stdout.write(`\r  분석 중: ${fwMatchIdx}/${Math.min(articleUrls.length, 30)}   `);
    fairwayetaMatches[url] = await auditFairwayetaMatch(url, fairwayetaUrls);
    await sleep(FAIRWAYETA_DELAY_MS);
  }
  console.log();
  console.log();

  // Step 3-2: 내부 중복 감지
  console.log('[Step 5] 내부 중복 감지...');
  const duplicatePairs = detectInternalDuplicates(auditResults);
  console.log(`  중복 의심 쌍: ${duplicatePairs.length}개`);
  console.log();

  // Step 4: 사이트 신원 감사
  console.log('[Step 6] 사이트 신원 페이지 감사...');
  const identityAudit = await auditIdentityPages();
  console.log(`  About/Privacy/Contact/Terms 감사 완료`);
  console.log();

  // Step 5-1: Doorway page 감지
  const doorwayWarnings = detectDoorwayPages(auditResults);

  // robots.txt / ads.txt
  console.log('[Step 7] robots.txt / ads.txt 확인...');
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

  // 통계 집계
  const ok200 = auditResults.filter(r => r.info.status === 200);
  const stats = {
    total: auditResults.length,
    ok200: ok200.length,
    errors4xx5xx: auditResults.filter(r => r.info.status >= 400).length,
    redirects: auditResults.filter(r => r.info.status >= 300 && r.info.status < 400).length,
    noMetaDesc: ok200.filter(r => !r.info.metaDescription).length,
    cssPolluted: auditResults.filter(r => r.issues.some(i => i.includes('CSS 코드 오염'))).length,
    thinContentHard: auditResults.filter(r => r.issues.some(i => i.includes('300자 미만'))).length,
    thinContentSoft: auditResults.filter(r => r.warnings.some(w => w.includes('300-800자'))).length,
    contentNormal800: auditResults.filter(r => r.info.contentTier === '🟢 800-1500자').length,
    contentGood1500: auditResults.filter(r => r.info.contentTier === '✅ 1500자 이상').length,
    translationTrigger3plus: auditResults.filter(r =>
      (r.contentQuality.totalTranslationTriggers || 0) >= 3).length,
    tripleNoun3plus: auditResults.filter(r =>
      (r.contentQuality.tripleNounPhrases || 0) >= 3).length,
    jeongyuAbuse: auditResults.filter(r =>
      (r.contentQuality.jeongyuCount || 0) >= 3).length,
    pronounBias30: auditResults.filter(r =>
      parseFloat(r.contentQuality.pronounStartRatio || 0) >= 30).length,
    hamnidaRuns2plus: auditResults.filter(r =>
      (r.contentQuality.hamnidaRunsGte5 || 0) >= 2).length,
    duplicatePairs: duplicatePairs.length,
    eeatBelow4: auditResults.filter(r => r.eeat.score < 4).length,
    fairwayetaReplicated: Object.values(fairwayetaMatches).filter(m =>
      m.info.verdict && m.info.verdict.includes('🔴')).length,
  };

  // 심각도별 분류
  const critical = auditResults.filter(r => r.issues.length > 0);
  const warningOnly = auditResults.filter(r => r.issues.length === 0 && r.warnings.length > 0);
  const okItems = auditResults.filter(r => r.issues.length === 0 && r.warnings.length === 0);

  // Replicated content 위험 목록
  const replicatedRisk = Object.entries(fairwayetaMatches)
    .filter(([, m]) => m.info.verdict && m.info.verdict.includes('🔴'))
    .map(([url, m]) => ({ url, ...m.info }));

  // 번역체 심각 목록
  const translationRisk = auditResults
    .filter(r => (r.contentQuality.totalTranslationTriggers || 0) >= 3)
    .sort((a, b) => (b.contentQuality.totalTranslationTriggers || 0) - (a.contentQuality.totalTranslationTriggers || 0));

  // E-E-A-T 부족 목록
  const eeatRisk = auditResults
    .filter(r => r.eeat.score < 4 && r.info.status === 200)
    .sort((a, b) => (a.eeat.score || 0) - (b.eeat.score || 0));

  // AdSense 승인 가능성 판정
  const adsenseScore = (() => {
    if (stats.cssPolluted > 0 || stats.errors4xx5xx > 5 || replicatedRisk.length > 5) return '하';
    if (stats.thinContentHard > 10 || stats.translationTrigger3plus > 20 || stats.eeatBelow4 > 30) return '중';
    return '상';
  })();

  // 발행글별 상세 (최대 50개)
  const articleResults = auditResults.filter(r => {
    try {
      const p = new URL(r.url).pathname;
      return p !== '/' && !p.match(/^\/(about|page|category|tag|author|feed|wp-)\/?/);
    } catch (_) { return false; }
  }).slice(0, 50);

  const articleDetails = articleResults.map(r => {
    const cq = r.contentQuality || {};
    const fw = fairwayetaMatches[r.url] || { matched: null, info: {} };
    const overallIssues = [];
    if (r.issues.length > 0) overallIssues.push('🔴 ' + r.issues[0]);
    if ((cq.totalTranslationTriggers || 0) >= 3) overallIssues.push('🟡 번역체');
    if (fw.info.verdict && fw.info.verdict.includes('🔴')) overallIssues.push('🔴 Replicated');
    if (r.eeat.score < 4) overallIssues.push('🟡 E-E-A-T 부족');

    return `### ${r.info.title || r.url}
- URL: ${r.url}
- 문자 수: ${r.info.bodyTextLength != null ? r.info.bodyTextLength + '자' : 'N/A'} (${r.info.contentTier || 'N/A'})
- 번역체 트리거 수: ${cq.totalTranslationTriggers || 0}개 (밀도: ${cq.translationTriggerDensity || '0'}/1000자)
- 청유형 사용 횟수: ${cq.jeongyuCount || 0}회
- 이·그 문장 시작 비율: ${cq.pronounStartRatio || '0'}%
- 폐쇄형 종결 연속 구간: ${cq.hamnidaRunsGte5 || 0}회
- 3중 명사구: ${cq.tripleNounPhrases || 0}개
- fairwayeta 원문 매칭: ${fw.matched || '없음'}
- 원문 대비 본문 길이 비율: ${fw.info.lengthRatio || 'N/A'}
- 한국 특화 anchor 개수: ${fw.info.koreaAnchorCount != null ? fw.info.koreaAnchorCount : 'N/A'}
- fairwayeta 판정: ${fw.info.verdict || '매칭 없음'}
- E-E-A-T 점수 (0-6): ${r.eeat.score != null ? r.eeat.score : 'N/A'}
- 종합 판정: ${overallIssues.length > 0 ? overallIssues.join(' | ') : '✅ 양호'}
`;
  });

  // 리포트 생성
  const mdReport = `# Content Audit Report (v2) — 2026-07-16

> 감사 기준: Googlebot UA | 사이트: ${SITE} | 생성: ${new Date().toISOString()}

## 요약

| 항목 | 수치 |
|------|------|
| 감사 대상 URL 총 수 | ${stats.total} |
| 200 OK | ${stats.ok200} |
| 4xx/5xx 오류 | ${stats.errors4xx5xx} |
| 번역체 트리거 3개 이상 발행글 | ${stats.translationTrigger3plus} |
| 명사구 3중 중첩 발견 발행글 | ${stats.tripleNoun3plus} |
| 청유형 남용 발행글 | ${stats.jeongyuAbuse} |
| 이·그 문장 시작 30%+ 발행글 | ${stats.pronounBias30} |
| 폐쇄형 종결 연속 발행글 | ${stats.hamnidaRuns2plus} |
| fairwayeta 원문 대비 부가가치 부족 의심 | ${stats.fairwayetaReplicated} |
| faircast.kr 내부 중복 의심 쌍 | ${stats.duplicatePairs} |
| E-E-A-T 점수 4 미만 발행글 | ${stats.eeatBelow4} |
| 얇은 콘텐츠 (300자 미만) | ${stats.thinContentHard} |
| 얇은 콘텐츠 경고 (300-800자) | ${stats.thinContentSoft} |
| 정상 콘텐츠 (800-1500자) | ${stats.contentNormal800} |
| 충분한 콘텐츠 (1500자+) | ${stats.contentGood1500} |

---

## AdSense 정책 위반 위험도 종합

### 🔴 Low-value content 판정 위험

${translationRisk.length === 0 ? '없음' : translationRisk.slice(0, 10).map(r =>
  `- **${r.info.title || r.url}** — 번역체 트리거 ${r.contentQuality.totalTranslationTriggers}개`
).join('\n')}

### 🔴 Replicated content 판정 위험

${replicatedRisk.length === 0 ? '없음' : replicatedRisk.map(r =>
  `- **${r.url}**\n  → 원문: ${r.matched || 'N/A'} | 판정: ${r.verdict}`
).join('\n')}

### 🟡 Misleading representation 판정 위험

${identityAudit.issues.concat(identityAudit.warnings).length === 0 ? '없음' :
  identityAudit.issues.map(i => `- 🔴 ${i}`).join('\n') + '\n' +
  identityAudit.warnings.map(w => `- 🟡 ${w}`).join('\n')}

### 🟡 Spam policies 판정 위험

**Doorway pages:**
${doorwayWarnings.length === 0 ? '없음' : doorwayWarnings.map(w => `- ${w}`).join('\n')}

**내부 중복 의심 쌍:**
${duplicatePairs.length === 0 ? '없음' : duplicatePairs.map(p =>
  `- ${p.urlA}\n  ↔ ${p.urlB} (Jaccard ${p.similarity})`
).join('\n')}

---

## 사이트 신원 (Misleading Representation) 상세

| 항목 | 결과 |
|------|------|
| About 페이지 HTTP 상태 | ${identityAudit.info.aboutStatus || 'N/A'} |
| About: Fairtech 브랜드 명시 | ${identityAudit.info.aboutHasFairtech ? 'O' : 'X'} |
| About: 편집 원칙 명시 | ${identityAudit.info.aboutHasEditPolicy ? 'O' : 'X'} |
| About: 연락처(hello@fairtech.kr) 명시 | ${identityAudit.info.aboutHasContact ? 'O' : 'X'} |
| Contact 페이지 상태 | ${identityAudit.info.contactStatus || 'N/A'} (${identityAudit.info.contactLength || 0}자) |
| Privacy 페이지 상태 | ${identityAudit.info.privacyStatus || 'N/A'} (${identityAudit.info.privacyLength || 0}자) |
| Privacy: AdSense 명시 | ${identityAudit.info.privacyHasAdsense ? 'O' : 'X'} |
| Privacy: Google Analytics 명시 | ${identityAudit.info.privacyHasGA ? 'O' : 'X'} |
| Privacy: Cloudinary 명시 | ${identityAudit.info.privacyHasCloudinary ? 'O' : 'X'} |
| Terms 페이지 상태 | ${identityAudit.info.termsStatus || 'N/A'} (${identityAudit.info.termsLength || 0}자) |

---

## E-E-A-T 부족 발행글 (점수 4 미만)

${eeatRisk.length === 0 ? '없음' : eeatRisk.slice(0, 15).map(r =>
  `- **${r.info.title || r.url}** — ${r.eeat.score}/6\n` +
  `  저자:${r.eeat.breakdown.author ? 'O' : 'X'} | 출처:${r.eeat.breakdown.source ? 'O' : 'X'} | 발행일:${r.eeat.breakdown.datePublished ? 'O' : 'X'} | 수정일:${r.eeat.breakdown.dateModified ? 'O' : 'X'} | 내부링크:${r.eeat.breakdown.internalLinks ? 'O' : 'X'} | 외부링크:${r.eeat.breakdown.externalLinks ? 'O' : 'X'}`
).join('\n')}

---

## 발행글별 상세

${articleDetails.join('\n')}

---

## robots.txt 상태

\`\`\`
${robotsTxt || '접근 불가 (HTTP ' + (robotsRes ? robotsRes.status : 'N/A') + ')'}
\`\`\`

## ads.txt 상태

- 존재: ${adsTxt ? 'O' : 'X'}
- Google AdSense 라인 정확 여부: ${adsenseLineCorrect ? 'O ✅' : 'X ❌'}

---

## 종합 판정

### AdSense 승인 가능성: **${adsenseScore}**

### 즉시 조치 필요 항목
${replicatedRisk.length > 0 ? replicatedRisk.slice(0, 5).map(r => `- Replicated content: ${r.url}`).join('\n') : ''}
${stats.cssPolluted > 0 ? `- CSS 오염 meta description: ${stats.cssPolluted}개` : ''}
${identityAudit.issues.map(i => `- ${i}`).join('\n')}
${stats.thinContentHard > 0 ? `- 얇은 콘텐츠(300자 미만): ${stats.thinContentHard}개` : ''}
${(replicatedRisk.length === 0 && stats.cssPolluted === 0 && identityAudit.issues.length === 0 && stats.thinContentHard === 0) ? '- 없음' : ''}

### 개선 권장 항목
${stats.translationTrigger3plus > 0 ? `- 번역체 흔적 발행글 ${stats.translationTrigger3plus}개 — 실무 용어로 재작성` : ''}
${stats.eeatBelow4 > 0 ? `- E-E-A-T 점수 4 미만 발행글 ${stats.eeatBelow4}개 — 출처·저자·내부 링크 보강` : ''}
${identityAudit.warnings.map(w => `- ${w}`).join('\n')}
${stats.thinContentSoft > 0 ? `- 얇은 콘텐츠 경고(300-800자) ${stats.thinContentSoft}개 — 내용 보강` : ''}
${stats.duplicatePairs > 0 ? `- 내부 중복 의심 쌍 ${stats.duplicatePairs}개 — 콘텐츠 차별화` : ''}

---

*User-Agent: ${GOOGLEBOT_UA}*
*fairwayeta.com fetch: read-only, rate-limited (1 req/sec)*
`;

  console.log('[Step 8] 리포트 저장...');
  const outDir = path.resolve('docs/adsense-approval');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const mdPath = path.join(outDir, 'content-audit-260716.md');
  const jsonPath = path.join(outDir, 'content-audit-260716.json');

  fs.writeFileSync(mdPath, mdReport, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify({
    meta: {
      generatedAt: new Date().toISOString(),
      site: SITE,
      fairwayeta: FAIRWAYETA,
      userAgent: GOOGLEBOT_UA,
      totalUrls: allUrls.length,
    },
    stats,
    robotsTxt,
    adsTxt,
    adsenseLineCorrect,
    identityAudit,
    duplicatePairs,
    doorwayWarnings,
    fairwayetaMatches,
    results: auditResults,
  }, null, 2), 'utf8');

  console.log(`  MD: ${mdPath}`);
  console.log(`  JSON: ${jsonPath}`);
  console.log();
  console.log('=== 완료 ===');
  console.log(`총 URL: ${stats.total} | 심각: ${critical.length} | 경고: ${warningOnly.length} | 정상: ${okItems.length}`);
  console.log(`번역체 위험: ${stats.translationTrigger3plus} | Replicated: ${stats.fairwayetaReplicated} | E-E-A-T 부족: ${stats.eeatBelow4}`);
  console.log(`AdSense 승인 가능성: ${adsenseScore}`);
}

main().catch(e => {
  console.error('오류:', e.message);
  process.exit(1);
});

# Order: faircast.kr 사이트 상태 자동 모니터링 시스템 구축

**목표**: 사이트의 실제 상태를 외부에서(익명 = Googlebot 조건) 검증하고, 기대 상태와 다르면 경고하는 스크립트를 만든다.

**배경**: 5개월간 AdSense 승인 실패의 상당 부분이 "사이트 상태를 잘못 알고 있었던 것"에서 왔다. 관리자 로그인 상태로 확인해서 정상으로 보였거나, 캐시된 결과를 봤거나, 스니펫이 역효과를 내는 것을 10일간 몰랐다. 이 스크립트는 그 재발을 막는다.

**실행 위치**: `C:\Users\bab5s\Desktop\project\ship-fairtech-assets\`

**기존 자산**: `scripts/adsense-bot-audit.js`, `scripts/adsense-content-audit-v2.js` (참고만. 새로 작성한다)

---

## 산출물 2개

1. `monitor/expected-state.json` — 기대 상태 정의 (사람이 관리)
2. `scripts/site-monitor.js` — 검증 스크립트
3. 실행 결과는 `monitor/reports/state-YYYYMMDD.md`에 저장

---

## 1. `monitor/expected-state.json` 생성

아래 내용 그대로 생성한다. 앞으로 사이트 정책이 바뀌면 **이 파일만 수정**한다.

```json
{
  "_comment": "faircast.kr 기대 상태 정의. 2026-07-25 기준.",
  "site": "https://faircast.kr",
  "lastUpdated": "2026-07-25",

  "keyPages": {
    "https://faircast.kr/": {
      "label": "홈",
      "expectStatus": 200,
      "expectIndexable": true,
      "descriptionMustBeKorean": true
    },
    "https://faircast.kr/about/": {
      "label": "About",
      "expectStatus": 200,
      "expectIndexable": true,
      "descriptionMustBeKorean": true
    },
    "https://faircast.kr/hello-korea-page/": {
      "label": "Hello Korea",
      "expectStatus": 200,
      "expectIndexable": true,
      "descriptionMustBeKorean": true
    },
    "https://faircast.kr/hello-world-page/": {
      "label": "Hello World",
      "expectStatus": 200,
      "expectIndexable": true,
      "descriptionMustBeKorean": false
    },
    "https://faircast.kr/port-guide/": {
      "label": "항만 가이드",
      "expectStatus": 200,
      "expectIndexable": true,
      "descriptionMustBeKorean": true
    },
    "https://faircast.kr/privacy/": {
      "label": "개인정보처리방침",
      "expectStatus": 200,
      "expectIndexable": true
    },
    "https://faircast.kr/terms/": {
      "label": "이용약관",
      "expectStatus": 200,
      "expectIndexable": true
    },
    "https://faircast.kr/contact/": {
      "label": "Contact",
      "expectStatus": 200,
      "expectIndexable": true
    }
  },

  "legacyRedirects": {
    "_comment": "World Cup 잔재. 전부 홈으로 301이어야 색인에서 빠진다.",
    "expectRedirectTo": "https://faircast.kr/",
    "urls": [
      "https://faircast.kr/matchup",
      "https://faircast.kr/simulate",
      "https://faircast.kr/simulate/france",
      "https://faircast.kr/match/france-vs-senegal",
      "https://faircast.kr/match/argentina-vs-austria",
      "https://faircast.kr/bracket",
      "https://faircast.kr/rankings",
      "https://faircast.kr/tournament",
      "https://faircast.kr/insights/",
      "https://faircast.kr/insights/mbappe-injury-scare-world-cup-2026-france"
    ]
  },

  "categoryRedirects": {
    "_comment": "494 스니펫. 카테고리 1·8은 정적 페이지로 301.",
    "https://faircast.kr/category/insights/hello-korea/": "https://faircast.kr/hello-korea-page/",
    "https://faircast.kr/category/insights/hello-world/": "https://faircast.kr/hello-world-page/"
  },

  "categoryNoindex": {
    "_comment": "529 스니펫. 리디렉션되지 않는 카테고리는 noindex여야 한다.",
    "urls": [
      "https://faircast.kr/category/port-guide/"
    ]
  },

  "robotsTxt": {
    "mustContain": [
      "Sitemap: https://faircast.kr/wp-sitemap.xml",
      "Disallow: /wp-admin/"
    ],
    "mustNotContain": [
      "Disallow: /match/",
      "Disallow: /simulate/",
      "Disallow: /insights/",
      "Disallow: /matchup",
      "Disallow: /tournament",
      "Disallow: /rankings",
      "Disallow: /bracket"
    ],
    "mustNotContainReason": "617 스니펫. robots.txt 차단은 색인 제거를 오히려 막는다. 절대 켜지 말 것."
  },

  "adsTxt": {
    "mustContain": "google.com, pub-9894725798878226, DIRECT, f08c47fec0942fa0"
  },

  "sitemaps": {
    "https://faircast.kr/wp-sitemap.xml": { "minUrls": 3 },
    "https://faircast.kr/wp-sitemap-posts-post-1.xml": { "minUrls": 55 },
    "https://faircast.kr/wp-sitemap-posts-page-1.xml": { "minUrls": 6 }
  },

  "snippetFootprints": {
    "_comment": "스니펫 활성 여부를 HTML 출력 흔적으로 역추적한다.",

    "378_metaDescription": {
      "expect": "active",
      "checkUrl": "https://faircast.kr/",
      "test": "metaDescriptionIsClean"
    },
    "574_orgSchema": {
      "expect": "active",
      "checkUrl": "https://faircast.kr/",
      "test": "htmlContains",
      "needle": "\"@id\": \"https://faircast.kr/#organization\""
    },
    "575_articleSchema": {
      "expect": "active",
      "checkUrl": "SAMPLE_POST",
      "test": "htmlContains",
      "needle": "\"@type\":\"Article\""
    },
    "573_authorBio": {
      "expect": "active",
      "checkUrl": "SAMPLE_POST",
      "test": "htmlContains",
      "needle": "ABOUT THE EDITORIAL DESK"
    },
    "259_ga4": {
      "expect": "active",
      "checkUrl": "https://faircast.kr/",
      "test": "htmlContains",
      "needle": "googletagmanager.com/gtag/js"
    },
    "201_rightClickBlock": {
      "expect": "inactive",
      "checkUrl": "https://faircast.kr/",
      "test": "htmlNotContains",
      "needle": "contextmenu",
      "reason": "AdSense Abusive experiences 정책 위반 소지. Ctrl+U·F12 차단 코드."
    },
    "adsenseCode": {
      "expect": "active",
      "checkUrl": "https://faircast.kr/",
      "test": "htmlContains",
      "needle": "pub-9894725798878226"
    }
  },

  "policyRedFlags": {
    "_comment": "AdSense 정책 위반 소지가 있는 패턴. 발견되면 경고.",
    "htmlMustNotContain": [
      { "needle": "contextmenu", "why": "우클릭 차단 = Abusive experiences" },
      { "needle": "e.key === 'F12'", "why": "개발자 도구 차단 = Abusive experiences" },
      { "needle": "user-select: none", "why": "텍스트 선택 차단. 본문 적용 시 문제" }
    ]
  }
}
```

---

## 2. `scripts/site-monitor.js` 작성

### 기본 요구사항

- Node.js CommonJS (`require`). 기존 스크립트와 동일 스타일
- 의존성: `axios`, `cheerio` (이미 설치됨). 없으면 `npm install`
- **User-Agent는 반드시 Googlebot**:
  `Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`
- **캐시 무력화 필수**: 모든 요청에 헤더 추가
  ```
  Cache-Control: no-cache
  Pragma: no-cache
  ```
  그리고 URL에 타임스탬프 쿼리를 붙이지 **말 것** (리디렉션에서 잘려 무의미했음)
- 동시 요청 3개, 요청 간 400ms
- 실패 시 2회 재시도

### 검사 항목별 구현

#### A. keyPages 검사

각 URL에 대해:
- HTTP 상태가 `expectStatus`와 일치하는가
- `<meta name="robots">`에 `noindex`가 있는가 → `expectIndexable`과 대조
- `<meta name="description">` 추출 후:
  - 비어 있으면 🔴
  - **CSS 오염 검사**: `/\{[^}]*:[^}]*\}/` 매칭 또는 `!important` 포함 또는 `body.page-id` 시작 → 🔴 CRITICAL
  - `descriptionMustBeKorean: true`인데 한글(`/[가-힣]/`)이 없으면 🟡
- `<link rel="canonical">` 존재 여부

#### B. legacyRedirects 검사 ⭐ 가장 중요

각 URL에 대해 **리디렉션을 따라가지 말고**(`maxRedirects: 0`) 응답을 본다:

- 상태가 301 **또는** 302이고 `Location`이 홈이면 ✅
- 상태가 200이면 🔴 **CRITICAL** — "축구 페이지가 살아있음. 색인에 남는다"
- 상태가 404면 🟡 — "301이 아니라 404. 색인 제거는 되지만 느림"

#### C. categoryRedirects 검사

`maxRedirects: 0`으로 요청 → `Location`이 기대값과 일치하는가

#### D. categoryNoindex 검사

리디렉션 따라간 뒤 HTML에서 `noindex` 존재 확인

#### E. robotsTxt 검사

- `mustContain` 각 항목이 있는가 → 없으면 🔴
- `mustNotContain` 각 항목이 있는가 → **있으면 🔴 CRITICAL** + `mustNotContainReason` 출력

#### F. adsTxt 검사

`https://faircast.kr/ads.txt` fetch → `mustContain` 문자열 포함 여부

#### G. sitemaps 검사

각 사이트맵 XML fetch → `<loc>` 태그 개수가 `minUrls` 이상인가

> XML이 binary로 오는 경우가 있으니 `responseType: 'text'` 명시할 것

#### H. snippetFootprints 검사 ⭐ 핵심 기능

`checkUrl`이 `"SAMPLE_POST"`인 경우, 사이트맵에서 발행글 URL 하나를 자동으로 골라 사용한다 (가장 최근 것).

각 항목의 `test`에 따라:
- `metaDescriptionIsClean`: A의 CSS 오염 검사와 동일
- `htmlContains`: raw HTML에 `needle` 포함 여부
- `htmlNotContains`: raw HTML에 `needle`이 **없어야** 통과

결과를 `expect`("active" 또는 "inactive")와 대조.
**불일치하면 🔴** — 그리고 `reason`이 있으면 함께 출력.

> 이 검사가 오늘(2026-07-25) 발견한 종류의 사고를 잡는다:
> 617이 켜져 있던 10일, 201이 언제 켜져 있었는지 모르는 상태 등.

#### I. policyRedFlags 검사

키 페이지 전체의 raw HTML에서 각 `needle` 검색. 발견되면 🟡 + `why` 출력.

---

## 3. 리포트 출력

`monitor/reports/state-YYYYMMDD.md`에 저장하고, 동시에 콘솔에 요약 출력.

```markdown
# 사이트 상태 점검 — YYYY-MM-DD HH:mm

> User-Agent: Googlebot | 캐시 무력화 적용

## 종합

| 판정 | 개수 |
|------|------|
| 🔴 CRITICAL | N |
| 🟡 경고 | N |
| ✅ 정상 | N |

**상태: 정상 / 주의 / 위험**

---

## 🔴 CRITICAL

(항목별로: 무엇이 / 기대값 / 실제값 / 왜 문제인지)

## 🟡 경고

(동일 형식)

---

## 상세

### 핵심 페이지 (8개)
| 페이지 | 상태 | 색인 | description |
|--------|------|------|-------------|

### World Cup 잔재 리디렉션 (10개)
| URL | 상태 | Location | 판정 |
|-----|------|----------|------|

### 스니펫 상태 (외부 탐지)
| 스니펫 | 기대 | 실제 | 판정 |
|--------|------|------|------|

### robots.txt
(원문 전체)

### 사이트맵
| Sitemap | URL 수 | 기준 | 판정 |

### ads.txt
(원문)
```

---

## 4. 실행 방법

```powershell
cd "C:\Users\bab5s\Desktop\project\ship-fairtech-assets"
node scripts/site-monitor.js
```

- 인자 없이 실행하면 전체 검사
- `--quick` 인자를 주면 legacyRedirects + robotsTxt + snippetFootprints만 (30초 이내)

## 5. 종료 코드

- CRITICAL 0건 → `process.exit(0)`
- CRITICAL 1건 이상 → `process.exit(1)`

향후 CI나 스케줄러에 물릴 수 있게.

---

## 6. 완료 확인

- [ ] `monitor/expected-state.json` 생성
- [ ] `scripts/site-monitor.js` 작성
- [ ] `node scripts/site-monitor.js` 실행 성공
- [ ] `monitor/reports/state-20260725.md` 생성 확인
- [ ] `--quick` 모드 동작 확인
- [ ] `.gitignore`에 `node_modules/` 있는지 확인. 없으면 추가

## Commit

```
feat: site state monitoring with snippet footprint detection
```

---

## 주의사항

1. **이 스크립트는 읽기 전용이다.** 사이트에 아무것도 쓰지 않는다. 안전하다.
2. **결과를 100% 신뢰하지 말 것.** HTTP 클라이언트도 캐시를 탈 수 있다. CRITICAL이 뜨면 Search Console 「실제 URL 테스트」로 교차 확인한다. 그것이 유일한 절대 기준이다.
3. Wordfence가 반복 요청을 차단할 수 있다. 400ms 딜레이를 줄이지 말 것.
4. `expected-state.json`은 **사람이 관리하는 정책 파일**이다. 사이트 구조를 바꾸면 이 파일도 같이 고쳐야 한다. 안 고치면 오탐이 쌓이고 결국 아무도 안 보게 된다.

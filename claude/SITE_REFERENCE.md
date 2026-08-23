# SITE_REFERENCE — faircast.kr 인프라 사실관계

**최종 갱신: 2026-08-22**
「지금 뭐가 어디에 붙어 있나」의 정본. 값이 바뀌면 **즉시 이 줄을 고친다.**

---

## 1. 스택

| 항목 | 값 |
|---|---|
| 호스팅 | 가비아, 용량 **1GB** (이래서 이미지를 워드프레스에 안 올린다) |
| CMS / 테마 | WordPress / **Kadence** |
| Featured Image | **FIFU** 플러그인 (Cloudinary URL 직접 지정) |
| 이미지 호스팅 | Cloudinary 계정 `dzatgu3y7` |
| 스니펫 관리 | **WPCode** |
| 보안 | **Wordfence** — 활성. 단 `web_fetch` 는 막지 않는다 (2026-08-14 실측 정정) |
| 정적 자산 | GitHub `oceanholic83-web/ship-fairtech-assets` → **jsDelivr** CDN |
| 분석 | GA4 `G-ETQ9ZF78CF` ⚠️ `G-3L86TW7BFJ` 중복 존재 |
| 지도 | Mapbox |

---

## 2. WPCode 스니펫 (ID 기준)

| ID | 이름 | 상태 | 주의 |
|---|---|---|---|
| 573 | Author Bio | 활성 | 문구에 **선박엔지니어만 지칭 금지.** 독자는 갑판부·기관부·영업부 전부 |
| 378 | Meta Description | 활성 | **`chr(60)` / `'scr' . 'ipt'` 분할을 합치지 말 것** (Wordfence WAF 회피). 페이지 ID 269/522/488/490 하드코딩 |
| 406 | World Cup **410 Gone** | 활성 | 2026-08-14 301→410. **2026-08-22 훅 우선순위 `}, 1);` 필수** — 없으면 `/insights` 맨 경로가 코어 canonical + 494 에 먼저 잡혀 홈으로 샌다 |
| ? | Feed & Paged Archive Noindex | 활성 | 2026-08-14 신설. `X-Robots-Tag` 헤더. 경로 정규식 `#/page/[0-9]+/?$#` |
| 529 | Category Noindex | 활성 | **정상 작동 확인됨** (2026-07-26 view-source). 모니터 오탐이었다 |
| 494 | Category→Page 301 | 활성 | |
| 359 | non-www / https 정규화 | 활성 | |
| 358 | Tag Noindex | 활성 | |
| 259 | GA4 (`G-3L86TW7BFJ`) | **비활성 (2026-08-23)** — 측정 ID 중복. 정본은 WPCode 헤더/푸터의 `G-ETQ9ZF78CF` | |
| 220 | 도식 CSS | 활성 | |
| 68 | Port Atlas Map | 활성 | |
| 617 | robots.txt World Cup 차단 | **비활성 — 재활성화 금지** | 크롤 차단은 색인 제거가 아니다. STATUS 4장 |
| 201 | 우클릭·F12 차단 | **비활성 — 활성화 금지** | AdSense Abusive experiences |

---

### 축구(월드컵) URL 처리 이력

| v | 날짜 | 방식 | 결과 |
|---|---|---|---|
| v1 | 2026-07-16경 | WPCode **617** robots.txt 차단 | **역효과.** 크롤 차단은 색인 제거가 아니다. 색인된 URL이 그대로 남고 10일 손해 |
| v2 | 2026-07-25 | WPCode **406** 홈 301 | **불충분.** 대량 홈 리디렉션은 soft 404 취급이라 색인에서 안 빠졌다 |
| v3 | 2026-08-14 | WPCode **406** → **410 Gone** | 검증 완료. 재크롤 대기 |

교훈: 색인에서 빼려면 **크롤을 허용한 채로 제거 신호**(410 / noindex)를 줘야 한다. 차단은 반대 효과다.

---

## 3. 페이지 / 카테고리 ID

- 항만 가이드 페이지 = **522**
- 378 스니펫이 메타 설명을 주는 페이지 = 269 / 522 / 488 / 490
- 카테고리: Hello, Korea = 1 · Hello, World = 8 · Insights = 192 · 항만 가이드 = **47**
  - 하위: 산업 229 · 시장 228 · 일반 232 · 지정학 231 · 항로·항만 230 · Korea Industry 234 · Korea Market 233 · Explainers 235

---

## 4. 빌드 파이프라인 (항만 가이드)

```
pages/port-guide/config.json  ─┐
pages/port-guide/template.html ─┼→ build.js →  port-guide.html  →(사람이 붙여넣기)→ WP 페이지 522
data.js (기관 데이터)          ─┤
WP REST (글 목록, monitor API) ─┘
```

- `data.js` 의 항만 배열은 **13개**다 (광양·여수 분리). 「12개 무역항」은 어느 기준으로도 틀린 수 — 국가관리 14 / 전체 31
- `data.js` 는 **브라우저 IIFE**다. Node에서 `require()` 하려면 `global.window` shim이 필요하다 (build.js 상단에 있음)
- `loaderUrl` 의 `@<commit>` 은 빌드 시 **git HEAD로 자동 치환**된다. `config.json` 값은 초기값일 뿐
- `data.js` 가 커밋 안 됐으면 빌드가 경고한다. **순서: 커밋 → 푸시 → 빌드 → 붙여넣기**
- `loader.js` 는 자기 `script src` 의 `@<commit>` 을 뽑아 같은 핀으로 `data.js` / `port-atlas*.js` 를 부른다

### 워드프레스 붙여넣기 규칙
- **`pages/*.html` 은 모델이 손으로 편집하지 않는다.** 전체가 한 줄이라 재작성 과정에서 누락·중복이 난다. 반드시 문자열 치환 스크립트로
- 반드시 `<!-- wp:html -->` … `<!-- /wp:html -->` 로 감싼다. **비주얼 편집기는 `<svg>` 를 지운다**
- 붙여넣기를 잊어도 사이트는 멀쩡해 보인다 → `checkBuildStamp` 가 이걸 잡는다

### ⚠️ 구조적 결함 (기록용)
`template.html` 은 `<style>` 블록이 본문 최상단에 온다. 이게 v5 메타 설명 CSS 오염의 **구조적 원인**이었다.
지금은 378이 ID를 하드코딩하고 `<style>` 을 걸러 가려져 있을 뿐이다.
**새 페이지를 만들면 그 ID를 378에 추가해야 한다. 안 하면 CSS가 메타 설명으로 샌다.**

---

## 5. 모니터

`node scripts/site-monitor.js` — Googlebot UA + cheerio. **읽기 전용.** 사이트를 고치지 않는다.

- 전체 `[1..10/10]`, 빠른 점검 `[1..4/4]`
- 기대 상태 정의: `monitor/expected-state.json`
- `checkBuildStamp` — 라이브 `data-rev` vs 로컬 `data.js` sha256 8자리
- `robotsContent($)` — robots 메타를 **전부** 합쳐 읽는다. 첫 태그만 읽으면 오판한다

**모니터의 빨간불은 가설이지 사실이 아니다.** 오탐 전과 3회. STATUS 3장.

---

## 6. 비밀 정보

공개 저장소다 (jsDelivr가 public repo만 서비스).

- gitignore: `node_modules/`, `config.local.json`, `**/config.local.json`
- 실제 키 위치: `monitor/config.local.json` (monitor API), `pages/*/config.local.json` (monitor API + Mapbox 토큰)
- **키를 대화창·문서·오더에 붙여넣지 않는다.** GitHub Secret Scanning이 push를 막는다

---

## 7. 자매 자산 (건드리지 않음)

| 사이트 | 정체 | 비고 |
|---|---|---|
| fairwayeta.com | 영문 분석 | **별도 작업창에서 관리. 이 창에서 수정 금지** |
| faircall.kr | Next.js + Supabase + Mapbox 실시간 항만 데이터 | 원장 패턴의 원전 |
| fairtech.kr | Vercel 랜딩 | |

이메일: `hello@fairtech.kr`

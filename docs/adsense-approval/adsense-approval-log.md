# AdSense Approval Log — faircast.kr

Site: faircast.kr (WordPress, Gabia hosting, Kadence theme)
AdSense Publisher ID: pub-9894725798878226
Domain: faircast.kr (subdomain of fairtech.kr)
Primary language: Korean (Hello, Korea) + English (Hello, World)
Niche: Maritime industry analysis — shipping, ports, shipbuilding, regulation

---

## Rejection History

| Date | Status | Reason | Notes |
|------|--------|--------|-------|
| 2026-06-22 02:07 KST | Rejected | "가치가 별로 없는 콘텐츠" (Low-value content) | Second rejection. First rejection date not recorded. |

---

## Entry: 2026-06-26 — Pre-resubmission Audit

### Session summary

Full site audit performed before AdSense resubmission. Analyzed GA4, Search Console, AdSense dashboard, WordPress admin, WPCode snippets, robots.txt, ads.txt, sitemap, and all indexed/non-indexed pages.

### Site content at time of audit

- **Published articles**: 27 (Korean 25 + English 2)
  - Today added: UK ETS Korean article + VLSFO Korean article = 2 new
  - Total after today: ~29 articles
- **Pages**: 8 (Home, About, Privacy, Terms, Contact, Hello Korea page, Hello World page, Port Guide page)
- **Port guide**: Mapbox interactive map + 9 port cards with links to guide articles

### GA4 data (last 7 days as of 2026-06-26)

- Active users: 67 (+6.9%)
- Page views: 1,700 (+82.4%)
- Sessions: 65 (+8.5%)
- Top traffic sources: chatgpt.com/ai-assistant (20 sessions), direct (27), google/organic (24, +700%), claude.ai/ai-assistant (15, +400%)
- Top countries: South Korea (35), Poland (7), China (3), Belgium (2)
- Top pages: Home (207 views), Port Guide (110), Hello Korea (147), Hello World (88)

### Search Console data (last 28 days)

- Total clicks: 23
- Total impressions: 671
- Top clicked pages: Shadow Fleet article (3 clicks), About (2), Classification Society (2), Worldscale (2), Home (1)
- Top search queries: "한국선급" (1 click), "p&i club" (0/9 impressions), "faircast" (0/8)
- Indexed pages: 84
- Sitemap discovered pages: 42 (posts only; page sitemap was returning "could not fetch")

### Issues found and resolved

#### 1. 404 errors — 19 legacy World Cup URLs (RESOLVED, MONITORING)
- **Root cause**: faircast.kr was previously a World Cup prediction site. 19 URLs (/match/*, /simulate/*, /insights/group-*, /insights/world-cup-*, /insights/fifa-*, /bracket, /rankings) still being crawled by Google.
- **Fix applied**: WPCode snippet ID 406 "Legacy World Cup 301 Redirects" — PHP template_redirect hooking all legacy URL patterns to home_url('/'), 301 status.
- **Validation status**: Started 2026-06-18. Google re-crawling in progress. Not yet "passed."
- **Action needed**: Wait for validation to show "passed" before resubmitting AdSense.

#### 2. "Crawled — currently not indexed" — 11 pages (PARTIALLY RESOLVED)
- **Breakdown**:
  - 6 legacy World Cup URLs (already covered by redirect snippet ID 406): `/insights/france-usa-injury-watch`, `/rankings`, `/match/canada-vs-switzerland`, `/insights/world-cup-2026-prize-money-breakdown`, `/match/spain-vs-uruguay`, `/bracket`
  - 3 system URLs (normal, no action): `/feed/`, `/comments/feed/`, `/wp-includes/js/wp-emoji-release.min.js`
  - 1 slug variant (auto-redirects): `/terms` → `/terms/`
  - 1 unknown (check next session)
- **Fix**: Same redirect snippet covers the 6 World Cup URLs. System URLs are normal behavior.

#### 3. About page title cached as "World Cup 2026 Prediction Engine" (RESOLVED)
- **Root cause**: Google cache retained old title from pre-pivot site.
- **Current state**: Page content fully updated to maritime industry. Tab title shows "About – Faircast". Body content describes Faircast as maritime analysis media.
- **Fix applied**: Manual re-index request submitted via Search Console URL Inspection for `https://faircast.kr/about/` on 2026-06-26.
- **Action needed**: Monitor Search Console "유용한 정보" page to confirm title update.

#### 4. Sitemap page sub-sitemap "could not fetch" (RESOLVED)
- **Root cause**: `wp-sitemap-posts-page-1.xml` (containing About, Privacy, Terms, Contact, etc.) was returning "사이트맵을 읽을 수 없음" in Search Console, while browser access showed 8 URLs correctly.
- **Possible cause**: Wordfence intermittent blocking of Googlebot, or WordPress sitemap caching issue.
- **Fix applied**: Sitemap re-submitted via Search Console on 2026-06-26. Expected to update within days.
- **Expected result**: Discovered pages should increase from 42 to ~50 (42 posts + 8 pages).

#### 5. Category/tag/author/date archive noindex (PREVIOUSLY RESOLVED)
- Category archive noindex: WPCode snippet ID 529 — active ✅
- Tag archive noindex: WPCode snippet ID 358 — active ✅
- Tag excluded from sitemap: WPCode snippet ID 361 — active ✅
- Author/date archive noindex: Not explicitly set, but no evidence of indexing issues.

#### 6. Re-index requests submitted (2026-06-26)
- `https://faircast.kr/about/` — re-index requested
- `https://faircast.kr/` — re-index requested
- `https://faircast.kr/uk-ets-shipping-maritime-carbon-cost-korea-2026/` — re-index requested
- `https://faircast.kr/vlsfo-explained-bunker-fuel-price-korea-2026/` — re-index requested
- `https://faircast.kr/terms/` — re-index requested

### Items confirmed OK

| Item | Status | Detail |
|------|--------|--------|
| ads.txt | ✅ | `google.com, pub-9894725798878226, DIRECT, f08c47fec0942fa0` |
| robots.txt | ✅ | No Disallow for content. Only `/wp-admin/` blocked. Sitemap URL included. |
| Search engine visibility | ✅ | WordPress Settings → Reading → "검색 엔진이 이 사이트를 검색하는 것을 차단" unchecked |
| Privacy page | ✅ | `/privacy/` — Korean, complete |
| Terms page | ✅ | `/terms/` — Korean, "Faircast" branding (previously "Ship Fairtech", now updated) |
| About page | ✅ | `/about/` — Korean, maritime industry description, Fairtech team identity, content principles listed |
| Contact | ✅ | hello@fairtech.kr listed on About page |
| HTTPS | ✅ | 44 HTTPS pages, 0 non-HTTPS |
| GA4 | ✅ | G-ETQ9ZF78CF active |
| Homepage content | ✅ | Hero banner + 3 category cards (Hello Korea / Hello World / Port Guide) + latest 3 articles |
| Footer | ✅ | 4 links (이용약관, 개인정보 처리방침, Contact) + copyright |

### WPCode snippet inventory (14 total, 13 active)

| ID | Name | Type | Status |
|----|------|------|--------|
| 529 | Category Archive Noindex | PHP | Active |
| 494 | (제목 없는 스니펫) | PHP | Active |
| 406 | Legacy World Cup 301 Redirects | PHP | Active |
| 378 | Meta Description from Excerpt | PHP | Active |
| 361 | Exclude Tags from Sitemap | PHP | Active |
| 359 | Force non-www redirect | PHP | Active |
| 358 | Tag Archive Noindex | PHP | Active |
| 259 | GA4 Tracking | HTML | Active |
| 220 | Faircast 도식 CSS | CSS | Active |
| 201 | 이미지·SVG 우클릭/드래그 차단 | HTML | Active |
| 69 | Enable Shortcodes in Category Description | PHP | Active |
| 68 | Korea Port Atlas Map | HTML | Active |
| 67 | 댓글을 완전히 비활성화합니다 | PHP | Active (Outdated) |
| 66 | 글의 첫 번째 단락 뒤에 메시지 표시 | Text | Active |

### Content published today (2026-06-26)

#### UK ETS Korean article (v3 final)
- **Title**: 7월 1일, 영국 항구에 닿는 모든 배가 탄소 비용을 낸다 — UK ETS가 시작된다
- **Slug**: `uk-ets-shipping-maritime-carbon-cost-korea-2026`
- **Persona**: K-Junior Pro
- **Fact-check corrections applied**:
  - Korean shipping companies: HMM (Premier Alliance FE4, Felixstowe, confirmed) + Hyundai Glovis (PCTC 128 ships by 2030, LNG dual-fuel, AMP) added as primary UK-exposed Korean companies
  - Pan Ocean / Korea Line / SK Shipping: reclassified as "spot voyages, not regular callers"
  - P&O ferry route error corrected: P&O does NOT operate Belfast routes (only Larne-Cairnryan). Stena Line operates Belfast-Liverpool and Belfast-Cairnryan. Ferry section removed entirely (site identity = deep-sea shipping, not ferry)
  - NI-GB 50% deduction rule retained in body text and SVG (Windsor Framework context)
  - South Hook LNG terminal: Nakilat (Qatar) operates nearly all vessels; Korean LNG carriers have limited direct UK exposure. Korean shipyards built many of these vessels — indirect connection to UK ETS.
  - All UK/Irish place names given English parenthetical on first mention: Felixstowe, Southampton, London Gateway, Milford Haven, Immingham, Port Talbot, Tata Steel, Windsor Framework, Premier Alliance, Cairnryan, Belfast, Larne
- **SVGs**: 4 (UK ETS vs EU ETS comparison, compliance procedure, cost examples, timeline) — all Korean labels
- **Images**: 4 (Cloudinary 26062501–04)
- **Cross-links**: EU ETS Korea, Charterparty abbreviations, Busan Port 30 years, Pyeongtaek-Dangjin Port
- **Sources**: 3 (DESNZ UK ETS Authority Response 2025.11, DNV UK ETS guide 2026.6, UK civil penalty reference price 2025.11)

#### VLSFO Korean article (v3 final)
- **Title**: 부산에서 넣으면 100달러 더 비싸다 — VLSFO, 선박 연료의 구조
- **Slug**: `vlsfo-explained-bunker-fuel-price-korea-2026`
- **Persona**: K-Junior Pro
- **Korean anchors**:
  - Anchor A: Busan VLSFO supply structure — 4 Korean refiners (SK Energy, GS Caltex, S-Oil, HD Hyundai Oilbank) → wholesale-to-retail intermediary structure → ~$100/tonne premium over Rotterdam. Hormuz crisis: Busan $528→$1,290 vs Singapore $521→$1,050.
  - Anchor B: BPA Busan New Port LNG bunkering commercial launch (July 2025, MSC CALAIS first vessel)
- **Terminology corrections**:
  - "초저유황유" → "저유황유(VLSFO)" — Korean standard per KIMST (해양환경안전학회), MOF (해양수산부), Korea Shipping Gazette. "초저유황유" is ULSD terminology.
  - "스프레드" → "가격 차이(spread)" on first mention, then "격차" / "가격 차이" consistently throughout. SVG labels also converted.
  - English parentheticals added: scrubber, Brent, Hormuz, Capesize, Rotterdam (in lead), North Sea/Baltic/North American ECA, MEPC, UKA
- **Data alignment with English edition**: VLSFO-HSFO "200–250" (not 150–250), Brent premium "25.8%" (not 25–30%), Hormuz crisis timing "March mid-point" specified
- **SVGs**: 4 (three fuels comparison, scrubber spread economics, 4 price forces, G4 benchmark ports) — all Korean labels
- **Images**: 3 (Cloudinary 26062601–03) + FIFU main image pending
- **Cross-links**: EU ETS Korea, UK ETS Korea, Busan Port 30 years, Ulsan Port
- **Sources**: 3 (IMO MARPOL Annex VI, Ship & Bunker + MABUX 2026.6, MOF + BPA 2025–2026)

### IMO sulphur regulation fact-check (confirmed during session)

- **Global cap**: 0.50% (IMO 2020, MARPOL Annex VI) — VLSFO standard ✅
- **ECA cap**: 0.10% (since 2015) — MGO standard ✅
- **0.30% standard**: Does NOT exist in IMO regulations. Confirmed absent.
- **Existing ECAs**: Baltic Sea, North Sea, North American, US Caribbean Sea
- **New ECAs**: Mediterranean (SOx ECA effective May 2025), Canadian Arctic + Norwegian Sea (SOx 0.10% effective March 2027)

### Korean industry terminology confirmed

- VLSFO = "저유황유" (MOF, KIMST, Korea Shipping Gazette, Financial News standard). NOT "초저유황유" (which refers to ULSD).
- HSFO = "고유황유" ✅
- MGO = "선박용 경유" or "경유(MGO)" ✅ (per Samsung Heavy Industries blog, patents, industry usage)
- Scrubber = "스크러버(배기가스 세정 장치)" ✅
- ECA = "배출규제해역(ECA)" ✅
- Hi-5 spread = "Hi-5 격차" (VLSFO-HSFO price gap) — Korean industry uses "격차" as natural equivalent

---

## Next steps (as of 2026-06-26 end of session)

### Immediate (before AdSense resubmission)
1. ⏳ Wait 2–3 days for:
   - 404 validation status to change from "시작됨" to "통과"
   - Sitemap re-crawl to discover 50+ pages (posts + pages)
   - About page title to update from "World Cup 2026 Prediction Engine" to "About – Faircast" in Search Console
2. ⏳ VLSFO article FIFU main image: GPT image generation pending, Cloudinary upload needed
3. ✅ Then: AdSense → faircast.kr → "문제를 수정했음을 확인합니다" → Submit

### After AdSense approval
- Search Console: monitor organic search growth
- fairwayeta.com AdSense: currently "준비 중" — submit after faircast.kr approved
- Content expansion: Mokpo port, Jeju port, TD3C Korean explainer
- About page hero panel (teal+amber gradient)
- Port guide page: hide Kadence title bar

---

## File locations

| File | Path |
|------|------|
| UK ETS Korean v3 HTML | `/mnt/user-data/outputs/uk-ets-korea-final-v3.html` |
| VLSFO Korean v3 HTML | `/mnt/user-data/outputs/vlsfo-korea-final-v3.html` |
| VLSFO Korean draft v1 | `/mnt/user-data/outputs/vlsfo-korea-draft-v1.txt` |
| This log | `docs/adsense-approval-log.md` (push to ship-fairtech-assets repo) |
| jsDelivr cache guide | `docs/jsdelivr-cache-bypass.md` (already in repo) |

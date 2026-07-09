# AdSense Approval Log — faircast.kr (v2)

**Last Updated**: 2026-07-04
**Previous log**: adsense-approval-log.md (2026-06-26)
**Site**: faircast.kr (WordPress, Gabia hosting, Kadence theme)
**AdSense Publisher ID**: pub-9894725798878226
**Primary language**: Korean (Hello, Korea) + English (Hello, World)
**Niche**: Maritime industry analysis — shipping, ports, shipbuilding, regulation

---

## Rejection History

| Date | Site | Status | Reason | Notes |
|------|------|--------|--------|-------|
| 2026-06-13 | fairwayeta.com | Submitted | — | First submission |
| ~2026-06-22 | faircast.kr | Rejected | "가치가 별로 없는 콘텐츠" | Second rejection |
| 2026-06-28 16:03 KST | faircast.kr | Re-submitted | — | Third submission, under review |
| 2026-07-01 | fairwayeta.com | Rejected | "가치가 별로 없는 콘텐츠" | Third rejection |
| 2026-07-04 | faircast.kr | **Under Review** | — | Still "준비 중" as of writing |

---

## Entry: 2026-07-04 — Comprehensive Diagnosis & Byline System Implementation

### Session summary

Full re-audit following fairwayeta.com 3rd rejection. Applied fairwayeta diagnostic findings to faircast.kr. Directly analyzed 4 early-published articles for AI tone. Diagnosed root cause. Prepared byline system for E-E-A-T strengthening.

### Site content at time of audit (2026-07-04)

- **Published articles**: ~29 (Korean 27 + English 2)
- **Pages**: 8 (Home, About, Privacy, Terms, Contact, Hello Korea, Hello World, Port Guide)
- **Draft articles ready** (not yet published, waiting for AdSense decision):
  - PMS/AI 예측정비 한글판 v6 (~5,628자, K-Junior Pro)
  - 바이오매스 펠릿 한글판 (~5,260자, K-Junior Pro)

### GA4 data (last 7 days as of 2026-07-04)

- **Active users**: 27 (-64.5% vs previous 7 days) ⚠️
- **Page views**: 351 (-80.0%)
- **Sessions**: 22 (-70.7%)
- **Top traffic sources**: AI Assistant (14, still ~50% share), Direct (10), Organic Search (12)
- **Note**: ChatGPT traffic dropped to 0 during this window. Claude.ai still active (14 sessions).
- **Search Console**: 33 clicks / 1,200 impressions (up from 30/1,080)

### Search Console data (last 28 days)

- Total clicks: 33 (+3)
- Total impressions: 1,200 (+120)
- Indexed pages: 84 (no change from previous audit)
- Non-indexed: 36 (no change)
- Sitemap discovered: 74/74 ✅ (up from 42 — page sub-sitemap issue resolved)
- Top queries: "vetting 뜻" (21 imp/0 clk), "p&i club" (20/0), "용선료" (12/0), "kp&i" (3/1), "vlcc tce" (2/1), "한국선급" (3/1)

### Issues found

#### 1. AI tone in early articles — INVESTIGATED, RULED OUT

- **Trigger**: Online guidance suggested "early articles may contain AI tone signals"
- **Method**: Direct read of 4 early articles via fairwayeta monitor API
  1. `shadow-fleet-dark-fleet-2026-korea-5-touchpoints-guide` — 그림자 함대
  2. `classification-society-iacs-12-korean-register-kr-guide` — 선급 Class:KR
  3. `ice-class-explained-1a-super-pc6-arc7-korea-guide` — 빙급
  4. `ship-tonnage-gt-nt-dwt-displacement-korea-guide` — 톤수
  - 5th (Vetting) — slug mismatch, not fetched
- **Findings**:
  - NO AI tone signals in any of 4 articles
  - Strong human editorial voice — specific anchors (Marinera호, 나무호, Seawise Giant호)
  - Effective analogies (자격증 vs 면접, 겨울 타이어 등급, 커피숍 A1 어원)
  - Signature closing sentences ("무엇의 20만 톤인가요?")
  - Translation-style patterns (5 triggers per guidelines [15]): ZERO instances found
- **Conclusion**: AI tone is NOT the rejection cause. Same conclusion as fairwayeta diagnosis.

#### 2. Root cause diagnosis (same as fairwayeta) — CONFIRMED

Based on cross-analysis with fairwayeta rejection findings:

**Primary cause: E-E-A-T (Author identity) gap**
- Article byline shows "Faircastor" (WordPress username) — not a real editorial identity
- Google crawler perceives site as "anonymous"
- No author credentials visible on individual post pages
- About page mentions "marine engineers" but persona doesn't propagate to article level

**Secondary cause: Site age**
- faircast.kr content started ~2026-04 (~3 months)
- AdSense standard: 3–6 month track record recommended
- fairwayeta (4 months) also rejected — likely same threshold

**Tertiary cause: Google Search Console cache lag**
- About page still shows old title "World Cup 2026 Prediction Engine" in Search Console "내 콘텐츠"
- Actual HTML `<title>` verified correct: `<title>About – Faircast</title>` (via DevTools)
- Wordfence blocking web_fetch on faircast.kr — verified via monitor API workaround
- Cache expected to auto-refresh; no action required beyond initial re-index request (already done 6/26)

#### 3. Monitor API 401 (fairwayeta.com/api/faircast-monitor) — DIAGNOSED, PENDING FIX

- **Symptom**: web_fetch to monitor API returns 401 despite correct key `fcmonitor071820!`
- **Investigation**:
  - Vercel environment variable `FAIRCAST_MONITOR_KEY` NOT registered
  - Route handler fallback active: `process.env.FAIRCAST_MONITOR_KEY || 'fcmonitor071820!'`
  - Local `node` execution successful (5 articles fetched to `초창기5편.txt`)
  - web_fetch specifically fails
- **Likely cause**: URL encoding of `!` character OR Vercel Firewall/bot protection
- **Pending fix (Cursor order)**:
  ```
  파일: src/app/api/faircast-monitor/route.ts + post/[slug]/route.ts
  기존 코드:
    const key = searchParams.get('key');
    if (key !== SECRET_KEY) { return 401 }
  변경 코드:
    const rawKey = searchParams.get('key') || '';
    const receivedKey = decodeURIComponent(rawKey).trim();
    const expectedKey = SECRET_KEY.trim();
    if (receivedKey !== expectedKey) {
      return 401 with debug: { receivedLength, expectedLength, receivedFirst4, expectedFirst4, receivedLast2, expectedLast2, userAgent }
    }
  ```
- **Status**: Order drafted, not yet executed. Deferred until AdSense decision.

### Byline system — PREPARED, NOT YET DEPLOYED

**Decision (2026-07-04)**:
- Change WordPress display name from "Faircastor" → "Faircast 편집팀"
- Single unified byline (not per-persona desk split) — simpler, sufficient for E-E-A-T
- Applies to all 63+ articles simultaneously (WP display name is per-user)

**Implementation steps**:
1. WordPress admin → 사용자 → 프로필
2. 성: `편집팀`, 이름: `Faircast`, 닉네임: `Faircast 편집팀`
3. 공개적으로 표시할 이름 dropdown → `Faircast 편집팀` 선택
4. Save profile

**Verification pending**:
- Confirm byline visibly appears on individual post pages (Kadence theme setting)
- If not visible, need Kadence author meta enable OR CSS override
- Post-Kadence check: consider `/authors/faircast-editorial` schema.org Person page

**Status**: User to execute WordPress admin change.

### About page cache issue — TIME-BASED, NO ACTION NEEDED

- Google cache shows old title "World Cup 2026 Prediction Engine" in Search Console
- Actual page HTML verified: title correct, meta description correct
- Re-index requested 2026-06-26; second request within 48h would be counterproductive
- Google auto-refreshes low-priority pages slowly; no manual action available
- **AdSense reviewer sees actual HTML, not Google cache** — this should not affect review

### Items confirmed OK (unchanged from 2026-06-26 audit)

| Item | Status |
|------|--------|
| ads.txt | ✅ |
| robots.txt | ✅ |
| Search engine visibility | ✅ |
| Privacy / Terms / About | ✅ |
| Contact | ✅ hello@fairtech.kr |
| HTTPS | ✅ 49 pages (up from 44) |
| GA4 | ✅ G-ETQ9ZF78CF |
| Homepage | ✅ 3-card layout |
| Footer | ✅ |
| WPCode snippets (14 total, 13 active) | ✅ |

### 404 validation status — STILL "시작됨"

- 19 legacy World Cup URLs, WPCode 406 redirect handling correctly
- Google validation started 2026-06-18, now 16 days elapsed, still "시작됨"
- Redirect verified working (browser test: `/bracket` → home 301)
- Typical Google validation: 2–4 weeks
- **No action needed** — this is Google-side processing time

### Content published 2026-06-26 → 2026-07-04

No new posts published during this window (AdSense review consideration).

Draft articles held for post-decision publication:
- PMS/AI 예측정비 (v6, 5,628자, K-Junior Pro)
- 바이오매스 펠릿 (5,260자, K-Junior Pro)

---

## Next Steps (as of 2026-07-04)

### If AdSense approved (scenario A, ~30% probability)
1. Publish held drafts (PMS, 바이오매스) at 3–5 day intervals
2. Continue normal publishing cadence
3. Change byline to "Faircast 편집팀" (still recommended for long-term E-E-A-T)
4. Submit fairwayeta.com AdSense re-application with byline system in place

### If AdSense rejected (scenario B, ~70% probability)
Priority queue:

1. **Byline system deployment** (immediate)
   - WordPress display name change (2 min)
   - Kadence author meta verification
   - Optional: `/authors/faircast-editorial` page with schema.org Person markup

2. **Wait 2 weeks minimum** before re-submitting
   - 4th consecutive rejection risks account flag
   - Time allows site age to accumulate (currently ~3 months, target 4+ months)

3. **During wait period**:
   - Publish 5–8 additional articles at normal cadence (site activity signal)
   - Improve About page with clearer author credentials
   - Consider adding schema.org markup site-wide via WPCode snippet

4. **Before re-submission**:
   - Verify byline appears on all article pages
   - Verify no new 404s introduced
   - Verify Search Console shows updated About page title (cache should refresh by then)
   - Re-submit with note: "Site now 4+ months, editorial byline system implemented, 40+ articles indexed"

### Deferred (not urgent)
- Monitor API 401 root fix (Cursor order drafted, not deployed)
- Mokpo/Jeju port guides (content pipeline)
- TD3C Korean explainer
- About page hero panel redesign

---

## Traffic Trends Analysis (2026-06-13 to 2026-07-04)

| Date | Users (7d) | Sessions | Search Clicks | Impressions |
|------|-----------|----------|---------------|-------------|
| 2026-06-26 | 67 | 65 | 23 | 671 |
| 2026-06-28 | 57 | 34 | 28 | 954 |
| 2026-07-01 | 37 | 34 | 30 | 1,080 |
| 2026-07-04 | 27 | 22 | 33 | 1,200 |

**Interpretation**:
- **GA4 user count declining** — likely AI Assistant traffic variance (ChatGPT dropped to 0 in latest window)
- **Search Console growing** — SEO establishing (impressions +79% over 3 weeks)
- **Divergence is normal** — SEO growth is the sustainable signal, AI traffic fluctuates

---

## Estimated Revenue (if approved)

Based on current traffic:
- Monthly PV: ~4,000–5,000 (current), ~15,000 (6-month projection), ~30,000 (1-year)
- Korean content RPM: $3–5 (industry vertical)
- **Current-state revenue**: ~$13–14/month (약 18,000원)
- **6-month projection**: ~$60/month (약 84,000원)
- **1-year projection**: ~$150/month (약 210,000원)

**Reality check**: Korean AdSense alone won't be primary revenue. Real revenue paths:
1. fairwayeta.com AdSense (5–10× Korean RPM) — pending approval
2. B2B consulting/reports (industry credibility once content depth established)
3. Newsletter (paid subscription for maritime industry professionals)

---

## Session Handoff Notes

**For the next Claude session**:

1. **Read files first**:
   - `AUTHORS-v3_faircast_260628.txt` (personas)
   - `project-guidelines-v6_faircast_260628.txt` (workflow rules)
   - This log (adsense-approval-log-v2-260704.md)

2. **Current AdSense state**: faircast.kr under review since 2026-06-28, decision expected within 1–4 weeks

3. **Byline change status**: User to execute WordPress display name change (Faircastor → Faircast 편집팀)

4. **Content pipeline**: 2 drafts held (PMS, 바이오매스), publication paused until AdSense decision

5. **Do NOT re-submit AdSense** if 4th rejection risk exists — 2-week minimum wait

6. **Monitor API 401** — root fix pending, not blocking

---

## File Inventory (2026-07-04)

| File | Location | Purpose |
|------|----------|---------|
| project-guidelines-v6 | `/mnt/user-data/outputs/project-guidelines-v6_faircast_260628.txt` | Workflow rules |
| AUTHORS-v3 (personas) | `/mnt/user-data/outputs/AUTHORS-v3_faircast_260628.txt` | Persona definitions |
| PMS Korean v6 HTML | `/mnt/user-data/outputs/pms-ai-maintenance-korea-final-v6.html` | Ready to publish |
| Biomass Korean HTML | `/mnt/user-data/outputs/biomass-pellets-korea-final.html` | Ready to publish |
| Previous log | `docs/adsense-approval-log.md` (2026-06-26) | Historical |
| This log | `docs/adsense-approval-log-v2-260704.md` | Current |
| Workflow handoff | `docs/workflow-handoff-260704.txt` | Next-session guide |
| Monitor API config | `pages/hello-korea/config.json` | key: fcmonitor071820! |
| Route handler source | `src/app/api/faircast-monitor/route.ts` (fairwayeta) | For 401 fix |

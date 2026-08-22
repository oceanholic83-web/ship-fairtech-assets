# 오더 — 죽은 내부 링크 일괄 교체 (2026-08-22)

실측: 내부 링크 225개 중 **깨진 대상 17개 / 참조 42건.**
도구는 **Better Search Replace** (워드프레스 플러그인). 61편을 손으로 열 필요 없다.

---

## 0. 실행 전

- 워드프레스 관리자 → 도구 → Better Search Replace
- **Select tables: `wp_posts` 만 체크**
- **Run as dry run 먼저 체크하고 1회 실행** → 예상 건수 확인 후 해제하고 재실행
- ⚠️ **앞뒤 슬래시를 반드시 포함한다.** 빼면 `/ice-class-explained/` 가 `/ice-class-explained-1a-super-pc6-arc7-korea-guide/` 안까지 잡아먹는다

---

## 1. 치환 14쌍

| # | Search for | Replace with | 참조 |
|---|---|---|---|
| 1 | `/bdi-scfi-ws-three-shipping-indices-explained/` | `/shipping-freight-index-bdi-scfi-ws-guide/` | 1 |
| 2 | `/busan-port-transhipment-hub-30-years/` | `/busan-port-transshipment-hub-30-year-strategy/` | 1 |
| 3 | `/charter-party-voyage-time-bareboat-hanjin-explained-2026/` | `/hanjin-shipping-charter-party-korea-2026/` | 2 |
| 4 | `/charter-rate-vs-freight-rate-difference-explained/` | `/charter-rate-freight-rate-shipping-business-guide/` | 1 |
| 5 | `/classification-society-kr-dnv-korea-explained/` | `/classification-society-iacs-12-korean-register-kr-guide/` | 1 |
| 6 | `/what-is-class-society-explained-korea-2026/` | `/classification-society-iacs-12-korean-register-kr-guide/` | 1 |
| 7 | `/eu-ets-shipping-korea-five-things/` | `/eu-ets-shipping-2026-korea-exporters-impact-guide/` | 4 |
| 8 | `/ice-class-explained/` | `/ice-class-explained-1a-super-pc6-arc7-korea-guide/` | 1 |
| 9 | `/psc-port-state-control-korea-explained/` | `/psc-port-state-control-korea-4-stage-inspection/` | 1 |
| 10 | `/tanker-sizes-vlcc-suezmax-aframax-handbook/` | `/tanker-sizes-aframax-suezmax-vlcc-korea-guide/` | 1 |
| 11 | `/ulsan-port-energy-gateway-korea-guide/` | `/ulsan-port-petroleum-hub-future-clean-fuel-korea-guide/` | 1 |
| 12 | `/vlcc-fleet-aging-orderbook-korea-refinery-2026/` | `/vlcc-fleet-900-effective-570-supply-gap-korea-2026/` | 1 |
| 13 | `/worldscale-ws-tanker-freight-rate-explained-2026/` | `/what-is-worldscale-tanker-freight-rate-explained-2026/` | 2 |
| 14 | `/category/port-guide/` | `/port-guide/` | 20 |

**12번 근거:** 링크를 건 글이 TCE 편이고 VLCC 선대 수치를 참조한다. CONTENT_LEDGER 4.6에서 VLCC 시리즈 정본을 **465**로 지정했으므로 283이 아니라 465로 보낸다.

**14번이 가장 크다.** `/category/port-guide/` 는 404가 아니라 **200이지만 `noindex, follow`** 다 (WPCode 529). 20편이 항만 가이드로 가는 동선을 전부 noindex 아카이브로 흘려보내고 있었다. 목적지 `/port-guide/` 는 실재하는 색인 대상 페이지다.

---

## 2. 손으로 처리할 것 1건

`/fueleu-maritime-first-cycle-complete-korea-2026/` — **대응하는 글이 없다.** 발행 예정이었다가 안 쓴 글로 보인다.

- 걸린 곳: `ship-repair-geography-korea-dry-dock-2026` (post 599) 관련 글 박스
- 처리: 링크 삭제, 또는 `/uk-ets-first-week-market-silence-korea-2026/` 로 교체
- 판단은 대표가

---

## 3. 홈페이지 카드 3개 (별건)

홈이 같은 목적지를 두 경로로 가리키고 있고 그중 하나가 301이다.

| 홈 카드 | 현재 | 바꿀 것 |
|---|---|---|
| Hello, Korea | `/category/insights/hello-korea/` → 301 | `/hello-korea-page/` |
| Hello, World | `/category/insights/hello-world/` → 301 | `/hello-world-page/` |
| 항만 가이드 | `/category/port-guide/` (noindex) | `/port-guide/` |

원본은 `pages/homepage/template.html`. **손편집 금지 대상**이므로 치환 스크립트로 처리 후 `node build.js` → 워드프레스 붙여넣기.
`insights-landing` 페이지에도 hello-korea / hello-world 카테고리 링크가 3건 있다.

---

## 4. 검증

치환 후 PowerShell.

```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
powershell -ExecutionPolicy Bypass -File scripts\audit-links.ps1
```

**기대값: dead links 42 → 2 이하** (fueleu 1건 + 홈 카드 처리 전이면 category 잔여).
`audit\link-audit.json` 을 다시 넘기면 대조한다.

---

## 5. 하지 말 것

- `wp_posts` 외 테이블 치환 금지
- dry run 건너뛰고 바로 실행 금지
- 앞뒤 슬래시 생략 금지 (8번이 특히 위험)

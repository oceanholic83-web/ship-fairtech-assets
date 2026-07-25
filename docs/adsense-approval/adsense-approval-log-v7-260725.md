# AdSense Approval Log — faircast.kr (v7)

**Last Updated**: 2026-07-25
**Previous log**: adsense-approval-log-v6-260716.md
**Site**: faircast.kr (WordPress 7.0.2, Gabia hosting, Kadence 1.5.1)
**AdSense Publisher ID**: pub-9894725798878226
**Session status**: **근본 원인 미발견.** 역효과 스니펫 1개 제거, 리디렉션 구멍 3개 보완, 상태 모니터링 시스템 구축. 재신청 보류.

---

## Session Summary — 2026-07-25

v6에서 "사이트맵 서브파일 크롤 실패가 진짜 근본 원인"이라고 결론냈으나, 사이트맵 해결 후 10일이 지나도 색인은 34개 그대로였다. 이번 세션은 그 후속 진단이다.

**결과: 근본 원인을 찾지 못했다.** 대신 다음을 확인했다.

- 사이트의 기술 상태는 정상이다 (Search Console 라이브 테스트로 확증)
- 색인된 34개 중 5개가 World Cup 잔재 페이지다
- 6월 중순 이후 발행한 약 15편이 색인 0이다
- **v6에서 내가 지시한 robots.txt 차단(617)이 축구 URL의 색인 제거를 막고 있었다**

그리고 이번 세션에서 Claude가 3회 오진했다. 그 기록을 아래에 남긴다. 같은 실수를 반복하지 않기 위해서다.

---

## Rejection History (변화 없음)

| Date | Site | Status | Reason |
|------|------|--------|--------|
| ~2026-06-22 | faircast.kr | Rejected | 가치가 별로 없는 콘텐츠 |
| 2026-07-01 | fairwayeta.com | Rejected (3rd) | 가치가 별로 없는 콘텐츠 |
| **2026-07-10 12:41 KST** | **faircast.kr** | **Rejected** | 가치가 별로 없는 콘텐츠 |
| 2026-07-13 | fairwayeta.com | Re-submitted | (별도 대화창 관리) |

계정 총 4회 거절. **2026-07-25 현재 재신청 안 함.**

---

## ⚠️ 이번 세션 Claude 오진 3건 — 반드시 읽을 것

### 오진 1: "meta description CSS 오염이 재발했다"

- **주장 근거**: `web_fetch`로 홈페이지를 가져오니 meta description이 CSS 코드였다
- **실제**: 정상이었다. `web_fetch` 도구가 **오래된 캐시**를 반환했다
- **증거**: 같은 도구가 `/category/port-guide/`를 가져왔을 때 title이 "Ship Fairtech"였다. 리브랜딩 전 이름. 몇 달 된 스냅샷이다
- **여파**: 홈·Hello Korea·항만가이드 3개 페이지를 "오염됐다"고 잘못 보고했고, 사용자가 불필요하게 확인 작업을 했다

### 오진 2: "378번 스니펫이 비활성 상태다"

- **주장 근거**: 하드코딩이 있는데 CSS가 나오니 스니펫이 꺼졌을 것이다. PHP 8에서 `$post->ID` null 접근으로 Fatal error → WPCode 자동 비활성화 시나리오를 제시
- **실제**: 378은 계속 활성이었다. 비활성 2개는 201과 67이었다

### 오진 3: "관리자 로그인 상태와 익명 접근에서 사이트가 다르게 보인다"

- **주장 근거**: 사용자 view-source는 정상, Claude fetch는 CSS
- **실제**: 그런 차이는 없었다. 오진 1의 파생이다
- **여파**: WPCode 테스트 모드 확인, 가비아 캐시 조사 등 불필요한 작업 유발

### 교훈 — 검증 도구 신뢰도 순위

| 순위 | 도구 | 신뢰도 |
|---|---|---|
| 1 | **Search Console 「실제 URL 테스트」** | 절대 기준. Googlebot 실시간 렌더링 |
| 2 | 브라우저 시크릿 창 view-source | 로그인 상태 반드시 확인할 것 |
| 3 | `scripts/site-monitor.js` | 캐시 가능성 있음. CRITICAL은 1번으로 교차 확인 |
| 4 | Claude `web_fetch` | **단독 근거로 쓰지 말 것.** 장기 캐시됨 |

**앞으로 사이트 상태 판정은 Search Console 라이브 테스트로만 확정한다.**

---

## 🔴 v6 지시사항의 역효과 — 617 스니펫

### 무슨 일이 있었나

2026-07-15(v6 세션)에 Claude가 다음 오더를 지시했다:

```php
// 617 robots.txt - World Cup 크롤 차단
Disallow: /match/
Disallow: /simulate/
Disallow: /insights/
Disallow: /matchup
...
```

의도: World Cup 잔재 URL이 크롤되는 것을 막아 사이트 정체성 신호를 정리한다.

### 왜 역효과였나

```
기존:  /match/xxx → 406 스니펫이 301 → 홈
       Googlebot 크롤 → 301 확인 → 색인에서 제거

617 적용 후:
       robots.txt가 /match/ 크롤을 차단
       Googlebot이 301을 볼 수 없음
       → 색인에 영구 잔존
```

**크롤이 차단된 URL은 색인에서 제거되지 않는다.** Google이 "이 URL은 이제 리디렉션됩니다"를 확인할 방법이 사라지기 때문이다. robots.txt 차단은 *신규 색인*은 막지만 *기존 색인*은 고착시킨다.

617은 2026-07-15부터 2026-07-25까지 **10일간 활성** 상태였다.

### 조치

- 617 **비활성화** (2026-07-25)
- robots.txt에서 World Cup Disallow 제거 확인
- 향후 재활성화 금지. `monitor/expected-state.json`에 `mustNotContain`으로 명시

---

## 색인된 34개 페이지 전수 분석

Search Console 「색인 생성됨」 목록 전체를 분류한 결과:

| 분류 | 개수 | 비고 |
|---|---|---|
| 실제 발행글 | **21** | 전부 5월~6월 초 발행분 |
| 사이트 페이지 | 4 | `/`, `/privacy/`, `/about`, `/privacy` |
| 카테고리·페이지네이션 | 4 | `/category/insights/`, `/page/3/` 등 |
| **World Cup 잔재** | **5** | 아래 참조 |

### 색인에 남아 있는 World Cup URL 5개

```
/match/france-vs-senegal                                (최종 크롤 5.18)
/match/argentina-vs-austria                             (5.18)
/simulate                                               (5.3)
/insights/mbappe-injury-scare-world-cup-2026-france     (5.2)  ← 음바페 부상 기사
/matchup                                                (4.21)
```

**색인된 사이트의 15%가 축구 콘텐츠다.** AdSense 정책의 *Niche mismatch(사이트 주력과 무관한 콘텐츠)* 에 직접 해당한다. 심사봇이 faircast.kr의 색인 footprint를 보면 "해운 분석 매체 + 음바페 부상 뉴스"로 인식된다.

### 중복 색인

`/about` 과 `/privacy` 가 **슬래시 없는 형태로도 색인**되어 있다 (`/privacy/`와 별도). 359 스니펫이 www/http는 처리하지만 trailing slash는 처리하지 않는다.

---

## 🔴 6월 중순 이후 발행글 색인 0

색인된 발행글 21편은 전부 5월~6월 초 발행분이다. 6월 중순 이후 발행한 약 15편 중 색인된 것은 PMS 한 편뿐이다.

**색인 안 된 발행글:**

```
마산항(6/16) · 그림자함대1300(6/18) · Vetting(6/20) · 호르무즈OS(6/21)
VLCC900(6/22) · 보험3종(6/23) · charterparty(6/24) · 한진8년영문(6/24)
UK ETS(6/26) · VLSFO(6/26) · 바이오매스(7/4) · UK ETS첫주(7/5)
목포항(7/7) · 수리조선(7/13) · 규격의경계(7/16)
```

### 색인 추이

| 시점 | 색인 생성됨 | 색인 안 됨 |
|---|---|---|
| 2026-06-05 | **54** | 37 |
| 2026-07-25 | **34** | 112 |

**7주간 20개 감소.** 옛 글은 빠지고 새 글은 안 들어오는 상태다.

### 시점 상관관계 (인과 미확정)

WPCode 스니펫 생성일:

| 날짜 | 스니펫 |
|---|---|
| 6/14 | 358 Tag Noindex, 359 non-www, 361 Exclude Tags |
| 6/16 | 378 Meta Description |
| 6/18 | 406 World Cup Redirects |
| 6/24 | 494 Category→Page 301, 529 Category Noindex |

**6/14~6/24에 스니펫 7개가 집중 투입됐고, 그 시점부터 신규 발행글 색인이 멈췄다.** 다만 이것이 인과인지 우연인지 **이번 세션에서 확정하지 못했다.**

### 구조적 관찰

494(카테고리 1·8 → 페이지 301) + 529(나머지 카테고리 noindex) 조합의 결과:

| 허브 | 상태 | 색인 |
|---|---|---|
| `/` 홈 | 정상 | ✅ |
| `/hello-korea-page/` | 정상 | ❌ |
| `/hello-world-page/` | 정상 | ❌ |
| `/port-guide/` | 정상 | ❌ |
| `/category/insights/hello-korea/` | 301 → 페이지 | — |
| `/category/port-guide/` | noindex | ❌ |

**발행글로 연결되는 색인된 허브가 홈페이지 하나뿐이다.** 홈페이지 섹션 카드 3개는 전부 301 또는 noindex 목적지를 가리킨다.

이것이 신규 글 색인 정지의 원인인지는 미확정. 다만 개선 가치는 명확하다.

---

## ⛔ 201 스니펫 — AdSense 정책 위반 소지

```javascript
if (
  (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
  (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||   // 소스 보기 차단
  e.key === 'F12'                                       // 개발자 도구 차단
) { e.preventDefault(); }
```

Google Publisher Policies의 **Abusive experiences**(사용자가 원하는 동작을 방해하는 경험)에 해당한다. 심사관이 사이트를 검사하려는 행위 자체를 막으므로 리뷰 관점에서 특히 불리하다.

- 2026-06-05 생성
- **현재 비활성** (언제부터 비활성인지 기록 없음)
- **4회 거절 중 몇 번이 이 스니펫 활성 상태에서 이루어졌는지 확인 불가**

**절대 재활성화 금지.** `monitor/expected-state.json`에 `expect: "inactive"`로 고정했다.

wp-custom-css의 `user-select: none` 블록도 같은 계열이므로 제거 대상.

---

## 조치 내역 (2026-07-25)

### 완료

| 대상 | 작업 | 검증 |
|---|---|---|
| **617** | 비활성화 | robots.txt에서 World Cup Disallow 제거 확인 ✅ |
| **406** | 전면 교체 | `/matchup`·`/simulate`·`/insights/mbappe-*` → 홈 301 확인 ✅ |
| **378** | 전면 교체 | `$post` null 가드, style/script 블록 제거, CSS 잔재 검사 |
| 색인 요청 | Search Console | `/hello-korea-page/`, `/hello-world-page/`, `/port-guide/` 외 |

### 406 교체 사유

구버전이 잡지 못하던 패턴:

| 색인된 URL | 구버전 |
|---|---|
| `/simulate` | ❌ 슬래시 없어 미포착 |
| `/insights/mbappe-...` | ❌ mbappe 패턴 없음 |
| `/matchup` | ❌ 패턴 자체 없음 |

신버전은 슬래시 유무 모두 처리하고 `/insights/` 하위 전체를 홈으로 보낸다. (우리 카테고리는 `/category/insights/`라 충돌 없음)

전체 코드는 `docs/wpcode-snippets-260725.md` 참조.

---

## 신규 자산 2개

### 1. `docs/wpcode-snippets-260725.md`

WPCode 스니펫 18개 전체 인수인계 문서. 복붙 가능한 최신 코드 + 상태 + 주의사항.

**포함된 함정 기록:**
- 378 코드의 `chr(60)` / `'scr' . 'ipt'` 분할은 **Wordfence WAF 회피용**. 원래대로 되돌리면 저장 시 403
- 617·201은 절대 켜지 말 것
- 494 이름이 「제목 없는 스니펫」이라 정체불명으로 오해받음. 이름 변경 필요

### 2. `monitor/expected-state.json` + `scripts/site-monitor.js`

사이트 상태 자동 검증 시스템. **읽기 전용, 무위험.**

**핵심 기능 — 스니펫 상태 외부 탐지:**

WPCode 스니펫은 DB에 있어 스크립트가 직접 못 읽는다. 대신 **출력 흔적으로 역추적**한다.

| 스니펫 | 탐지 방법 |
|---|---|
| 378 | 홈 meta description이 한글 문장인가 |
| 574/575 | JSON-LD 존재 여부 |
| 617 | robots.txt에 `Disallow: /match/`가 있는가 |
| 406 | `/matchup`이 홈으로 301인가 |
| 201 | HTML에 `contextmenu` 차단 코드가 있는가 |

**617 사고가 이 시스템이 있었으면 7/15 당일에 잡혔다.**

**첫 실행 결과 (2026-07-25):**

| 판정 | 개수 |
|---|---|
| 🔴 CRITICAL | 1 |
| 🟡 경고 | 1 |
| ✅ 정상 | 66 |

- CRITICAL: `/category/port-guide/`에 noindex 없음 (529 미적용 의심) — **미확정.** Search Console 라이브 테스트로 교차 확인 필요
- 경고: 키 페이지에 `user-select: none` 발견
- World Cup 10개 → 전부 홈 301 ✅

**실행:**
```powershell
node scripts/site-monitor.js          # 전체 (2-3분)
node scripts/site-monitor.js --quick  # 핵심만 (6초)
```

CRITICAL 발생 시 exit code 1.

---

## 스니펫 쓰기 자동화 — 검토 후 기각

사용자 문의: Cursor 오더로 스니펫 업데이트를 자동화할 수 있는가.

**결론: 하지 않는다.**

| 이유 | 내용 |
|---|---|
| Wordfence | 코드 페이로드 POST는 WAF가 차단. 관리자 수동 저장도 403 걸린 전례 |
| 리스크 | 잘못된 자동 쓰기 = 사이트 다운 |
| 빈도 | 스니펫은 월 1~2회 변경. 자동화 이익 낮음 |
| 접근 경로 | WPCode Lite는 REST 미노출. 가비아 웹호스팅 SSH 제한적 |

**대안: 문서 + git 버전 관리 + 모니터 검증.**
문서와 실제가 어긋나면 `site-monitor.js`가 잡으므로 쓰기 자동화 없이도 루프가 닫힌다.

---

## AdSense 정책 재조사 결과

복수 독립 출처가 일관되게 지적하는 것:

- **"가치가 별로 없는 콘텐츠"는 콘텐츠 품질 판정이 아니라 신규 사이트에 대한 포괄적 거절 코드다**
- 사이트 연령이 콘텐츠 품질보다 크게 작용한다. 3~6개월의 일관된 활동 이력을 본다
- 공식 최소 트래픽 요건은 없으나, 실제 트래픽이 "가치 제공"의 증거로 작용한다
- 이전 용도가 다른 도메인은 정리 기간과 개선 증빙이 필요할 수 있다

**faircast.kr 대입:**

| 항목 | 상태 |
|---|---|
| 해운 매체로서의 연령 | 약 4개월 |
| 도메인 이력 | World Cup 예측 사이트 (색인에 5개 잔존) |
| 실제 한국 독자 | 주 3명 수준 |
| Search Console 클릭 | 20회 / 28일 (7/21 34회에서 하락) |
| 계정 거절 이력 | 4회 |

기술 결함이 아니라 **신뢰 신호 축적 부족**이 주 요인일 가능성이 높다. 다만 이번 세션에서 확정하지 못했다.

---

## 미해결 질문

1. **6월 중순 이후 신규 발행글이 색인되지 않는 원인은?**
   - 후보 A: 스니펫 7개 집중 투입 (시점 일치, 인과 미확정)
   - 후보 B: 색인된 허브가 홈 하나뿐인 구조
   - 후보 C: 사이트 신뢰도·크롤 예산 (기술 문제 아님)

2. **`/category/port-guide/`에 529가 실제로 적용되는가?**
   - 모니터는 미적용으로 보고. 미확정
   - 다만 정책상 「페이지 색인 / 아카이브 noindex」가 맞으므로 529 유지가 옳다

3. **201이 4회 거절 중 몇 번에 활성이었는가?** 기록 없음. 확인 불가

---

## 다음 점검 — 2026-08-15 전후

### 확인 지표

| 지표 | 2026-07-25 | 목표 |
|---|---|---|
| 색인된 페이지 | 34 | 50+ |
| 색인 내 World Cup URL | 5 | 0 |
| 6월 중순 이후 발행글 색인 | 1 / 16 | 8+ |
| Search Console 클릭 (28일) | 20 | 50+ |

### 판단 분기

**지표가 움직이면** → 617·406 조치가 효과. 재신청 검토

**셋 다 안 움직이면** → 원인은 기술이 아니라 **사이트 연령·트래픽·도메인 이력**. 기술 작업을 중단하고 AdSense는 자연 대기로 전환. faircall.kr에 집중

### 재신청 금지 조건

위 지표 확인 전까지 재신청하지 않는다. 5번째 거절은 계정에 누적된다.

---

## 남은 과제

| 우선순위 | 내용 |
|---|---|
| 높음 | 575 스니펫에 `$post` null 가드 추가 |
| 높음 | wp-custom-css의 `user-select: none` 블록 제거 |
| 중간 | 홈페이지 섹션 카드 링크 → `/hello-korea-page/` 직접 연결 (301 단계 제거) |
| 중간 | GA4 측정 ID 중복 정리 (`G-3L86TW7BFJ` / `G-ETQ9ZF78CF` 동시 존재) |
| 중간 | 항만 가이드 페이지 재빌드 (목포항 7/7 발행 미반영. "12 ports" 표기인데 9개만 나열) |
| 낮음 | 494 이름 변경 ("Category → Page 301 Redirect") |
| 낮음 | 66 빈 스니펫 삭제 |
| 낮음 | About 페이지 메뉴가 다른 페이지와 다름 (`/category/` 계열 사용, Home 링크 없음) |

---

## 다음 세션 지침

### 먼저 읽을 것

1. `AUTHORS-v3_faircast_260628.txt` (페르소나)
2. `project-guidelines-v7_faircast_260705.txt`
3. `docs/wpcode-snippets-260725.md` (스니펫 현황)
4. 이 로그 (v7)

### 세션 시작 시 실행

```powershell
node scripts/site-monitor.js
```

기대 상태와 실제가 어긋난 항목부터 확인한다.

### 금지

- **Claude `web_fetch` 결과를 단독 근거로 판정하지 말 것.** 장기 캐시됨
- 사이트 상태 확정은 **Search Console 라이브 URL 테스트**로만
- 재신청은 위 지표 충족 전까지 금지
- robots.txt에 World Cup Disallow 재추가 금지
- 201 스니펫 활성화 금지

### 진단 태도

v3부터 v6까지 매 세션이 "결정적 세션 / 진짜 근본 원인 발견"을 선언했고, 다음 세션이 그것을 뒤집었다.

| 로그 | 선언한 근본 원인 | 이후 판정 |
|---|---|---|
| v5 | meta description CSS 오염 | 부분적. 근본 아님 |
| v6 | 사이트맵 서브파일 크롤 실패 | 해결 후에도 색인 변화 없음 |
| v7 | **선언하지 않음** | — |

**이번 로그는 근본 원인을 선언하지 않는다.** 확정된 사실과 미확정 가설을 분리해 기록했다. 다음 세션도 같은 원칙을 유지할 것.

---

## v6 → v7 변경 요약

| 항목 | v6 (07-16) | v7 (07-25) |
|---|---|---|
| 617 robots.txt 차단 | 신규 생성 (활성) | **비활성화** (역효과 확인) |
| 406 World Cup 301 | 구버전 (구멍 3개) | **전면 교체** |
| 378 Meta Description | 하드코딩 버전 | **null 가드·CSS 필터 추가** |
| 색인된 페이지 | 34 | 34 (변화 없음) |
| 색인 내 축구 URL | 미파악 | **5개 확인** |
| 상태 모니터링 | 없음 | **site-monitor.js 구축** |
| 스니펫 문서 | 없음 | **wpcode-snippets-260725.md** |
| 근본 원인 | 사이트맵 (선언) | **미발견 (선언 안 함)** |
| AdSense 재신청 | 대기 | 대기 (8월 중순 재검토) |

---

**End of v7 log.**

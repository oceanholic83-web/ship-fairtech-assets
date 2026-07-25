# Order: site-monitor v2 — fairwayeta API 연동 + 전수 검사

**목표**: 기존 `site-monitor.js`에 fairwayeta monitor API를 연동하고, 발행글 61편 전체를 검사하도록 확장한다. 결과는 **Claude에게 붙여넣기 좋은 압축 리포트**로 출력한다.

**배경**:
- 현재 v1은 핵심 페이지 8개 + 샘플 발행글 1편만 검사한다. 발행글 60편이 사각지대다.
- Wordfence가 외부에서 오는 `faircast.kr/wp-json/` 접근을 차단하므로, 워드프레스 내부 데이터(요약 유무, 발행일, 카테고리)는 직접 얻을 수 없다.
- fairwayeta monitor API가 그 우회 경로다. 2026-07-25 키 교체 완료.

**실행 위치**: `C:\Users\bab5s\Desktop\project\ship-fairtech-assets\`

---

## 설계 원칙 ⭐

**리포트는 전체를 나열하지 않는다. 예외만 드러낸다.**

61편이 전부 정상인 표를 출력하면 읽을 수 없고 붙여넣기도 안 된다. 요약 통계 + 문제 항목만 상세히 적는다. 정상 항목은 개수만 센다.

목표 분량: **A4 2장 이내.**

---

## Step 1: 설정 파일 확장

`monitor/config.local.json` 을 새로 만든다. **반드시 .gitignore 대상이어야 한다.**

```json
{
  "monitorApi": "https://www.fairwayeta.com/api/faircast-monitor",
  "monitorKey": "YOUR_MONITOR_KEY"
}
```

`monitor/config.local.json.example` (커밋 대상):
```json
{
  "monitorApi": "https://www.fairwayeta.com/api/faircast-monitor",
  "monitorKey": "YOUR_MONITOR_KEY"
}
```

`.gitignore`에 `monitor/config.local.json` 추가 (이미 `**/config.local.json` 패턴이 있으면 불필요).

**검증**: `git ls-files | Select-String "monitor/config.local.json"` 이 비어 있어야 한다.

---

## Step 2: API 데이터 수집

```
GET {monitorApi}?key={monitorKey}
```

응답의 `posts` 배열에서 글별로 아래를 추출한다. 실제 필드명은 응답을 확인해 맞춘다.

- `id`, `slug`, `title`
- `excerpt` — **빈 문자열 여부가 핵심**
- `date` (발행일), `modified` (수정일)
- `categories` (ID 배열)
- `status` (publish / private / draft)

**연결 실패 시**: API 없이 직접 fetch만으로 진행하고, 리포트에 "API 미연결 — 워드프레스 내부 데이터 없음"을 명시한다. 스크립트가 죽지 않게 한다.

---

## Step 3: 발행글 전수 라이브 검사

API에서 얻은 글 목록으로 각 글의 실제 URL을 만들어 직접 fetch한다.

- User-Agent: Googlebot
- 헤더: `Cache-Control: no-cache`, `Pragma: no-cache`
- 동시 3개, 요청 간 400ms
- 실패 시 2회 재시도

**글마다 검사할 항목:**

| 항목 | 판정 기준 |
|---|---|
| HTTP 상태 | 200 아니면 🔴 |
| meta description 존재 | 없으면 🔴 |
| meta description CSS 오염 | `/\{[^}]*:[^}]*\}/` 또는 `!important` 또는 `body.page-id` 시작 → 🔴 |
| meta description 길이 | 50자 미만 또는 300자 초과 → 🟡 |
| Article JSON-LD | 없으면 🟡 (575 스니펫 미작동) |
| `datePublished` / `dateModified` | 없으면 🟡 |
| Author Bio 블록 | `ABOUT THE EDITORIAL DESK` 없으면 🟡 (573 미작동) |
| noindex | 있으면 🔴 (발행글은 색인돼야 함) |
| canonical | 없거나 자기 URL과 불일치 → 🟡 |
| 본문 문자 수 | 800자 미만 → 🟡 |
| 내부 링크 수 | 3개 미만 → 🟡 (고아 페이지 위험) |
| 이미지 alt 누락 | 2개 이상 → 🟡 |

**API 데이터와의 교차 검사:**

| 항목 | 판정 |
|---|---|
| `excerpt`가 비어 있음 | 🟡 **요약 누락** — meta description이 본문에서 자동 생성됨 |
| excerpt 비어 있고 + meta description CSS 오염 | 🔴 **확정 원인** |
| 사이트맵에 있는데 API 목록에 없음 | 🟡 불일치 |
| API에 있는데 사이트맵에 없음 | 🟡 불일치 |

> **요약 누락 검사가 이번 확장의 핵심이다.** 2026-07-16 biomass 포스트의 meta description CSS 오염이 정확히 이 원인이었다. 61편 중 어떤 글이 같은 상태인지 한 번에 파악한다.

---

## Step 4: 기존 v1 검사 유지

`expected-state.json` 기반 검사는 그대로 수행한다.
- 핵심 페이지 8개
- World Cup 리디렉션 10개
- 카테고리 리디렉션·noindex
- robots.txt / ads.txt / 사이트맵
- 스니펫 footprint
- 정책 위험 패턴

---

## Step 5: 리포트 출력 — Claude 전달용

`monitor/reports/state-YYYYMMDD.md`

**아래 형식을 정확히 따른다. 정상 항목은 나열하지 않는다.**

```markdown
# faircast.kr 상태 리포트 — YYYY-MM-DD HH:mm

> Googlebot UA | 캐시 무력화 | API 연결: 성공/실패

## 한 줄 요약

발행글 61편 중 N편에 문제. CRITICAL N건, 경고 N건.

## 카운트

| 항목 | 값 |
|---|---|
| 발행글 (API) | 61 |
| 사이트맵 URL | 61 |
| 라이브 검사 성공 | 61 |
| 200 OK | 61 |
| meta description 정상 | 59 |
| **요약(excerpt) 비어 있음** | **N** |
| Article 스키마 있음 | 61 |
| Author Bio 있음 | 61 |
| 본문 1500자 이상 | 58 |
| 내부 링크 3개 미만 | N |

## 🔴 CRITICAL

### [항목명]
- 대상: URL 또는 스니펫명
- 기대: ...
- 실제: ...
- 의미: (왜 문제인지 한 줄)

## 🟡 경고

(동일 형식. 같은 유형은 묶어서 목록으로)

### 요약(excerpt) 누락 — N편
```
slug-1
slug-2
...
```
→ meta description이 본문에서 자동 생성됨. 378 스니펫이 CSS는 걸러내지만, 요약을 넣는 편이 검색 노출에 유리.

## 인프라 상태

| 항목 | 상태 |
|---|---|
| robots.txt | World Cup 차단 없음 ✅ / 있음 🔴 |
| ads.txt | 정상 ✅ |
| 사이트맵 3개 | 61 / 8 / 3 |
| World Cup 리디렉션 10개 | 전부 301 ✅ |

## 스니펫 상태 (외부 탐지)

| 스니펫 | 기대 | 실제 |
|---|---|---|
| 378 meta description | active | active ✅ |
| 617 robots 차단 | inactive | inactive ✅ |
| 201 우클릭 차단 | inactive | inactive ✅ |
| ... | | |

## 수동 확인 필요

- Search Console 색인 수 (API 미연동)
- Search Console 클릭·노출
- AdSense 심사 상태
```

**동시에 `monitor/reports/state-YYYYMMDD.json`에 전체 원본 데이터를 저장한다.** 리포트에서 생략된 정상 항목도 여기엔 다 들어간다.

---

## Step 6: 실행 모드

```powershell
node scripts/site-monitor.js            # 전체 (발행글 61편 포함, 4-5분)
node scripts/site-monitor.js --quick    # 인프라만 (10초)
node scripts/site-monitor.js --posts    # 발행글만
```

기존 `--quick` 동작은 유지한다.

## Step 7: 종료 코드

- CRITICAL 0 → `exit(0)`
- CRITICAL 1+ → `exit(1)`

---

## 완료 확인

- [ ] `monitor/config.local.json` 생성, git 미추적 확인
- [ ] `monitor/config.local.json.example` 생성, git 추적
- [ ] API 연결 성공, posts 61개 수신
- [ ] 발행글 61편 라이브 검사 완료
- [ ] 요약 누락 글 목록 출력
- [ ] 리포트가 A4 2장 이내
- [ ] `--quick` 모드 정상
- [ ] JSON 원본 저장

## Commit

```powershell
git add .gitignore monitor/ scripts/
git commit -m "feat: monitor v2 with fairwayeta API and full post audit"
git push
```

> heredoc(`$(cat <<'EOF'`)은 PowerShell에서 파싱 오류. `-m` 한 줄로 쓸 것.

---

## 주의사항

1. **읽기 전용이다.** 사이트에 아무것도 쓰지 않는다.
2. **API 키를 리포트나 로그에 출력하지 말 것.** 리포트는 Claude에게 붙여넣는 문서다.
3. **결과를 100% 신뢰하지 말 것.** HTTP 클라이언트도 캐시를 탈 수 있다. CRITICAL은 Search Console 「실제 URL 테스트」로 교차 확인한다.
4. Wordfence가 반복 요청을 차단할 수 있다. 400ms 딜레이를 줄이지 말 것.
5. fairwayeta API 호출은 61회가 아니라 **1회**다 (전체 목록을 한 번에 받는다). 개별 글 상세가 필요하면 `&mode=post&slug=` 를 쓰되, 남용하지 말 것.

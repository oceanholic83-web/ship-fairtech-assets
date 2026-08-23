# 자동화 정책 — 무엇을 자동으로 하고, 무엇을 막는가

2026-08-23 신설. 워드프레스 직접 쓰기가 열리면서 만든 문서다.

기존에는 사람이 복붙하는 구간이 사실상 속도 제한 장치였다. 그게 사라졌다.
**이 문서는 없어진 제동 장치를 규칙으로 다시 채우는 것이 목적이다.**

관련: `docs/PORTING_POLICY.md`(이식 규칙) · `docs/NAMING_POLICY.md`(표기) · `claude/PORT_MAP.tsv`(이식 원장)

---

## 1. 자동화 범위

### 자동으로 한다

| 구간 | 방식 |
|---|---|
| 조사 · 초안 작성 | web search + 1차 출처 확인 |
| 워드프레스 **비공개 초안** 등록 | REST `POST /wp/v2/posts` |
| 메타 7종 입력 | 제목 · slug · 카테고리 · 태그 · 요약 · FIFU URL · FIFU alt 를 같은 요청에 |
| 영문판 이미지 재활용 | `ship-eta-calculator/public/images/insights` → `faircast-images/img/` → 새 태그 |
| 도식 이식 | 영문판 CSS 차트 → 지침 [8] 다크박스로 재작성 / 인라인 SVG는 라벨만 한글화 |
| 발행 후 검증 | 라이브 HTTP 로 og:image · 메타 설명 · 이미지 URL · 상태 코드 |
| 랜딩 페이지 반영 | **자동.** 숏코드가 실시간 조회하므로 별도 작업 없음 |
| 시리즈 상호 링크 | 같은 시리즈 글 본문에 관련 글 박스 추가 |
| 원장 갱신 | `PORT_MAP.tsv` DONE + fc_slug 기록 |

### 사람만 한다

- **주제 결정**
- **새 이미지 생성** (영문판에 없는 경우)
- **공개 승인** — 초안을 공개로 바꾸는 것은 언제나 사람의 지시

### 절대 자동으로 하지 않는다

- 공개 발행 (초안까지만)
- 글 삭제 · 영구 삭제
- 카테고리 · 태그 구조 변경
- 플러그인 설치 · 설정 변경
- Wordfence 「이 동작 허용」

---

## 2. 구글 정책 리스크 점검

### 근거 문서

- Google 검색 스팸 정책 「scaled content abuse」
  → 예시에 **「자동 변환(동의어 치환·번역 등)을 거쳐 다수의 페이지를 생성하고 사용자에게 주는 가치가 적은 경우」**,
    그리고 **「콘텐츠가 대량 생산이라는 사실을 숨길 의도로 여러 사이트를 만드는 것」** 이 포함된다
- Google 공식 입장(2025) — AI 번역 자체를 스팸으로 규정하지는 않는다. 문제는 **가치 없는 콘텐츠를 대량으로 찍어내는 것**이다
- AdSense 미승인 사유 — 「원본성 있는 가치 있는 콘텐츠 부족」, 「자동 생성 페이지 또는 원본 콘텐츠가 거의 없는 페이지」

### 위험 등록부

| # | 위험 | 등급 | 현재 상태 | 완화 규칙 |
|---|---|---|---|---|
| 1 | 영문판 이식이 **기계 번역**으로 읽힘 | 중 | PORTING_POLICY 로 통제 중 | 2단 분리 작성 · 한국 anchor 1~2개 · 최신 데이터 재조회 · 현업 용어 cross-check. **이 넷 중 하나라도 빠지면 발행 금지** |
| 2 | 두 사이트가 **1:1 대응**으로 보여 「대량 생산 은폐」로 읽힘 | 중 | 1:1 아님이 확인됨 | fairwayeta 67편 중 **SKIP 18편**. 이식률 100%를 목표로 삼지 않는다 |
| 3 | 같은 언어 중복 (faircast 영문 ↔ fairwayeta) | **해소** | Hello, World 7편 **전부 한국 주제 영문 원본**. fairwayeta 67 slug 와 겹침 **0건** | 이 상태를 유지한다. fairwayeta 글을 faircast 영문으로 옮기지 않는다 |
| 4 | **발행 속도 급증** | **높음 (신규)** | 자동화로 새로 생긴 위험 | 아래 3장 |
| 5 | 이미지·SVG 공유 | 낮음 | 자기 자산 | alt·캡션은 언어별로 새로 쓴다 |
| 6 | 자동 생성 페이지 양산 | 낮음 | 숏코드는 **새 URL 을 만들지 않는다** | 기존 페이지 내부 목록일 뿐. 태그 아카이브는 이미 noindex |

### 하지 않을 것 — 이 셋은 선을 넘는다

1. **영문 원문을 기계 번역해서 그대로 발행** — 정책 예시에 그대로 해당한다
2. **두 사이트를 상호 canonical 로 묶기 / 같은 글을 양쪽에 게시** — 중복 신호를 스스로 만든다
3. **태그·카테고리·아카이브 페이지 양산** — 얇은 페이지를 늘리는 전형적인 패턴

### hreflang 은 쓰지 않는다

한글판과 영문판은 **번역본이 아니라 각각 독립적으로 쓴 글**이다.
hreflang 은 「같은 내용의 다른 언어판」을 선언하는 태그다. 지금 구조에 붙이면
스스로 「이건 번역본입니다」라고 신고하는 셈이 된다. 붙이지 않는다.

---

## 3. 발행 속도 상한 — 자동화가 만든 위험을 자동화로 막지 않는다

이식 대기 10편을 하루에 다 낼 수 있게 됐다. **그게 정확히 scaled content 의 모양이다.**

| 규칙 | 값 |
|---|---|
| 주당 발행 상한 | **2편** |
| 하루 발행 상한 | **1편** |
| 예외 | 없음. 급한 시황 글은 애초에 SKIP 대상이다 |

이식 대기가 쌓이는 것은 문제가 아니다. **한 번에 쏟아내는 것이 문제다.**
`PORT_MAP.tsv` 의 WAIT 는 밀린 숙제가 아니라 재고다.

발행 이력이 이 상한을 지켰는지는 REST 로 확인한다.

```powershell
curl.exe -s "https://faircast.kr/wp-json/wp/v2/posts?per_page=20&_fields=date,slug"
```

---

## 4. 자산 공유 규칙 (fairwayeta → faircast)

| 자산 | 처리 | 비고 |
|---|---|---|
| 사진 · 도면 이미지 | `faircast-images/img/` 로 복사 → **새 태그** → jsDelivr | 파일명은 Cloudinary 6자 접미사 유지. 덮어쓰기 금지 |
| 이미지 안의 영문 라벨 | **그대로 둔다** | 선형명·부위명은 국내 현업도 영문으로 쓴다. 서술형 문장 라벨만 재생성 |
| alt 텍스트 · 캡션 | **언어별로 새로 쓴다** | 같은 이미지라도 alt 를 복사하지 않는다 |
| CSS 차트 (Tailwind) | **못 쓴다.** 내용만 가져와 지침 [8] 다크박스로 재작성 | 워드프레스에 Tailwind 클래스가 없다 |
| 인라인 SVG | 그대로 이식 가능. 라벨만 한글화 | |

태그 발행과 200 확인:

```powershell
cd C:\Users\bab5s\Desktop\project\faircast-images
git add img
git commit -m "add <topic> article images (N)"
git tag vN
git push origin main --tags
curl.exe -s -o NUL -w "%{http_code}`n" "https://cdn.jsdelivr.net/gh/oceanholic83-web/faircast-images@vN/img/<name>.webp"
```

---

## 5. 랜딩 페이지 동적화 (2026-08-23 적용 완료)

고정 HTML 카드 85개를 숏코드로 대체했다. **발행 즉시 세 페이지에 반영된다.**

| 페이지 | ID | 이전 | 이후 |
|---|---|---|---|
| 홈 (insights-landing) | 269 | 고정 링크 22 | `[fc_posts]` × 4 |
| Hello, Korea | 488 | 고정 링크 53 | `[fc_posts]` × 3 + `[fc_filterbar]` + `[fc_total]` |
| Hello, World | 490 | 고정 링크 10 | `[fc_posts]` × 2 + `[fc_filterbar]` + `[fc_total]` |
| 항만 가이드 | 522 | 고정 카드 10 | `[fc_posts layout="bigcard" tag="항만 가이드" wrap_class="fct-card-grid"]` + `[fc_total]` |

스니펫 원본: `docs/wpcode/fc-posts.php` (WPCode 스니펫 **741**, 어디서나 실행)

⚠️ **제목은 한 곳에서만 관리된다.** 글 제목을 고치면 홈·목록·항만 가이드가 동시에 따라온다. 이전에는 페이지마다 제목이 박혀 있어 개고 뒤에도 옛 제목이 남았다. 2026-08-23 동해항 개고에서 실제로 드러난 문제다.

**폐기:** `pages/homepage/build.js` · `homepage.html` · `config.json` 의 Pick
→ Pick 은 이제 페이지 본문의 `slugs=` 인자에 있다.
**보관:** `template.html` — CSS 원본이자 숏코드 마크업의 근거다. 지우지 않는다.

### 되돌리기

세 페이지 모두 워드프레스 **리비전**이 살아 있다. 글 편집 화면 → 리비전에서 이전 판으로 복원하면 된다.

---

## 6. 백업 — 더 중요해졌다

파일을 안 거치게 되면서 레포 사본이 얇아졌다. **워드프레스 DB 가 정본이고 레포에는 사본이 없다.**

발행할 때마다:

```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$all = @()
1..4 | ForEach-Object {
  $all += curl.exe -s "https://faircast.kr/wp-json/wp/v2/posts?per_page=100&page=$_&_fields=id,slug,title,excerpt,date,modified" | ConvertFrom-Json
}
$all | ConvertTo-Json -Depth 5 | Out-File "backup/posts-$(Get-Date -f yyyyMMdd).json" -Encoding utf8
```

WPCode 스니펫은 DB 에만 있다. 고칠 때마다 `docs/wpcode/` 사본을 갱신한다.

---

## 버전 이력

| v | 날짜 | 변경 |
|---|---|---|
| v1 | 2026-08-23 | 문서 신설. 랜딩 동적화 적용 · 발행 속도 상한 신설 · 구글 정책 위험 등록부 작성 |

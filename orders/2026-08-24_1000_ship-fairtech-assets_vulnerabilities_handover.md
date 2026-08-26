# [ship-fairtech-assets] 인수인계 — faircast.kr 취약사항 4건

> **대상 프로젝트: ship-fairtech-assets (faircast.kr)**
> 이 문서는 faircast 대화창에서 검증 후 조치한다. 다른 레포 아님.
> 발행: HQ 통합관제 세션 · 2026-08-24
> 근거: HQ 헬스체크 실측 (`fairtech-homepage/scripts/health-check.mjs --site=faircast`,
> 2026-08-24T00:40Z, 샘플 11/83) + Cloudinary 전수 grep + curl 실측

**주의: 이 레포는 워드프레스 DB가 정본이다.** 레포 수정 ≠ 사이트 반영.
항목마다 조치 위치(레포 / WP 관리자)를 명시했다.

---

## 요약

| # | 심각도 | 항목 | 조치 위치 |
|---|---|---|---|
| 1 | 🔴 | fallbackImage 가 존재하지 않는 이미지(404)를 가리킴 | 레포 + 재빌드 + WP 붙여넣기 |
| 2 | 🔴 | noindex 카테고리 페이지가 sitemap 에 제출되고 있음 | WP 관리자 (SEO 플러그인) |
| 3 | 🟠 | 원장 오기 — 「Cloudinary 참조 0」이 사실과 다름 | `claude/STATUS.md` 정정 |
| 4 | 🟠 | 발행글 일부 og:image 미선언 | WP (개별 글) |

**전 항목 공통 전제: Cloudinary 계정 다운그레이드는 #1 완료 전까지 금지.**

---

## 1. 🔴 fallbackImage 404 — 대체 이미지가 깨져 있다

### 사실 (실측)

```
pages/hello-korea/config.json:18
pages/hello-world/config.json:15
```

두 파일의 `fallbackImage` 가 다음을 가리킨다:

```
https://res.cloudinary.com/dzatgu3y7/image/upload/q_auto/f_auto/v1/ship-fairtech/placeholder.jpg
```

대표가 2026-08-24 직접 확인: **`HTTP/1.1 404 Not Found`**

즉 fallback 이 이중으로 깨져 있다 —
① 8/22 jsDelivr 이관에서 누락된 마지막 Cloudinary 참조이고,
② 가리키는 파일 자체가 Cloudinary 에 존재하지 않는다.
개별 글 이미지가 로드 실패하는 순간, 대체 이미지도 404 가 된다.

### 조치

1. placeholder 용 이미지를 정한다. 원장 §5 에 「현재 `hello_y92wk9.webp` 로 대체 중」
   이라는 기록이 있으므로 그것을 쓰거나, 전용 placeholder 를 새로 만들어
   `faircast-images` 레포 `img/` 에 추가 (새 이름, 덮어쓰기 금지, 새 태그)
2. `config.json` 2곳의 `fallbackImage` 를 jsDelivr 경로로 교체:
   `https://cdn.jsdelivr.net/gh/oceanholic83-web/faircast-images@vN/img/<파일명>.webp`
3. **재빌드 + 워드프레스 붙여넣기까지 해야 완료다.**
   ⚠️ 단, 원장 §5 에 「`config.local.json` 4개 없음 (미니PC에만)」 기록이 있다.
   이 작업이 어느 기계에서 가능한지 먼저 확인할 것 — config.local.json 이 필요한
   빌드라면 **미니PC에서만** 된다.
4. 완료 검증:

```bash
grep -rn "res.cloudinary.com" pages/ data.js loader.js
```

→ 0건이어야 완료. 0건 확인 후에야 Cloudinary 다운그레이드 가능.

---

## 2. 🔴 noindex 페이지를 sitemap 으로 제출 중 — 자기모순

### 사실 (실측, 샘플 11/83 기준)

다음 2개 URL 이 **noindex 메타를 갖고 있으면서 sitemap 에 실려 있다**:

```
https://faircast.kr/category/insights/hello-world/explainers/
https://faircast.kr/category/port-guide/
```

sitemap index 의 세 번째 파일이 원인이다:

```
https://faircast.kr/wp-sitemap-taxonomies-category-1.xml
```

구글에 「색인해달라」(sitemap)와 「색인하지 마라」(noindex)를 동시에 보내는 상태.
색인이 54 → 24 로 줄고 있는 사이트에서 품질 신호에 마이너스다.
AdSense 재신청(9/8 목표) 전에 정리하는 것이 맞다.

참고: 이 페이지들의 canonical 부재도 감지됐으나, noindex 페이지는 canonical 이
필요 없으므로 **조치는 sitemap 제외 하나로 충분하다.**

### 조치 (WP 관리자)

SEO 플러그인(또는 WP 코어 sitemap 설정)에서 **category taxonomy 를 sitemap 에서 제외.**
코드 수정 아님. WPCode 로 하는 경우 기존 스니펫 번호 체계 확인 후 추가.

⚠️ **robots.txt 차단으로 하지 말 것.** WPCode 617 사고(2026-08) 참조 —
크롤 차단된 URL 은 색인에서 제거되지 않는다. sitemap 제외 + noindex 유지가 정답.

### 완료 검증

```bash
curl -s "https://faircast.kr/wp-sitemap.xml" | grep -c "taxonomies-category"
```

→ 0 이어야 완료.

### 전체 규모 확인 (선택)

이번 실측은 83개 중 11개 샘플이다. 카테고리 페이지 전수를 보려면 HQ 레포에서:

```bash
node scripts/health-check.mjs --site=faircast --full
```

---

## 3. 🟠 원장 정정 — 「Cloudinary 참조 0」은 오기

`claude/STATUS.md` §5 현재 기록:

> ~~Cloudinary 월 $99~~ → 2026-08-22 마이그레이션 완료. … 사이트 참조 **0**. 다운그레이드 가능

**「참조 0」과 「다운그레이드 가능」이 둘 다 틀렸다.** 본문 237장은 이관됐으나
`config.json` 2곳의 fallbackImage 가 남았고(#1), 심지어 404 다.

### 조치

원장 갱신 원칙대로 **지우지 말고 정정 이력을 남긴다**:
- 해당 줄을 「⚠️ 2026-08-24 정정: fallbackImage 2건 잔존 발견(HQ 전수 grep).
  #1 완료 전 다운그레이드 금지」로 갱신
- 완료 후 「참조 0 (grep 재확인, 날짜)」으로 다시 갱신

이 건은 「측정 없이 완료 선언」 사례다. 8월의 오탐·오기 이력(96.6% 낡은 값,
616 대불 오기 등)과 같은 계열이므로 정정 이력이 남아야 다음 실수를 막는다.

---

## 4. 🟠 발행글 og:image 미선언 (샘플 3/11)

실측에서 og:image 가 없는 페이지:

```
https://faircast.kr/lng-gtt-royalty-korea-2026/
https://faircast.kr/tanker-sizes-aframax-suezmax-vlcc-korea-guide/
https://faircast.kr/terms/
```

`/terms/` 는 정책 페이지라 무시해도 된다. **발행글 2건은** 공유 시 미리보기
이미지가 없다 — FIFU(Featured Image) 미지정으로 추정. 군산항 글 블로커 목록에도
「FIFU 비어 있음」이 있었으므로 같은 계열 문제일 가능성.

### 조치 (WP, 낮은 우선순위)

발행글 61편 중 FIFU 미지정 글을 REST 로 전수 확인 후 일괄 지정.
#1·#2 보다 급하지 않다. 9/8 재신청 전 여유가 있으면.

---

## 처리 순서 권장

1. **#2 (sitemap 제외)** — WP 설정 하나. 5분. 색인 신호 즉시 개선
2. **#3 (원장 정정)** — 5분. #1 착수 전에 기록부터
3. **#1 (fallbackImage)** — 이미지 준비 + 빌드 가능 기계 확인 필요. 반나절
4. #1 완료 검증 후 → **Cloudinary 다운그레이드 실행** (비용 절감 확정)
5. #4 는 여유 있을 때

완료 후 HQ 헬스체크 재실행으로 교차 확인:

```bash
node scripts/health-check.mjs --site=faircast
```

(fairtech-homepage 레포의 scripts/. 🔴 0 이 목표)

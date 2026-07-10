# Faircast Pages — Master Guide

faircast.kr의 워드프레스 페이지를 자동 빌드하거나 정적 HTML로 관리합니다.

## 페이지 매핑

### 동적 빌드 (build.js 실행 필요)

| 페이지 | WP post ID | 빌더 폴더 | URL |
|---|---|---|---|
| 홈페이지 | 269 | pages/homepage/ | https://faircast.kr/ |
| Hello, Korea | 488 | pages/hello-korea/ | https://faircast.kr/hello-korea-page/ |
| Hello, World | 490 | pages/hello-world/ | https://faircast.kr/hello-world-page/ |
| 항만 가이드 | 522 | pages/port-guide/ | https://faircast.kr/port-guide/ |

### 정적 HTML (파일 자체를 복붙)

| 페이지 | 파일 | URL |
|---|---|---|
| About | pages/about.html | https://faircast.kr/about/ |
| Contact | pages/contact.html | https://faircast.kr/contact/ |
| Privacy | pages/privacy.html | https://faircast.kr/privacy/ |
| Terms | pages/terms.html | https://faircast.kr/terms/ |

## 빌드 명령어

### 전체 빌드 (PowerShell)

```powershell
cd C:\Users\user\Desktop\CURSOR\ship-fairtech-assets\pages\homepage
node build.js

cd C:\Users\user\Desktop\CURSOR\ship-fairtech-assets\pages\hello-korea
node build.js

cd C:\Users\user\Desktop\CURSOR\ship-fairtech-assets\pages\hello-world
node build.js

cd C:\Users\user\Desktop\CURSOR\ship-fairtech-assets\pages\port-guide
node build.js
```

PowerShell에서 `&&` 안 됨. 한 줄씩 실행하거나 위처럼 `cd` 후 `node build.js`.

### 개별 빌드

```powershell
cd pages\homepage
node build.js

cd pages\hello-korea
node build.js

cd pages\hello-world
node build.js

cd pages\port-guide
node build.js
```

## 빌드 후 배포

각 빌더는 폴더 안에 `{폴더명}.html`을 생성합니다. 워드프레스 **코드 편집기**에 전체 복붙합니다.

| 빌드 결과물 | WP post ID |
|---|---|
| pages/homepage/homepage.html | 269 |
| pages/hello-korea/hello-korea.html | 488 |
| pages/hello-world/hello-world.html | 490 |
| pages/port-guide/port-guide.html | 522 |

1. 해당 `.html` 파일 열기 → Ctrl+A → Ctrl+C
2. 워드프레스 → 페이지 → 해당 post 편집 → 코드 편집기
3. 기존 내용 전체 삭제 → 붙여넣기 → **업데이트**

## 정적 페이지 관리

`pages/about.html`, `pages/contact.html`, `pages/privacy.html`, `pages/terms.html`은 빌더가 없습니다. 파일 자체가 워드프레스에 붙여넣을 최종 HTML입니다.

수정 시:
1. 해당 `.html` 파일을 직접 편집
2. 파일 내용 전체 복사
3. 워드프레스 해당 페이지 → 코드 편집기에 붙여넣기 → **업데이트**
4. Git commit/push (정적 파일은 원본이 소스이므로 반드시 커밋)

## 각 페이지 섹션 구성

### homepage (post=269)

1. **최신 발행 3편** — 자동 (최신순, Pick 제외)
2. **입문자를 위한 추천 3편** — `config.json` `deskPick`
3. **실무자를 위한 분석 3편** — `config.json` `proPick`
4. **더 읽기 8편** — 자동 (최신순, Pick·최신3 제외)

### hello-korea (post=488)

1. **최신 발행 3편** — 카테고리 1(Hello, Korea) 최신순
2. **Hello, Korea's Pick 3편** — `pickFixed` 1편 + homepage `deskPick`/`proPick`에서 랜덤 2편
3. **전체 글** — 카테고리 전체 목록 + 서브카테고리 필터 바 (JS)

### hello-world (post=490)

1. **Latest 3** — 카테고리 8(Hello, World) 최신순
2. **Pick 없음** — 글 수가 적어 Pick 섹션 생략
3. **All articles** — 카테고리 전체 목록 + 서브카테고리 필터 바 (JS)

### port-guide (post=522)

1. **Hero panel** — Cloudinary 배경 이미지 + 타이틀·설명·배지
2. **Port atlas map** — Mapbox 지도 + 12개 항만 마커 (`data.js` + `port-atlas.js` from jsDelivr)
3. **Port cards** — 카테고리 47(항만 가이드) 게시글 자동 fetch → 카드 목록

## 폴더 구조 (공통)

```
pages/{name}/
├── config.json      ← 슬러그, 카테고리, API 설정
├── template.html    ← HTML 템플릿 (플레이스홀더)
├── build.js         ← 빌더 (API fetch → 치환 → 출력)
├── {name}.html      ← 빌드 결과물 (WP에 복붙)
└── README.md        ← 개별 빌더 설명
```

## 데이터 소스

| 빌더 | 목록 API | 상세 API |
|---|---|---|
| homepage | faircast.kr REST API | faircast.kr REST API (`_embed`) |
| hello-korea | fairwayeta monitor API | faircast.kr REST API (`_embed`) |
| hello-world | fairwayeta monitor API | faircast.kr REST API (`_embed`) |
| port-guide | faircast.kr REST API (categoryId=47) | 정적 config + template only |

Monitor API: `https://www.fairwayeta.com/api/faircast-monitor?key=...`

## 새 기사 발행 시 업데이트 루틴

1. 워드프레스에서 기사 발행
2. 항만 가이드 글이면 카테고리 **항만 가이드(ID 47)** 반드시 체크
3. Pick 변경이 필요하면 `pages/homepage/config.json` 수정
4. hello-korea Pick 고정글 변경 시 `pages/hello-korea/config.json`의 `pickFixed` 수정
5. 해당 페이지(또는 전체) `node build.js` 실행
6. 생성된 `.html` → WP 코드 편집기 복붙 → 업데이트

### 항만 글 발행 시 추가 작업

새 항만 가이드 글을 발행하면:
1. 위 5-6번 절차로 `port-guide.html` 재빌드
2. `data.js`에서 해당 항만 객체의 `guideUrl`을 새 글 URL로 채우고 `note` 갱신
3. Git commit/push
4. jsDelivr 캐시 퍼지: `https://purge.jsdelivr.net/gh/oceanholic83-web/ship-fairtech-assets@main/data.js`

## 주의사항

- `node build.js`는 인터넷 연결 필요 (faircast.kr + fairwayeta API 실시간 호출)
- hello-korea/hello-world는 카테고리 전체 글을 병렬 fetch하므로 WP rate limit 시 일부 글 누락 가능 → 재실행하면 보통 해결
- 빌드 결과물 `*.html`은 매번 재생성되므로 git에 꼭 포함할 필요 없음
- `config.json`, `template.html`, `build.js` 변경 시에만 git commit/push
- 정적 페이지(`about.html`, `contact.html`, `privacy.html`, `terms.html`)는 파일 자체가 원본이므로 수정 시 반드시 커밋
- `port-guide/config.local.json`은 Mapbox 토큰이 있어 git에서 제외됨 (`config.local.json.example`만 커밋)

## Cursor 오더 규칙

| 요청 | 동작 |
|---|---|
| "홈페이지 빌드해줘" | `pages/homepage` → `node build.js` → post=269 복붙 안내 |
| "hello-korea 빌드해줘" | `pages/hello-korea` → `node build.js` → post=488 복붙 안내 |
| "hello-world 빌드해줘" | `pages/hello-world` → `node build.js` → post=490 복붙 안내 |
| "항만 가이드 빌드해줘" | `pages/port-guide` → `node build.js` → post=522 복붙 안내 |
| "페이지 전체 빌드해줘" | homepage → hello-korea → hello-world → port-guide 순서로 빌드 |
| "about/contact/privacy/terms 업데이트해줘" | 해당 `.html` 파일 직접 편집 → 워드프레스 복붙 안내 → git commit/push |

Pick/설정 변경 요청이 있으면 해당 `config.json` 수정 후 빌드.
`*.html`만 재생성한 경우 git push 하지 않음 (정적 페이지 제외).

## 상세 문서

- [homepage/README.md](homepage/README.md)
- [hello-korea/README.md](hello-korea/README.md)
- [hello-world/README.md](hello-world/README.md)
- [port-guide/README.md](port-guide/README.md)

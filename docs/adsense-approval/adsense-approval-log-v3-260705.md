# AdSense Approval Log — faircast.kr (v3)

**Last Updated**: 2026-07-05
**Previous log**: adsense-approval-log-v2-260704.md (2026-07-04)
**Site**: faircast.kr (WordPress, Gabia hosting, Kadence theme)
**AdSense Publisher ID**: pub-9894725798878226
**Session status**: faircast.kr = "준비 중" (2026-06-28 16:03 KST 접수, 심사 8일차)

---

## Session Summary — 2026-07-05

심사 대기 중 E-E-A-T 신호 강화 작업 집중. 인수인계서 v2에 적혀있던 여러 문제 진단(모니터 API 401, 홈페이지 콘텐츠 부재, About 페이지 캐시 lag, Hello World 유령 섹션 등) 실제 확인 결과 다수가 오진 또는 이미 해결된 상태였음을 확인. 남은 실질 개선점 6가지를 순차 실행.

---

## 오진/오확인 정정

### 1. "Wordfence가 web_fetch 차단" — 오진
- 인수인계서 주장: Wordfence가 Claude의 faircast.kr fetch를 막고 있음
- 실측 결과: web_fetch가 faircast.kr에 정상 접근. UK ETS 글 5,628자 전체, 홈페이지, Hello World 페이지 모두 문제없이 fetch 성공
- 실제 제약: Claude 내부 규칙 — 대화창에 URL이 이미 등장한 상태여야 fetch 가능. 우회법: 카테고리 페이지(hello-korea-page, hello-world-page) 먼저 fetch → 그 안의 모든 글 링크 자동 잠금해제
- **결론**: 모니터 API 401 수정 작업 불필요. 사이트맵/카테고리 페이지가 더 안정적인 진입점. Vercel 배포 작업 폐기 가능

### 2. "Hello World 영문 2편만 존재 — 유령 섹션" — 오진
- 인수인계서 주장: 영문 2편으로 부실 섹션, 심사관에게 저품질 신호
- 실측 결과: Hello World 실제 발행 7편. Latest 3, All articles(Korea Industry 6, Explainer 1)로 정상 운영 중
- **결론**: Hello World nav 숨김 작업 취소

### 3. "홈페이지 비어 있음" — 오진 (내가 초기 진단 오류)
- 초기 판단: web_fetch로 홈페이지 확인 시 본문 없음 → 심사관도 못 볼 위험
- 실측 결과: 사용자 제공 홈페이지 HTML 완전함. Kadence 렌더링 정상, 최신 3편·Desk Pick·Pro Pick·더 읽기 8편·푸터 완비. web_fetch가 JS 걷어낸 텍스트만 반환해서 그렇게 보였을 뿐. Googlebot은 정상 인식
- **결론**: 홈페이지 작업 불필요

### 4. "About 페이지 Google 캐시가 여전히 World Cup 제목" — 이미 해결
- 인수인계서 상태: World Cup 옛 제목이 Search Console 캐시에 남아있음
- 2026-07-05 실측: Search Console URL 검사 → "URL이 Google에 등록되어 있음", "페이지 색인이 생성됨" ✅
- **결론**: 이미 해결됨

### 5. "홈페이지 stats 56+ 발행 부정확" — 실제 정확
- 워드프레스 글 목록: 발행 56편 / 비공개 2편 / 총 58편
- 홈페이지 히어로: "56+ 발행 분석" — 정확 일치
- **결론**: 손댈 것 없음

### 6. "AdSense 재신청 가능" — 불가능
- AdSense 대시보드 확인: faircast.kr = "준비 중" (2026-06-28 접수, 아직 검토 중)
- 재신청은 심사 완료 후에만 가능
- **결론**: 재신청 카드 접기. 대기 중 개선만 가능

---

## 실행 완료 — 6개 작업

### 작업 1: WPCode 201 비활성화
- **스니펫**: "이미지·SVG 우클릭/드래그 차단"
- **비활성화 사유**: 저신뢰 사이트 시그널로 해석될 수 있음. 정품 뉴스 매체는 이런 제한을 걸지 않음. AdSense 심사관·Google 크롤러 모두에게 부정적 신호
- **상태**: Deactivated
- **원복 조건**: 심사 승인 후 재활성화 검토

### 작업 2: WordPress 바이라인 통일 (Faircastor → Faircast 편집팀)
- **파일**: 사용자 → 프로필
- **변경 내용**:
  - 이름: `Faircast`
  - 성: `편집팀`
  - 닉네임(필수): `Faircast 편집팀`
  - 공개적으로 보일 이름: `Faircast 편집팀`
- **효과**: WP display name은 사용자 단위이므로 소급 적용. 56개 발행 글 전체 바이라인 즉시 변경됨
- **검증**: 관리자 상단 "안녕하세요 Faircast 편집팀님" 확인. 페이지 목록 작성자 컬럼 전체 변경 확인

### 작업 3: 글 하단 저자 블록 자동 삽입 (WPCode 신규 스니펫)
- **스니펫명**: `Author Bio Block — After Post Content`
- **유형**: PHP
- **삽입 위치**: `the_content` 필터, priority 20
- **적용 대상**: `is_singular('post')` — 단일 글 페이지에만 (About/Contact 등 페이지 제외)
- **디자인**: 티얼(#14b8a6) 좌측 보더 4px, 배경 #f8fafc, 저자 블록 상단 "ABOUT THE EDITORIAL DESK" 라벨
- **콘텐츠**:
  - Faircast 편집팀 표기
  - "해운·조선·항만 산업의 시장과 실무를 잇는 독립 분석 매체. 현업 경험을 가진 편집진이 IMO·IACS·한국선급·해양수산부 등 1차 자료를 바탕으로 글을 발행. 광고 콘텐츠와 편집 콘텐츠는 분리"
  - About 페이지 링크 + hello@fairtech.kr
- **효과**: 모든 발행 글 본문 하단에 편집팀 실체 신호 자동 삽입. E-E-A-T 개선
- **검증**: UK ETS 글 프론트엔드에서 티얼 좌측 보더 박스 정상 렌더링 확인

### 작업 4: Schema.org Organization + WebSite 마크업 (WPCode 신규 스니펫)
- **스니펫명**: `Schema.org — Organization + WebSite (About page + Homepage)`
- **유형**: HTML (사이트 전체 헤더 삽입)
- **삽입 내용**: JSON-LD `@graph` 배열
  - Organization: name Faircast, alternateName "Faircast 편집팀", email hello@fairtech.kr, parentOrganization Fairtech, sameAs 4개 사이트, knowsAbout 6개 도메인
  - WebSite: publisher는 Organization 참조, inLanguage ko-KR + en-US
- **효과**: Google 크롤러가 사이트 오너십·편집 조직 실체를 기계 판독 가능하게 인식
- **검증**: DevTools → Elements → `application/ld+json` 검색 → 홈페이지에서 "1 of 1" 정상 삽입 확인

### 작업 5: Schema.org Article + Author 마크업 (WPCode 신규 스니펫)
- **스니펫명**: `Schema.org — Article + Author (single posts)`
- **유형**: PHP (`wp_head` 훅, priority 5)
- **적용 대상**: `is_singular('post')`
- **동적 필드**:
  - headline, description (excerpt), datePublished, dateModified — 자동 인식
  - image: FIFU 메타 → 대체 없으면 post thumbnail → 대체 없으면 기본 히어로 이미지
  - author: Organization type, @id로 상단 Organization 참조, name "Faircast 편집팀"
  - publisher: @id 참조로 Organization 재사용
  - inLanguage: ko-KR
- **효과**: 개별 글마다 저자·발행일·수정일·이미지 구조화 데이터 자동 생성. Google Article Rich Results 자격 확보
- **검증**: PMS 글에서 `application/ld+json` 3개 (Kadence 자동 없음, FIFU 이미지 schema 1 + Article 1 + Organization graph 1). "Faircastor" 흔적 없음 확인

### 작업 6: 리디렉션 스니펫 통합 (WPCode 359 개선)
- **기존 코드**: www.faircast.kr → faircast.kr 리디렉션만 처리 (HTTP_HOST 검사)
- **문제**: http → https 리디렉션 없음. Search Console에 `http://faircast.kr/`, `http://www.faircast.kr/`, `https://www.faircast.kr/` 3개 URL이 별개로 크롤링되어 색인 문제 발생
- **개선 코드**:
```php
add_action('init', function() {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $is_https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
                || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    if ($host === 'www.faircast.kr' || !$is_https) {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        wp_redirect('https://faircast.kr' . $uri, 301);
        exit;
    }
}, 1);
```
- **검증**: http://faircast.kr, http://www.faircast.kr, https://www.faircast.kr 3개 다 → https://faircast.kr 301 리디렉션 확인

---

## Search Console 상태 (2026-07-05)

### 개선 지표
| 항목 | 2026-06-26 | 2026-07-05 | 변화 |
|------|-----------|-----------|------|
| 색인된 페이지 | 84 | 97 | +13 |
| 클릭 (28일) | 23 | 43 | +87% |
| 노출 (28일) | 671 | 1,470 | +119% |
| 사이트맵 등록 URL (posts) | 42 | 56 | +14 |

### 미해결 이슈 (모두 시간이 해결)
- **404 유효성 검사**: 여전히 "시작됨" (17개 URL). Google 처리 시간
- **리디렉션 페이지 5건**: 작업 6으로 근본 해결. Google 재크롤링 대기
- **크롤링됨 - 색인 안 됨 21건**: 대부분 World Cup 잔재 + RSS/시스템 파일. 시간 소멸

### 사이트맵
- URL: https://faircast.kr/wp-sitemap.xml (또는 sitemap.xml, 같은 결과)
- 하위 인덱스 3개: wp-sitemap-posts-post-1.xml (56 URLs 정상), page-1, taxonomies-category-1
- Search Console "발견 페이지 11개" 표시는 인덱스 파일 단위 카운트 방식 때문. 실제 사이트맵 정상 작동

---

## GA4 상태 (2026-07-05)

### 지난 7일
- 활성 사용자: 41
- 페이지뷰: 346
- 세션: 41

### 트래픽 소스 (개선 방향)
- Organic Search: 22 세션 (직전 12 → 22로 상승)
- Direct: 21
- AI Assistant: 8 (Claude 7, ChatGPT 1) — 인수인계서 시점 "50%" 대비 크게 감소
- **해석**: SEO 궤도 안착. AI Assistant 비중 감소는 심사관 시각에서 긍정 신호

### 지역
- 한국 25명 (90%)
- Poland 6, US 4, Bangladesh/China/Spain/Hong Kong 각 1

### 페이지 조회 편중 문제 (미해결)
- 홈페이지 30, Hello Korea 페이지 11, Hello World 페이지 2, 항만 가이드 1, About 1
- 개별 글 조회 대부분 0
- **함의**: 랜딩 페이지에서 개별 글로 흐르는 클릭 유도 부족. 심사관·독자 모두에게 "글 안 읽는 사이트" 인상 위험
- **미결 조치**: 홈페이지 히어로 CTA 추가 (승인 대기 중 실행 여부 미정)

---

## 잔여 작업 및 대기 사항

### AdSense 재검토 프로세스 (자동 진행)
- 심사 시작: 2026-06-28 16:03
- 예상 완료: 심사 시작 후 2~4주 (2026-07-12 ~ 2026-07-26)
- **재신청 불가**: 심사 진행 중에는 새 접수 불가. 결과 대기만

### 대기 중 실행 가능한 활동
1. **바이오매스 펠릿 초안 어휘 정리 후 발행** — 사이트 활력 신호 지속
2. **군산항 실사진 확보 → 항만 가이드 발행 재개** — Mokpo/Jeju 순차
3. **홈페이지 히어로 CTA 추가** (실효성 낮음, 실행 여부 미정)

### 승인 후 예정 작업 (Scenario A)
1. 홀드된 초안 순차 발행 (바이오매스, 군산 등)
2. fairwayeta.com AdSense 재신청 (byline·schema 시스템 적용 후)
3. 남은 항만 가이드 완성 (Mokpo, Jeju)
4. TD3C 한글판 explainer

### 거절 후 예정 작업 (Scenario B)
- **2주 이상 대기 후** 재신청 (4회 연속 거절은 계정 flag 위험)
- 대기 중 5~8편 추가 발행
- 재신청 시 근거 메시지: "사이트 4개월+, 편집팀 바이라인·저자 블록·schema.org 3종 마크업 도입, 색인 페이지 97+"

---

## 세션 인수인계 노트

### 다음 Claude 세션이 알아야 할 것

1. **Wordfence 차단은 오진.** faircast.kr에 web_fetch 정상 작동. 인수인계서에 이 언급 있어도 무시할 것

2. **모니터 API 401 수정 작업은 폐기.** 사이트맵 + 카테고리 페이지가 더 안정적인 모니터링 진입점. `fairwayeta monitor API` 관련 태스크는 우선순위 최하위로 이동

3. **faircast.kr 모니터링 표준 절차**:
   - `https://faircast.kr/hello-korea-page/` → 한국어 글 목록
   - `https://faircast.kr/hello-world-page/` → 영문 글 목록
   - `https://faircast.kr/port-guide/` → 항만 가이드
   - 위 3개 페이지 fetch 후 개별 글 URL 자동 잠금해제 → 개별 fetch 가능

4. **AdSense 상태**: 2026-06-28 접수, 2026-07-05 기준 심사 8일차. 결과 나올 때까지 재신청 불가

5. **6개 신규/변경 스니펫 있음** (아래 인벤토리 참조)

6. **홀드 콘텐츠**:
   - 바이오매스 펠릿 한글판 — 어휘 재검토 필요 (사용자 요청)
   - 군산항 한글판 — 실사진 확보 대기 (Wikimedia Pier of Port of Gunsan 01.jpg 등)

7. **경고**: 인수인계서 v2에는 "Published articles: 29"로 낡은 값이 있음. 실제는 56편(2026-07-05 기준)

---

## WPCode 스니펫 인벤토리 (2026-07-05 갱신)

| ID | 이름 | 유형 | 상태 | 이번 세션 변경 |
|----|------|------|------|--------------|
| 529 | Category Archive Noindex | PHP | Active | - |
| 494 | (제목 없는 스니펫) | PHP | Active | - |
| 406 | Legacy World Cup 301 Redirects | PHP | Active | - |
| 378 | Meta Description from Excerpt | PHP | Active | - |
| 361 | Exclude Tags from Sitemap | PHP | Active | - |
| 359 | Force non-www redirect | PHP | Active | ⚠️ **코드 통합 개선 (작업 6)** |
| 358 | Tag Archive Noindex | PHP | Active | - |
| 259 | GA4 Tracking | HTML | Active | - |
| 220 | Faircast 도식 CSS | CSS | Active | - |
| 201 | 이미지·SVG 우클릭/드래그 차단 | HTML | **Deactivated** | ⚠️ **비활성화 (작업 1)** |
| 69 | Enable Shortcodes in Category Description | PHP | Active | - |
| 68 | Korea Port Atlas Map | HTML | Active | - |
| 67 | 댓글을 완전히 비활성화합니다 | PHP | Active (Outdated) | - |
| 66 | 글의 첫 번째 단락 뒤에 메시지 표시 | Text | Active | - |
| **NEW** | Author Bio Block — After Post Content | PHP | Active | ⭐ **신규 (작업 3)** |
| **NEW** | Schema.org — Organization + WebSite | HTML | Active | ⭐ **신규 (작업 4)** |
| **NEW** | Schema.org — Article + Author (single posts) | PHP | Active | ⭐ **신규 (작업 5)** |

**총 17개** (기존 14 → 활성 13 - 1비활성 + 3신규 = 활성 15개)

---

## E-E-A-T 강화 신호 총정리 (재검토 시 심사관에게 전달되는 것)

이번 세션 후 심사관이 사이트에서 볼 신호:

### Experience (경험)
- About 페이지: "Faircast는 Fairtech의 마린 엔지니어 팀이 운영합니다"
- 개별 글 하단: "현업 경험을 가진 편집진이 IMO·IACS·한국선급·해양수산부 등 1차 자료를 바탕으로 글을 발행합니다"

### Expertise (전문성)
- Schema.org Organization의 `knowsAbout`: Maritime shipping, Shipbuilding, Port operations, IMO regulations, Charter markets, Korean maritime industry
- 개별 글 카테고리 구조 (Insights / Industry / Market / Geopolitics / Routes·Ports)
- 56편 발행 콘텐츠의 전문성 자체

### Authoritativeness (권위)
- 통일된 바이라인 "Faircast 편집팀"
- 모든 글에 Article schema + Author schema 삽입
- Organization 마크업으로 parentOrganization Fairtech 명시
- 4개 관련 사이트 sameAs 연결 (fairwayeta, faircall, fairtech)

### Trust (신뢰)
- 광고와 콘텐츠 분리 명시 (About + 글 하단 저자 블록 양쪽)
- 1차 출처 명시 원칙 (About 페이지)
- HTTPS 100%
- Privacy / Terms / Contact 완비
- 저신뢰 시그널(우클릭 차단) 제거
- 리디렉션 통합으로 URL 정규화

---

## File Inventory (2026-07-05)

| File | Location | Purpose |
|------|----------|---------|
| project-guidelines-v6 | 프로젝트 폴더 | Workflow rules |
| AUTHORS-v3 (personas) | 프로젝트 폴더 | Persona definitions |
| Previous log v2 | `docs/adsense-approval-log-v2-260704.md` | Historical |
| **This log v3** | `docs/adsense-approval-log-v3-260705.md` | **Current** |
| PMS Korean v6 HTML | `/mnt/user-data/outputs/` (이전 세션) | Already published 2026-06-27 |
| Biomass Korean HTML | `/mnt/user-data/outputs/` (이전 세션) | **On hold — 어휘 재검토 필요** |

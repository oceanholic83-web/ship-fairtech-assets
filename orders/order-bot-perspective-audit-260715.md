# Order: AdSense 봇 시선 사이트 전수 감사

**목표:** faircast.kr을 Google AdSense 심사 봇 관점에서 전수 감사한다. 우리 눈에는 안 보이지만 봇에게는 문제가 되는 요소를 자동으로 찾아낸다.

**실행 위치:** `C:\Users\bab5s\Desktop\project\ship-fairtech-assets\`

**Claude Code에게 요청:**

아래 Python 감사 스크립트를 `scripts/adsense-bot-audit.js` 또는 `scripts/adsense-bot-audit.py` (Node 없으면 Python)로 작성하고 실행한다. 결과를 `docs/adsense-approval/bot-audit-260715.md`에 저장.

---

## 감사 스크립트 요구사항

### Step 1: 사이트맵에서 전체 URL 수집

```
GET https://faircast.kr/wp-sitemap.xml
→ 파싱 → sub-sitemap URL 목록 확보
GET each sub-sitemap
→ 개별 페이지 URL 전체 수집 (posts + pages)
```

**주의:** User-Agent는 반드시 `Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`로 설정. 실제 Google 크롤러 시선으로 접근.

### Step 2: 각 URL별로 다음 항목 감사

각 URL에 대해:

1. **HTTP 응답 코드**
   - 200이 아닌 것 목록화
   - 리디렉션 체인 추적

2. **응답 시간**
   - 5초 초과 페이지 목록화 (봇 크롤 timeout 우려)

3. **HTML head 검증**
   - `<title>` 존재 및 길이 (10-70자 권장)
   - `<meta name="description">` 존재 및 길이 (50-160자 권장)
   - `<meta name="description">`에 CSS 코드나 이상한 문자 포함 여부 (`{`, `}`, `!important`, `color:`)
   - `<link rel="canonical">` 존재 및 값
   - `<meta name="robots">` 값 (noindex 있는지)
   - `<html lang="...">` 값 (ko-KR 또는 en 이외 있는지)

4. **HTML body 검증**
   - 본문 텍스트 문자 수 (< 300자면 얇은 콘텐츠 경고)
   - 이미지 alt 속성 누락 개수
   - 내부 링크 개수 (< 3개면 고립 페이지 경고)
   - 외부 링크 개수

5. **구조화 데이터 (schema.org) 검증**
   - JSON-LD 존재 여부
   - Article / NewsArticle / BlogPosting 타입 여부
   - author 필드 존재 여부
   - datePublished / dateModified 존재 여부

6. **광고 관련 (AdSense 심사 봇 관점)**
   - `ads.txt` 접근 가능 여부 (사이트 루트)
   - AdSense 광고 코드 삽입 여부 (`pub-9894725798878226`)
   - 정책 페이지 링크 (privacy, terms) 사이트 어디서든 클릭 가능한지 확인

7. **정책 관점 콘텐츠 스캔** (본문 텍스트에서 아래 키워드 감지)
   - 성인 콘텐츠 유발 키워드
   - 폭력 관련 키워드
   - 저작권 침해 우려 (전체 인용, 뉴스 복사)
   - 무단 재게시 표현

### Step 3: 특수 URL 별도 검증

다음 5개 URL은 별도 심층 검증:
```
https://faircast.kr/
https://faircast.kr/about/
https://faircast.kr/port-guide/
https://faircast.kr/hello-korea-page/
https://faircast.kr/hello-world-page/
```

각각에 대해:
- Cloudinary 이미지 로드 여부 확인
- 내비게이션 링크 실제 작동 여부
- CTA 버튼 링크 유효성

### Step 4: 봇 접근성 검증

```
GET https://faircast.kr/robots.txt
```
- Sitemap 지시자 확인
- Disallow 규칙 확인 (핵심 콘텐츠 차단 여부)

```
GET https://faircast.kr/ads.txt
```
- Google AdSense 라인 존재 확인:
  `google.com, pub-9894725798878226, DIRECT, f08c47fec0942fa0`

### Step 5: 결과 리포트 생성

`docs/adsense-approval/bot-audit-260715.md`에 다음 형식으로 저장:

```markdown
# Bot Perspective Audit Report — 2026-07-15

## 요약
- 감사 대상 URL 총 수: XX
- 200 OK: XX
- 4xx/5xx: XX
- 리디렉션: XX
- Meta description 없음: XX
- Meta description CSS 오염: XX
- 얇은 콘텐츠 (본문 300자 미만): XX
- 고립 페이지 (내부 링크 3개 미만): XX
- Schema.org 없음: XX
- Author 없음: XX

## 심각도별 문제 목록

### 🔴 심각 (즉시 수정)
- URL: 문제 상세

### 🟡 경고 (검토 필요)
- URL: 문제 상세

### 🟢 참고 (개선 권장)
- URL: 문제 상세

## 5개 핵심 페이지 상세
### / (홈)
- HTTP 상태: 200
- Title: "..."
- Meta description: "..."
- 본문 문자 수: XXXX
- Schema.org: {type}
- 내부 링크: XX개
- 이미지 alt 누락: X개
- 문제: 없음 / 있음 (상세)

(About, Port Guide, Hello Korea, Hello World 각각 같은 형식)

## 정책 관점 검증
- 저작권 위반 의심 페이지: XX
- AI 자동 생성 의심 페이지: XX
- 성인 콘텐츠: 없음
- 폭력 콘텐츠: 없음

## robots.txt 상태
(원문 표시)

## ads.txt 상태
- 존재: O/X
- Google AdSense 라인 정확: O/X

## 종합 판정
- AdSense 승인 가능성: 상/중/하
- 즉시 조치 필요 항목: (목록)
- 개선 권장 항목: (목록)
```

---

## 기술 요구사항

- **언어:** Node.js 우선 (axios, cheerio 사용). 없으면 Python (requests, beautifulsoup4)
- **동시 요청:** 최대 3개 병렬 (사이트 부하 방지)
- **요청 간 딜레이:** 500ms
- **재시도:** 실패 시 최대 2회 재시도
- **결과 저장:** JSON 원본 데이터도 `docs/adsense-approval/bot-audit-260715.json`에 함께 저장

## 완료 확인

- [ ] 스크립트 작성 완료
- [ ] 실행 완료 (전체 URL 감사)
- [ ] `bot-audit-260715.md` 리포트 생성
- [ ] `bot-audit-260715.json` 원본 데이터 저장
- [ ] 실행 로그에서 감사 대상 URL 수 확인 (기대치: 60+ 발행글 + 8 정적 페이지)

## Commit 메시지

```
audit: AdSense bot perspective site audit 260715
```

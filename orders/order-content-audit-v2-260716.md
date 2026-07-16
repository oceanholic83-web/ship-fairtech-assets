# Order: AdSense 봇 시선 사이트 전수 감사 v2 — 콘텐츠 품질·번역체·정책 위반 감지

**목표:** 2026-07-15에 실행한 봇 감사 스크립트를 확장한다. 이번 확장의 초점은 **콘텐츠 품질과 정책 위반 감지**다.

특히 AdSense 4회 거절의 실질 사유였던 "가치가 별로 없는 콘텐츠(Low-value content)"와 "Replicated content(원문 대비 부가가치 부족)", "Misleading representation(사이트 신원 불명확)", "Spam policies(얇은/중복 콘텐츠)" 4개 정책 영역을 봇 관점에서 자동 감지한다.

**실행 위치:** `C:\Users\bab5s\Desktop\project\ship-fairtech-assets\`

**Claude Code에게 요청:** 기존 `scripts/adsense-bot-audit.js`를 참고해 `scripts/adsense-content-audit-v2.js`를 새로 작성한다. 결과를 `docs/adsense-approval/content-audit-260716.md`에 저장한다.

---

## 감사 스크립트 요구사항

### 기본 세팅

- User-Agent: `Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)`
- 사이트맵에서 URL 자동 수집 (기존 스크립트와 동일)
- 동시 요청 3개, 요청 간 500ms 딜레이
- 실패 시 최대 2회 재시도
- 결과 저장: `docs/adsense-approval/content-audit-260716.md` (사람용) + `.json` (raw)

### Step 1: 기존 감사 항목 그대로 유지

기존 스크립트에서 확인한 항목들은 그대로 재실행 (redundancy check):
- HTTP 응답 코드, 응답 시간
- Meta description CSS 오염 여부
- 본문 문자 수 (< 300자 = 얇은 콘텐츠 경고)
- 내부 링크 개수
- ads.txt·robots.txt 상태

### Step 2: 신규 감사 항목 — 콘텐츠 품질 계열

각 발행글 URL에 대해 다음 항목을 자동 감지한다.

**2-1. 번역체·직역 흔적 감지**

본문에서 다음 트리거 표현을 자동 검색·카운트:

```
번역체 트리거 목록:
- "~에 의해"      (영어 수동태 by 직역)
- "~을 위해서"    (for the purpose of 직역)
- "~에도 불구하고" (despite 직역)
- "~라는 사실"    (the fact that 직역)
- "~함에 있어"    (in doing 직역)
- "진짜로"        (genuinely 구어체 직역)
- "이론적이지 않"  (not theoretical 직역)
- "지문을 안고"    (fingerprints 은유 직역)
- "지문을 남긴"
```

각 발행글 URL별로:
- 트리거 표현별 검출 횟수
- 총 트리거 개수
- 발행글당 트리거 밀도(문자 1,000자당 트리거 수)

3개 이상 트리거가 발견되는 발행글은 🟡 경고로 분류.

**2-2. 중첩 명사구 감지 (of 구조 직역)**

정규식으로 `[가-힣]+의 [가-힣]+의 [가-힣]+` 형태 3중 명사구 검출.
발행글당 3회 이상 발견 시 🟡 경고.

**2-3. 청유형 남용 감지**

"~봅시다" · "~보겠습니다" · "~해봅시다" 카운트.
발행글당 3회 이상 = 🟡 경고 (AI 청유형 패턴).

**2-4. 문장 시작 패턴 편향**

각 문장 첫 단어 추출 후 "이", "그", "이것", "그것"으로 시작하는 문장 비율 계산.
30% 이상 = 🟡 경고 (영어 it/this 대명사 직역 패턴).

**2-5. 폐쇄형 종결 연속**

"~습니다" 종결이 연속 5문장 이상 이어지는 구간 검출.
발행글당 2회 이상 발견 = 🟡 경고 (문장 형태 다양성 부족).

### Step 3: 신규 감사 항목 — 원문 대비 유사도 (Replicated Content)

**3-1. fairwayeta 원문 대비 유사도**

faircast.kr의 발행글이 fairwayeta.com의 어떤 원문을 한글화한 것인지 파악하기 위해:

- fairwayeta.com의 사이트맵을 별도로 fetch: `https://www.fairwayeta.com/sitemap.xml` (또는 sitemap-0.xml)
- fairwayeta 발행글 URL 목록 확보
- faircast.kr 각 발행글의 slug에서 유사한 fairwayeta URL 후보 매칭 (예: `ship-standardization-half-unified-korea-2026` ↔ `half-standardized-ship-what-global-shipbuilding-unified-and-what-it-didnt`)
- 매칭된 짝에 대해 원문 fetch 후 다음 지표 산출:
  - 본문 길이 비율 (faircast 한글 문자수 / fairwayeta 영문 워드수)
  - 고유명사·수치 일치도 (HD현대중공업·35%·IACS UR W11 등 유지 여부)
  - 구조 유사도 (H2 개수·순서)
  - 한글판의 한국 특화 anchor 존재 여부 (한국선급·KS B 1002·힘센 엔진 등 키워드 카운트)

**한국 특화 anchor 없이 원문 구조만 그대로 복사한 발행글이면 🔴 심각.**
**한국 특화 anchor가 3개 이상 있고 본문 길이가 원문 대비 80% 이상이면 ✅ 정상 (충분한 추가 가치).**

**3-2. faircast.kr 내부 중복 감지**

faircast.kr 자체 발행글 간 문장 중복 검출:
- 각 발행글의 첫 3문단을 추출
- 발행글 간 코사인 유사도 또는 Jaccard 유사도 계산
- 0.7 이상 유사도가 발견되는 쌍이 있으면 🟡 경고

### Step 4: 신규 감사 항목 — 사이트 신원 (Misleading Representation)

**4-1. 편집팀 신원 명시 검증**

각 발행글의 author 필드에서:
- "Faircast 편집팀" 또는 유사 명칭 존재 여부
- schema.org author 필드 정합성

**4-2. About 페이지 신원 명확성**

`https://faircast.kr/about/` 페이지에서:
- "Fairtech" 브랜드 명시 여부
- 편집 원칙 명시 여부
- 연락처(hello@fairtech.kr) 명시 여부
- 매체 목적·범위 명시 여부

**4-3. Contact·Privacy·Terms 페이지 완전성**

각 정책 페이지가:
- 200 OK 응답
- 500자 이상 실질 내용
- AdSense·Google Analytics·Cloudinary 명시 (Privacy 페이지)

### Step 5: 신규 감사 항목 — Spam Policies

**5-1. Doorway pages 감지**

- 유사 title로 여러 페이지가 만들어졌는가 (예: 부산항 A, 부산항 B, 부산항 C)
- 동일 키워드 밀도가 지나치게 높은 페이지가 있는가

**5-2. 얇은 콘텐츠 확장 감지**

기존 300자 미만 검사에 추가로:
- 300-800자 발행글: 🟡 경고
- 800-1500자 발행글: 🟢 참고 (짧지만 정상 범위)
- 1500자 이상: ✅ 정상

**5-3. 이미지 alt 없이 이미지만 있는 페이지**

이미지 개수 >= 3이고 alt 속성 누락 >= 2 = 🟡 경고.

### Step 6: 신규 감사 항목 — E-E-A-T 신호 강화

**6-1. 각 발행글의 E-E-A-T 지표 자동 산출**

각 발행글에 대해:
- 저자 표시: O/X
- 출처 명시: 본문에 "출처:" 또는 유사 표현 존재 여부
- 발행일 명시: schema.org datePublished 존재 여부
- 최종 수정일 명시: schema.org dateModified 존재 여부
- 내부 링크로 관련 발행글 참조: O/X
- 외부 링크: 개수·도메인 다양성

E-E-A-T 종합 점수(0-6) 산출 후 4 미만 = 🟡 경고.

### Step 7: 결과 리포트 생성

`docs/adsense-approval/content-audit-260716.md`에 다음 형식으로 저장:

```markdown
# Content Audit Report (v2) — 2026-07-16

> 감사 기준: Googlebot UA | 사이트: https://faircast.kr | 생성: 2026-07-16TXX:XX:XX

## 요약

| 항목 | 수치 |
|------|------|
| 감사 대상 URL 총 수 | XX |
| 번역체 트리거 3개 이상 발행글 | XX |
| 명사구 3중 중첩 발견 발행글 | XX |
| 청유형 남용 발행글 | XX |
| 이·그 문장 시작 30%+ 발행글 | XX |
| 폐쇄형 종결 연속 발행글 | XX |
| fairwayeta 원문 대비 부가가치 부족 의심 | XX |
| faircast.kr 내부 중복 의심 쌍 | XX |
| E-E-A-T 점수 4 미만 발행글 | XX |
| 얇은 콘텐츠 (300-800자) | XX |

## AdSense 정책 위반 위험도 종합

### 🔴 Low-value content 판정 위험
- (해당 발행글 목록)

### 🔴 Replicated content 판정 위험
- (fairwayeta 원문 대비 부가가치 부족한 발행글)

### 🟡 Misleading representation 판정 위험
- (편집팀 신원 명시 없는 발행글)

### 🟡 Spam policies 판정 위험
- (Doorway/thin/duplicate 의심 페이지)

## 발행글별 상세

### {발행글 title}
- URL:
- 문자 수:
- 번역체 트리거 수:
- 청유형 사용 횟수:
- 이·그 문장 시작 비율:
- 폐쇄형 종결 연속 구간:
- fairwayeta 원문 매칭:
- 원문 대비 본문 길이 비율:
- 한국 특화 anchor 개수:
- E-E-A-T 점수 (0-6):
- 종합 판정:

## 종합 판정

### AdSense 승인 가능성: 상/중/하

### 즉시 조치 필요 항목
- (목록)

### 개선 권장 항목
- (목록)
```

### Step 8: 기술 요구사항

- **언어:** Node.js (기존과 동일)
- **의존성:** axios, cheerio, xml2js (이미 설치됨). 필요시 추가.
- **동시 요청:** 최대 3개 병렬
- **요청 간 딜레이:** 500ms
- **재시도:** 실패 시 최대 2회
- **캐시:** 기존 감사와 다른 폴더에 저장하여 결과 분리
- **fairwayeta 크로스 사이트 fetch 시:** 별도 rate limit (초당 1회) 적용

### Step 9: 완료 확인

- [ ] 스크립트 작성 완료: `scripts/adsense-content-audit-v2.js`
- [ ] 실행 완료 (전체 URL 감사)
- [ ] 리포트 생성: `docs/adsense-approval/content-audit-260716.md`
- [ ] Raw 데이터 저장: `docs/adsense-approval/content-audit-260716.json`
- [ ] fairwayeta 크로스 사이트 매칭 결과 포함 확인
- [ ] E-E-A-T 점수 산출 확인

### Commit 메시지

```
audit: content quality + policy violation audit v2 260716
```

---

## 감사 결과의 활용

리포트 완료 후:

1. **🔴 즉시 조치 필요 항목**은 각 발행글별로 구체 개선안 도출
2. **🔴 Replicated content 판정 위험 발행글**은 한국 특화 anchor 추가 필요
3. **🟡 번역체 흔적 발행글**은 실무 용어로 재작성
4. **E-E-A-T 점수 4 미만 발행글**은 출처·저자·내부 링크 보강

이 결과를 기반으로 재신청 전 최종 콘텐츠 개선을 결정한다.

---

## 주의사항

- 감사 결과는 **자동 판정이며 100% 신뢰 금지**. Schema.org 오탐 사례처럼 스팟체크 필수.
- fairwayeta 크로스 사이트 fetch는 **fairwayeta 자체 심사에 영향을 주지 않는 read-only 접근**.
- Wordfence가 fairwayeta는 차단하지 않지만 faircast는 차단하는 경우가 있으므로, Wordfence 상태 확인 필수 (현재는 라이선스 미설치로 비활성).

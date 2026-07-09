# AdSense Approval Log — faircast.kr (v4)

**Last Updated**: 2026-07-08
**Previous log**: adsense-approval-log-v3-260705.md (2026-07-05)
**Site**: faircast.kr (WordPress, Gabia hosting, Kadence theme)
**AdSense Publisher ID**: pub-9894725798878226
**Session status**: faircast.kr = "검토 중" (2026-06-28 16:03 KST 접수, 심사 11일차)
                    AdSense 대시보드: 지급·광고·사이트 3단계 모두 완료

---

## Session Summary — 2026-07-08

심사 대기 중 목포항 신규 발행, Search Console 오류 3건 재검증 요청, `/insights/` 리디렉션 근본 해결, tag URL 정리. 심사 11일차 진입 (예상 완료 남은 시간 4~18일).

---

## AdSense 대시보드 상태 변화

### 2026-07-05 → 2026-07-08 변화

| 항목 | 2026-07-05 | 2026-07-08 | 변화 |
|------|-----------|-----------|------|
| 상태 | "준비 중" | **"검토 중" (3단계 완료)** | 진전 |
| 지급 | - | ✅ 프로필 완료 | 진전 |
| 광고 | - | ✅ 설정 확정 | 진전 |
| 사이트 | 접수 상태 | ✅ 연결 완료 | 진전 |

Google이 사이트 접근·정책 준수·계정 세팅 3단계를 통과시키고 실제 콘텐츠 품질 심사 단계에 진입한 것으로 해석됨.

---

## 실행 완료 — 6개 작업

### 작업 1: 목포항 한글판 신규 발행 (2026-07-07)

- **제목**: 세계 최상위권 조선소와 55GW의 관문 — 목포항이 서 있는 자리
- **Slug**: `mokpo-port-shipbuilding-cluster-offshore-wind-hub-korea-guide-2026`
- **분량**: 약 3,400자
- **페르소나**: K-Junior Pro
- **thesis**: "세계 최상위권 조선소(HD현대삼호) + 국내 첫 해상풍력 특화항만(목포신항) = 서남권 해양산업 관문"
- **팩트체크 반영**:
  - HD현대삼호 "세계 4위" → "Clarksons 기준 단일 야드 최상위권" (근거 명시)
  - 대불산단 "200개사·2.5만명" → "조선 관련 200여 개사·조선 종사자 2.5만 명" (명확화)
  - 목포+영암 프레이밍 = "서남권 조선 클러스터라는 하나의 산업권" (지역 정서 정합)
  - 55GW 산수: 입찰 55GW vs 보급 25GW 개념 분리 명시
  - "국내 유일" → "국내 첫 해상풍력 특화항만" (안전 표현)
  - 위기 프레이밍 완화 → "확충 조기화 요구가 나오는 배경"
- **최신 뉴스 반영**:
  - 2026-06-30 이재명 대통령 목포신항 시찰
  - 2026-06-30 기후에너지환경부 10년 55GW 로드맵 발표
  - 2026-04 신안우이 해상풍력 착공 (국민성장펀드 1호, 390MW)
  - 2026-06-24 목포신항 병목 문제 지적 (제4차 항만기본계획)
- **여객 축 완전 제외**: 사이트 정체성(상선 산업 분석 매체)과 일치. 8개 발행 항만 글 모두 상선 관점 유지 정합
- **이미지**: 3장 (FIFU 메인 1 + 본문 2)
- **SVG**: 2개 (서남권 조선 클러스터 지도 + 55GW 병목 다크 박스)
- **크로스링크**: 마산·광양여수·대산·포항
- **상태**: 워드프레스 발행 완료 + Search Console 색인 요청 완료

### 작업 2: 항만 가이드 페이지 업데이트

- `data.js`에서 목포항 port 객체 수정:
  - `note`: '서남해 거점, 도서 여객 + 자동차' → '서남권 조선 클러스터 관문, 국내 첫 해상풍력 특화항만'
  - `guideUrl`: null → '/mokpo-port-shipbuilding-cluster-offshore-wind-hub-korea-guide-2026/'
- **결과**: 지도 팝업 목포항 마커 클릭 시 [📖 가이드] 버튼 자동 표시
- **jsDelivr 캐시 퍼지 완료**
- **build.js 재실행**: pages/port-guide/port-guide.html 재생성 → 카드 목록에 목포항 추가
- **워드프레스 페이지 522 (항만 가이드) 코드 편집기 업데이트 완료**

### 작업 3: `/insights/` 리디렉션 오류 근본 해결

- **감지**: 2026-07-01 Search Console에서 신규 감지된 리디렉션 오류
- **원인**: WPCode 406 스니펫이 `/insights/world-cup-*`, `/insights/group-*` 등 하위 경로만 처리하고, `/insights/` 자체는 처리 안 함. Kadence + WordPress 카테고리 구조가 `/insights/`를 카테고리 archive로 인식해 무한 리디렉션 유발
- **조치**: WPCode 406 코드 보강. `/insights/` 자체를 명시적으로 홈으로 301 리디렉션 처리하는 preg_match 조건 추가
- **검증**: 브라우저 시크릿 창에서 `https://faircast.kr/insights/` 접근 → 즉시 홈으로 301 이동 확인
- **Search Console**: "리디렉션 오류" 항목 [수정 확인] 클릭 완료

### 작업 4: H&M 태그 URL 정리

- **감지**: `/tag/hm/`이 Search Console NOINDEX 제외 목록에 등장
- **원인**: 「한 척의 선박, 세 종류 보험」 글에 붙어 있는 "H&M(Hull & Machinery, 선체보험)" 태그의 슬러그가 `hm`으로 지나치게 짧고 모호
- **조치**: 태그 편집에서 슬러그만 변경 (`hm` → `hull-machinery`). 태그명 "H&M" 및 글 연결 유지
- **효과**: URL이 실무자에게 명확해지고, 향후 재크롤 시 `/tag/hull-machinery/` 경로로 갱신됨

### 작업 5: Search Console 유효성 검사 재실행 (3건)

Search Console 페이지 색인 생성 화면에서 아래 3개 항목 [수정 확인] 클릭 완료:

1. **리디렉션이 포함된 페이지 (5개)** — 상태: 실패 (2026-07-01) → 시작됨
   - `http://www.faircast.kr/`, `http://faircast.kr/`, `https://www.faircast.kr/` = 세션 초 리디렉션 통합(작업 6 v3)으로 해결됨
   - `/insights/world-cup-*`, `/insights/fifa-*` = WPCode 406으로 해결됨
2. **크롤링됨 - 현재 색인 안 됨 (21개)** — 상태: 실패 (2026-07-01) → 시작됨
   - 대부분 World Cup 잔재 URL + RSS/시스템 파일. 리디렉션 처리 완료 상태
3. **리디렉션 오류 (1개, `/insights/`)** — 상태: 처음 감지됨 → 시작됨
   - 작업 3에서 근본 해결 후 재검증 요청

**NOINDEX 제외 (2개, tag/hm/, tag/hd-hyundai/)** = 의도된 결과 (WPCode 358 정상 작동)이므로 [수정 확인] 클릭하지 않음.

### 작업 6: 개별 색인 요청 (홈·About)

Search Console URL 검사에서 아래 URL 색인 요청 완료:

- `https://faircast.kr/` — schema.org Organization + WebSite 마크업 반영 촉진
- `https://faircast.kr/about/` — schema.org 반영 촉진
- `https://faircast.kr/mokpo-port-shipbuilding-cluster-offshore-wind-hub-korea-guide-2026/` — 신규 발행

---

## Search Console 지표 (2026-07-08)

| 항목 | 2026-07-05 | 2026-07-08 | 변화 |
|------|-----------|-----------|------|
| 색인된 페이지 | 97 | 97 | 유지 |
| 색인 안 된 페이지 | 47 | 47 | 유지 |
| 클릭 (28일) | 43 | 40 | -3 |
| 노출 (28일) | 1,470 | 1,460 | -10 |
| 사이트맵 등록 URL (posts) | 56 | 57 (+목포) | +1 |

### 인기 검색어 상위 5개

| 검색어 | 클릭 | 노출 |
|--------|------|------|
| faircast | 2 | 11 |
| 한국선급 | 1 | 4 |
| kp&i | 1 | 3 |
| vlcc tce | 1 | 2 |
| vetting 뜻 | 0 | 31 |
| p&i club | 0 | 28 |
| 유조선 크기 분류 | 0 | 13 |

**해석**: 한국어 실무 용어 검색이 노출을 만들고 있음. 상선·규제·해운 실무 니치 정착.

---

## GA4 지표 (2026-07-08)

### 지난 7일

- 활성 사용자: 28 (7/5 대비 -9.7%)
- 페이지뷰: 258 (-34.5%)
- 세션: 27 (-6.9%)

### 트래픽 소스 변화

| 소스 | 7/5 | 7/8 |
|------|-----|-----|
| Direct | 21 | 20 |
| Organic Search | 22 | 11 |
| AI Assistant | 8 | 8 (Claude 7 + ChatGPT 1) |

**해석**: Organic 하락이 뚜렷하지만 심사 대기 중 신규 발행 부재 + 여름 시즌 검색 감소 요인. 목포항 발행 즉시 7뷰로 초기 반응 확인.

### 페이지 조회

| 페이지 | 조회수 |
|--------|--------|
| 홈페이지 | 38 |
| Hello Korea 페이지 | 10 |
| 항만 가이드 페이지 | 8 |
| FFA 글 | 7 |
| **목포항 (신규)** | **7** |

---

## Cascading Effects — 이번 세션 개선의 심사 영향

### 심사관이 재크롤 시 볼 신규 신호

1. **콘텐츠 수 증가**: 56 → 57편 (사이트 활력 지속)
2. **최신성 강화**: 2026-07-07 발행글 색인 → 최근 활동 뚜렷
3. **기술적 오류 해소**: `/insights/` 리디렉션 오류 근본 해결
4. **URL 정규화 완성도**: tag URL 실무자 친화적 정리
5. **항만 가이드 완결성**: 목포항 카드 자동 추가로 12개 무역항 중 9개 발행

### 심사관 시선에서 개선 상태 총합

- 접수 시점(2026-06-28) 대비 지금까지 반영된 신호:
  - E-E-A-T 신호 5종 (바이라인·저자 블록·schema 3종)
  - 저신뢰 시그널 제거 (WPCode 201)
  - 리디렉션 통합 (www/http/insights)
  - 콘텐츠 3편 신규 (PMS는 심사 이전, UK ETS + 목포항은 심사 중)
  - Search Console 오류 3건 재검증 요청

---

## Scenario A — 승인 시 액션 플랜

**Probability estimate**: 이번 심사 40~50%

### 승인 감지 방법

- AdSense 대시보드에서 "검토 중" → "게재 가능" 상태 변경
- 이메일 알림 수신
- 사이트에 `<script async src="pagead2.googlesyndication.com...">` 태그 넣지 않아도 자동 반영 시도

### 승인 직후 (24시간 이내)

1. **광고 게재 확인**
   - AdSense 코드가 이미 head에 삽입돼 있으므로 자동 광고 게재 시작
   - 24시간 이내 첫 광고 노출 확인 (모바일·데스크톱 각각)
2. **광고 배치 최적화 대기**
   - 첫 2주는 Auto Ads로 두고 데이터 수집
   - CTR·RPM 지표 확인 (한국 상선 니치 예상: RPM $3~5)

### 승인 후 1주 이내

3. **홀드 콘텐츠 발행**
   - 바이오매스 펠릿 한글판 (어휘 정리 완료 후) — 발행일 목표 2026-07-10~12
4. **fairwayeta.com AdSense 재신청 준비**
   - fairwayeta에도 동일 E-E-A-T 시스템 이식 (바이라인·저자 블록·schema 3종)
   - 이식 완료 후 재신청 → 이번엔 계정 신뢰도 상승 상태
5. **콘텐츠 파이프라인 재가동**
   - 군산항 (실사진 확보 후) — 발행일 목표 2026-07-15
   - TD3C 한글판 explainer

### 승인 후 1개월 이내

6. **수익화 확장**
   - 광고 위치 수동 최적화 (본문 상단 1개, 본문 중단 1개, 관련 글 위 1개)
   - Ezoic 등 대체 광고 네트워크 검토
7. **fairwayeta 승인 후**
   - Ezoic 또는 Mediavine 대체 검토 (RPM $8~15 가능)

---

## Scenario B — 거절 시 액션 플랜

**Probability estimate**: 이번 심사 50~60%

**우선순위 원칙**: 4회 연속 거절 시 계정 flag 위험 → 재신청 전 2주 이상 대기 + 실질 개선 필수

### 거절 감지 즉시 (Day 0)

1. **거절 사유 확인**
   - AdSense 대시보드에서 정확한 거절 사유 문구 캡처
   - "가치가 별로 없는 콘텐츠" 재판정 여부 확인
   - 신규 사유 (예: "탐색 문제", "정책 위반") 등장 여부 확인

2. **재신청 즉시 X — 2주 대기 시작**
   - 4회 연속 거절은 계정 위험. 반드시 대기
   - 대기 기간 활용 계획 수립

### 거절 후 1주 (Day 1~7)

**우선순위 A: 콘텐츠 확장 (사이트 활력 신호)**

3. **바이오매스 펠릿 발행**
4. **군산항 발행** (실사진 확보 후)
5. **TD3C 한글판 발행**
6. **1편 이상 시장·규제 최신 분석 신규 발행**

목표: 재신청 시점까지 발행 65편 이상 달성 (현재 57편 + 8편 이상 신규)

**우선순위 B: 거절 사유별 대응**

7. **"가치가 별로 없는 콘텐츠" 재판정 시**
   - 초기 발행글 6편 재검토: 그림자 함대·선급·빙급·톤수·PSC·Vetting
   - 각 글에 한국 실무 anchor 추가 (사례·회사·수치)
   - 발행일 유지하되 내용 depth 강화
8. **"탐색 문제" 신규 등장 시**
   - 사이트맵 재제출 (56편 → 65편+ 반영)
   - 홈페이지 내부 링크 구조 개선 (본문 링크 밀도 증가)
   - Kadence 관련 글 자동 표시 확인
9. **"정책 위반" 신규 등장 시** (가능성 낮음)
   - Privacy·Terms·About 재검토
   - Contact 정보 접근성 확인
   - Cookie 정책 페이지 신설 검토

### 거절 후 2주 (Day 8~14)

**우선순위 C: About 페이지·저자 신뢰도 강화**

10. **About 페이지 개편**
    - 편집팀 구성 명시 (익명 유지하되 팀 구조 명확화)
    - 콘텐츠 원칙 항목 확장
    - 편집 정책 링크 페이지 신설 (`/editorial-policy/`)
11. **저자 페이지 신설 (schema.org Person)**
    - `/authors/faircast-editorial/` 페이지
    - Editorial team 소개, 편집 원칙, 연락처
    - Schema.org Person 마크업으로 편집팀을 조직 자산으로 등록

**우선순위 D: 기술 신호 재점검**

12. **Search Console 오류 상태 확인**
    - 이번 세션에서 재검증 요청한 3건 통과 여부
    - 새로 감지된 오류 있는지 스캔
13. **PageSpeed Insights 확인**
    - 홈페이지·주요 글 3편 모바일·데스크톱 점수 확인
    - LCP·CLS·FID 지표 개선 여지 검토
14. **모바일 사용성**
    - 모바일에서 실제 열어보고 광고 게재 시 레이아웃 안정성 시뮬레이션

### 거절 후 2주 후 (Day 15~) — 재신청

15. **재신청 실행**
    - AdSense → faircast.kr → "문제를 수정했음을 확인합니다"
    - 메모 (구조 개선 근거):
      - 사이트 나이: 접수 시점(2026-04) 대비 3.5개월 → 재신청 시점 4.5개월+
      - 발행 콘텐츠: 최소 65편+ (재신청 시점)
      - 저자 시스템: Faircast 편집팀 + Author schema
      - E-E-A-T 신호: 저자 블록·Organization·WebSite·Article schema
      - 색인 페이지: 100+ (재신청 시점)
16. **재신청 후 fairwayeta 처리 결정**
    - faircast.kr 재심사 진행 중에는 fairwayeta 신청 자제
    - 계정 신뢰도 회복 우선

### 거절 시 절대 하지 말 것

- ❌ 즉시 재신청 (24시간 내)
- ❌ 콘텐츠를 빠르게 대량 삭제 (기존 색인 파괴)
- ❌ 사이트 대규모 재편 (심사관 혼란)
- ❌ 광고 코드를 head에서 삭제 (재신청 시 다시 넣어야 함)
- ❌ fairwayeta.com도 함께 재신청 (계정 부담 가중)

---

## 잔여 작업 및 대기 사항

### 심사 대기 중 (즉시 실행 가능한 것)

1. **아무것도 안 하는 게 최선** — 초조하게 자잘한 변경 반복하면 크롤러 재방문 사이클 흐트러뜨림. 이번 세션에서 개선한 것이 크롤에 반영될 시간 확보 필요.

### 심사 결과 나온 후

- **승인 시**: Scenario A 실행 (1주 이내 홀드 콘텐츠 발행 재개)
- **거절 시**: Scenario B 실행 (2주 대기 + 실질 개선 + 재신청)

### Deferred (심사 결과와 무관)

- 바이오매스 펠릿 어휘 완결 (검증 대화창 재검토 필요)
- 군산항 실사진 확보
- 제주항 초안
- 광양·여수 후속 분석 (2편 시리즈 후속)

---

## 세션 인수인계 노트

### 다음 Claude 세션이 알아야 할 것

1. **파일 우선 확인**:
   - `AUTHORS-v3_faircast_260628.txt` (페르소나)
   - `project-guidelines-v7_faircast_260705.txt` (v7 통합본, 은유 직역 대응 조항 포함)
   - 이 로그 (v4)

2. **AdSense 상태**: 2026-06-28 접수, 2026-07-08 심사 11일차. AdSense 대시보드 지급·광고·사이트 3단계 모두 완료 상태에서 "검토 중". 결과 예상 남은 시간 4~18일.

3. **금지사항**:
   - 심사 결과 나오기 전 재신청 X (불가능하기도 함)
   - 심사 대기 중 사이트 대규모 변경 X
   - "AI 도구가 개선을 도왔다"는 표현 콘텐츠 노출 금지

4. **모니터링 방식** (v3 확립):
   - `https://faircast.kr/hello-korea-page/` → 한국어 글 목록
   - `https://faircast.kr/hello-world-page/` → 영문 글 목록
   - `https://faircast.kr/port-guide/` → 항만 가이드
   - 위 3개 fetch 후 개별 글 URL 자동 잠금해제 → 개별 fetch 가능

5. **홀드 콘텐츠**:
   - 바이오매스 펠릿 한글판 — 어휘 정리 완료 (2026-07-05 대화 로그 참조)
   - 군산항 한글판 — 실사진 확보 대기

6. **주의**: 이전 인수인계서에는 "발행 29편" 등 낡은 수치가 있을 수 있음. 실제는 2026-07-08 기준 57편 (발행) + 2편 (비공개 초안).

7. **지침 v7 준수**:
   - 은유 실체 검증 필수 (특히 "청구서 도착", "돈이 움직인다" 류)
   - 초안 작성 후 검증 대화창 이관 전 반드시 은유 6개 grep 실행
   - 원문 metaphor 이식 지양

8. **Search Console 재검증 진행 중**:
   - 리디렉션이 포함된 페이지 (5)
   - 크롤링됨 - 색인 안 됨 (21)
   - 리디렉션 오류 (1, /insights/)
   - 세 건 모두 [수정 확인] 클릭 완료. 2~4주 내 자동 재크롤 예정.

---

## WPCode 스니펫 인벤토리 (2026-07-08 갱신)

| ID | 이름 | 유형 | 상태 | 이번 세션 변경 |
|----|------|------|------|--------------|
| 529 | Category Archive Noindex | PHP | Active | - |
| 494 | (제목 없는 스니펫) | PHP | Active | - |
| 406 | Legacy World Cup 301 Redirects | PHP | Active | ⚠️ **`/insights/` 처리 추가 (작업 3)** |
| 378 | Meta Description from Excerpt | PHP | Active | - |
| 361 | Exclude Tags from Sitemap | PHP | Active | - |
| 359 | Force non-www + http redirect | PHP | Active | - (v3에서 통합 완료) |
| 358 | Tag Archive Noindex | PHP | Active | - |
| 259 | GA4 Tracking | HTML | Active | - |
| 220 | Faircast 도식 CSS | CSS | Active | - |
| 201 | 이미지·SVG 우클릭/드래그 차단 | HTML | **Deactivated** | - (v3에서 비활성화 완료) |
| 69 | Enable Shortcodes in Category Description | PHP | Active | - |
| 68 | Korea Port Atlas Map | HTML | Active | - |
| 67 | 댓글을 완전히 비활성화합니다 | PHP | Active (Outdated) | - |
| 66 | 글의 첫 번째 단락 뒤에 메시지 표시 | Text | Active | - |
| (신규) | Author Bio Block — After Post Content | PHP | Active | - (v3에서 신설) |
| (신규) | Schema.org — Organization + WebSite | HTML | Active | - (v3에서 신설) |
| (신규) | Schema.org — Article + Author | PHP | Active | - (v3에서 신설) |

**총 17개** (활성 15개 + 비활성 1 + Outdated 1)

---

## E-E-A-T 강화 신호 최종 상태 (2026-07-08 기준)

심사관이 재크롤 시 볼 신호 총합:

### Experience (경험)
- About: "Faircast는 Fairtech의 마린 엔지니어 팀이 운영합니다"
- 개별 글 하단: "현업 경험을 가진 편집진이 IMO·IACS·한국선급·해양수산부 등 1차 자료를 바탕으로 글을 발행합니다"

### Expertise (전문성)
- Schema Organization knowsAbout: Maritime shipping, Shipbuilding, Port operations, IMO regulations, Charter markets, Korean maritime industry
- 카테고리 구조 (Insights / Industry / Market / Geopolitics / Routes·Ports)
- 발행 57편 (평균 3,000자+, 상선 산업 심층 분석)
- 항만 가이드 9개 (부산·인천·울산·광양여수·평택당진·동해·대산·마산·목포)

### Authoritativeness (권위)
- 통일된 바이라인 "Faircast 편집팀" (57편 전체)
- Article schema + Author schema (모든 글)
- Organization parentOrganization Fairtech
- 4개 관련 사이트 sameAs 연결

### Trust (신뢰)
- 광고와 콘텐츠 분리 명시 (About + 글 하단 저자 블록)
- 1차 출처 명시 원칙
- HTTPS 100%
- Privacy / Terms / Contact 완비
- 저신뢰 시그널 (우클릭 차단) 제거
- 리디렉션 통합 및 `/insights/` 오류 해결
- Tag URL 정규화

---

## Traffic Trends Analysis (2026-06-13 ~ 2026-07-08)

| Date | Users (7d) | Sessions | Search Clicks | Impressions | 발행 |
|------|-----------|----------|---------------|-------------|------|
| 2026-06-26 | 67 | 65 | 23 | 671 | 29 |
| 2026-06-28 | 57 | 34 | 28 | 954 | 29 |
| 2026-07-01 | 37 | 34 | 30 | 1,080 | 55 |
| 2026-07-04 | 27 | 22 | 33 | 1,200 | 56 |
| 2026-07-05 | 41 | 41 | 43 | 1,470 | 56 |
| **2026-07-08** | **28** | **27** | **40** | **1,460** | **57** |

**해석**:
- GA4 사용자 지표는 여름·심사 대기 요인으로 변동성 있음
- Search Console 노출·클릭은 4주간 지속 성장 (671 → 1,460)
- 목포항 발행 즉시 7뷰 확인 = 사이트 활력 신호는 유지

---

## File Inventory (2026-07-08)

| File | Location | Purpose |
|------|----------|---------|
| project-guidelines-v7 | 프로젝트 폴더 | Workflow rules (통합본) |
| AUTHORS-v3 | 프로젝트 폴더 | Persona definitions |
| Previous log v3 | `docs/adsense-approval-log-v3-260705.md` | Historical |
| **This log v4** | `docs/adsense-approval-log-v4-260708.md` | **Current** |
| 목포항 최종 HTML | `/mnt/user-data/outputs/mokpo-port-final.html` | 발행 완료 |
| 바이오매스 한글판 HTML | 이전 세션 outputs | On hold (어휘 정리 완료) |
| UK ETS 시장 반응 HTML | 이전 세션 outputs | 발행 완료 |

---

## 다음 세션 즉시 확인할 것

**세션 시작 시 사용자에게 확인:**

1. AdSense 대시보드 상태 (검토 중 유지 / 승인 / 거절)
2. Search Console 세 건 재검증 결과 (통과 / 시작됨 / 실패)
3. 지난 세션 이후 신규 발행 여부

이 3가지 확인 후 Scenario A 또는 B 실행 시작.

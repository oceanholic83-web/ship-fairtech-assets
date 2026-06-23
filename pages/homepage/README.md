# Faircast Homepage Builder

faircast.kr 홈페이지(post=269)의 정적 HTML을 자동 생성합니다.

## 구조

pages/homepage/
├── config.json      ← Pick 슬러그, 카테고리 라벨, 설정
├── template.html    ← HTML 템플릿 (플레이스홀더)
├── build.js         ← 빌더 (REST API fetch → 치환 → 출력)
├── homepage.html    ← 빌드 결과물 (WP에 복붙)
└── README.md        ← 이 문서

## 홈페이지 섹션 구성

1. **최신 발행 3편** — 자동 (최신순, Pick 제외)
2. **K-Junior Desk's Pick 3편** — config.json deskPick 슬러그
3. **K-Junior Pro's Pick 3편** — config.json proPick 슬러그
4. **더 읽기 8편** — 자동 (최신순, Pick·최신3 제외)

## 실행 방법 (PowerShell)

cd C:\Users\user\Desktop\CURSOR\ship-fairtech-assets\pages\homepage
node build.js

이미 homepage 폴더 안에 있으면 node build.js만 입력.
PowerShell에서 && 안 됨. 두 줄 나눠서 입력.

## 빌드 후 배포

1. homepage.html 파일 열기 (메모장 또는 VS Code)
2. 내용 전체 복사 (Ctrl+A → Ctrl+C)
3. 워드프레스 → 페이지 → post=269 편집 → 코드 편집기
4. 기존 전체 삭제 → 붙여넣기 → 업데이트

## Pick 변경

config.json에서 슬러그만 교체:

{
  "deskPick": ["slug-1", "slug-2", "slug-3"],
  "proPick": ["slug-1", "slug-2", "slug-3"]
}

변경 후 node build.js 재실행 → homepage.html 재배포.

## 새 기사 발행 시 홈페이지 업데이트 루틴

1. 워드프레스에서 기사 발행 완료
2. Pick 변경이 필요하면 config.json 수정
3. node build.js 실행
4. homepage.html → WP post=269 코드 편집기 복붙
5. 업데이트

## 주의사항

- node build.js는 faircast.kr REST API를 실시간 호출하므로 인터넷 연결 필요
- 빌드 결과물 homepage.html은 git에 포함하지 않아도 됨 (매번 재생성)
- template.html의 CSS에 word-break:keep-all이 hero 제목에만 적용됨 (본문 X)
- 발행 글 수(STAT_POSTS)는 API에서 자동 계산

## Cursor 오더 규칙

이 프로젝트에서 "홈페이지 빌드해줘"라는 요청을 받으면:

1. Pick 변경 요청이 있으면 config.json 수정
2. cd pages/homepage && node build.js 실행
3. 빌드 성공 로그 확인
4. "homepage.html 생성 완료. WP post=269 코드 편집기에 복붙하세요." 안내

git push는 하지 않음 (homepage.html은 매번 재생성).
config.json을 수정한 경우에만 git add/commit/push.

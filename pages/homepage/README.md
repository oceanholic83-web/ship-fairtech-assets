# Faircast Home Builder

faircast.kr 홈페이지(Faircast Insights, post=269)의 정적 HTML을 자동 생성합니다.

## 작동 방식

1. `faircast.kr/wp-json/wp/v2/posts` REST API 호출
2. Editor's Pick 3편 (config.json의 슬러그) 별도 fetch
3. 최신 3편 = Editor's Pick 제외한 최근 3편
4. 단축 리스트 8편 = 그 다음 8편
5. 각 글에서 제목·발췌·날짜·카테고리·FIFU 썸네일 추출
6. `template.html`에 치환 → `dist/homepage.html` 출력

## 실행

```bash
cd home-builder
node build.js
```

의존성 없음. Node 18+ 내장 fetch만 사용.

## 출력

`dist/homepage.html` 파일이 생성됩니다. 이 파일 통째로 복사 → WordPress "Faircast Insights" 페이지 → 코드 편집기 → 붙여넣기 → 업데이트.

## Editor's Pick 변경

`config.json`의 `editorsPick` 배열에서 슬러그만 바꾸면 됩니다.

## 카테고리 라벨 추가

`config.json`의 `categoryLabels`에 카테고리 ID와 한국어 라벨을 매핑합니다.

## 빌드 결과 확인

빌드 후 `dist/homepage.html`을 브라우저로 열어서 미리보기 가능합니다.

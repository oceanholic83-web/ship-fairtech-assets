# jsDelivr 캐시 우회 가이드

faircast.kr 의 항만 가이드 페이지는 ship-fairtech-assets repo의 4개 파일을 jsDelivr CDN을 통해 로드한다 (loader.js → data.js / port-atlas-header.js / port-atlas.js). jsDelivr는 `@main` 브랜치 단위로 파일을 캐싱하며, 같은 URL 안에서 파일이 갱신되면 캐시 무효화(purge)가 필요하다. 그러나 jsDelivr의 purge API는 응답이 `finished`로 와도 실제 edge 노드 전파에 시간이 걸리고, 가끔은 무한정 stale 상태로 남는 경우가 있다. 이 문제를 해결하기 위해 **commit hash 기반 cache-busting** 구조를 사용한다.

## 구조

loader.js는 자기 자신의 `<script src>` URL에서 commit hash 부분을 자동 추출한다.

```javascript
const REPO_BASE = (() => {
  const scripts = document.querySelectorAll('script[src]');
  for (const s of scripts) {
    const m = s.src.match(/^(https:\/\/cdn\.jsdelivr\.net\/gh\/oceanholic83-web\/ship-fairtech-assets@[^/]+)\/loader\.js/);
    if (m) return m[1];
  }
  return 'https://cdn.jsdelivr.net/gh/oceanholic83-web/ship-fairtech-assets@main';
})();
```

WPCode 스니펫 "Korea Port Atlas Map" (ID 68)에서 loader.js를 `@<commit_hash>/loader.js`로 호출하면, loader.js가 자동으로 같은 hash를 base로 사용하여 나머지 3개 파일을 같은 hash에서 로드한다. 따라서 jsDelivr의 stale `@main` 캐시를 우회한다.

## 갱신 절차 (코드 변경 후)

1. Cursor 오더 실행 → 코드 변경 → commit → push
2. push 출력에서 새 commit hash 받는다 (앞 7자리)
3. 워드프레스 어드민 → WPCode → 스니펫 ID 68 "Korea Port Atlas Map" → 편집
4. 3번째 줄의 loader.js URL에서 hash 부분을 새 hash로 교체:
```html
   <script src="https://cdn.jsdelivr.net/gh/oceanholic83-web/ship-fairtech-assets@<NEW_HASH7>/loader.js"></script>
```
5. **업데이트** 클릭
6. 시크릿창에서 `faircast.kr/category/port-guide/` 확인

## 주의

- WPCode src의 hash와 loader.js 안의 REPO_BASE는 같은 hash로 동기화될 필요가 없다. loader.js가 자기 URL에서 hash를 추출하므로, WPCode src의 hash 하나만 갱신하면 자동으로 모든 파일이 같은 hash로 로드된다.
- purge API는 더 이상 필수가 아니다. hash 자체가 cache key를 분리하므로 새 hash로 호출하는 순간 fresh fetch 발생.
- 응급 시 fallback: WPCode src를 `@main`으로 되돌리면 jsDelivr의 latest `@main` 캐시를 사용 (캐시가 fresh하다면 작동).

## 적용 이력

- 2026-06-05 — loader.js 자가-추출 base 도입 (commit 8aed81d)

# 오더: 항만 가이드 페이지 — 여백·간격 전체 정리

2개 작업: loader.js 수정 + WPCode CSS 스니펫 추가 안내

---

## PART 1: loader.js — 내부 간격 축소

파일: `loader.js` (repo root)

### EDIT 1 — 전체 wrapper margin 축소

Find:
```
      <div style="margin:24px 0;">
```

Replace:
```
      <div style="margin:8px 0 16px;">
```

### EDIT 2 — 패널 하단 margin 축소

Find:
```
margin-bottom:12px;font-family:ui-sans-serif
```

Replace:
```
margin-bottom:8px;font-family:ui-sans-serif
```

### EDIT 3 — 지도 상단 margin 축소

Find:
```
overflow:hidden;margin-top:12px;"
```

Replace:
```
overflow:hidden;margin-top:8px;"
```

### EDIT 4 — 범례 상단 margin 축소

Find:
```
gap:10px;margin-top:10px;font-family
```

Replace:
```
gap:10px;margin-top:6px;font-family
```

### EDIT 5 — 패널 padding 컴팩트화

Find:
```
border-radius:10px;padding:14px 18px;margin-bottom
```

Replace:
```
border-radius:10px;padding:10px 16px;margin-bottom
```

---

## PART 1 완료 후

```bash
git add loader.js
git commit -m "style: port-guide page - reduce all spacing and margins"
git push origin main
```

Push 후 jsDelivr 퍼지:
브라우저에서 열기:
```
https://purge.jsdelivr.net/gh/oceanholic83-web/ship-fairtech-assets@main/loader.js
```

---

## PART 2: Kadence 테마 여백 — WPCode CSS 추가

이 부분은 Cursor가 아니라 **워드프레스에서 직접** 해야 함.
WPCode ID 220 "Faircast 도식 CSS" 스니펫에 아래 CSS를 **맨 아래에 추가**:

```css
/* 항만 가이드 카테고리 페이지 여백 축소 */
body.category-port-guide .entry-hero.page-hero-section .entry-header{min-height:80px!important}
body.category-port-guide .content-area{margin-top:1rem!important;margin-bottom:1.5rem!important}
body.category-port-guide .loop-entry .entry-content-wrap{padding:1.2rem!important}
body.category-port-guide .loop-entry{margin-bottom:0!important}
body.category-port-guide .entry-hero-container-inner{padding-top:20px!important;padding-bottom:10px!important}
```

### WPCode 수정 경로:
워드프레스 → WPCode → 스니펫 목록 → ID 220 "Faircast 도식 CSS" 편집 → 기존 CSS 맨 아래에 위 코드 추가 → 저장

---

## 검증

시크릿 창에서 `faircast.kr/category/port-guide/` 열어서 확인:
- "항만 가이드" 제목 ~ 패널 간격 줄어듦
- 패널 ~ 지도 간격 줄어듦
- 지도 ~ 카드 목록 간격 줄어듦
- 카드 간 간격 줄어듦
- 하단 여백 줄어듦

# 오더: 홈페이지 HTML 엔티티 수정 + 이미지 alt 태그 추가

두 파일 수정: `pages/homepage/build.js` + `pages/homepage/template.html`

---

## PART 1: build.js — HTML 엔티티 디코딩 보강

In `pages/homepage/build.js`, find the `stripHtml` function.

Find this exact block:

```
    .replace(/&#8230;/g, '…')
    .replace(/\s+/g, ' ')
```

Replace with:

```
    .replace(/&#8230;/g, '…')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&hellip;/g, '…')
    .replace(/&#038;/g, '&')
    .replace(/&#0?39;/g, "'")
    .replace(/&[a-zA-Z]+;/g, '')
    .replace(/\s+/g, ' ')
```

The last line `.replace(/&[a-zA-Z]+;/g, '')` is a catch-all that strips any remaining named HTML entities to prevent raw entity text from appearing in the output.

---

## PART 2: template.html — background-image를 img 태그로 변경 + alt 추가

In `pages/homepage/template.html`, replace ALL card image divs with img tags.

### Latest cards (lines 14, 16, 18)

Find each occurrence of this pattern:
```
<div class="fct-card-img" style="background-image:url('{{LATEST_N_IMG}}');"></div>
```

Replace with:
```
<img class="fct-card-img" src="{{LATEST_N_IMG}}" alt="{{LATEST_N_TITLE}}" loading="lazy">
```

Specifically:

Find:
```
<a href="{{LATEST_1_URL}}" class="fct-card"><div class="fct-card-img" style="background-image:url('{{LATEST_1_IMG}}');"></div>
```
Replace:
```
<a href="{{LATEST_1_URL}}" class="fct-card"><img class="fct-card-img" src="{{LATEST_1_IMG}}" alt="{{LATEST_1_TITLE}}" loading="lazy">
```

Find:
```
<a href="{{LATEST_2_URL}}" class="fct-card"><div class="fct-card-img" style="background-image:url('{{LATEST_2_IMG}}');"></div>
```
Replace:
```
<a href="{{LATEST_2_URL}}" class="fct-card"><img class="fct-card-img" src="{{LATEST_2_IMG}}" alt="{{LATEST_2_TITLE}}" loading="lazy">
```

Find:
```
<a href="{{LATEST_3_URL}}" class="fct-card"><div class="fct-card-img" style="background-image:url('{{LATEST_3_IMG}}');"></div>
```
Replace:
```
<a href="{{LATEST_3_URL}}" class="fct-card"><img class="fct-card-img" src="{{LATEST_3_IMG}}" alt="{{LATEST_3_TITLE}}" loading="lazy">
```

### Pick cards (lines 26, 28, 30)

Find:
```
<a href="{{PICK_1_URL}}" class="fct-card"><div class="fct-card-img" style="background-image:url('{{PICK_1_IMG}}');"></div>
```
Replace:
```
<a href="{{PICK_1_URL}}" class="fct-card"><img class="fct-card-img" src="{{PICK_1_IMG}}" alt="{{PICK_1_TITLE}}" loading="lazy">
```

Find:
```
<a href="{{PICK_2_URL}}" class="fct-card"><div class="fct-card-img" style="background-image:url('{{PICK_2_IMG}}');"></div>
```
Replace:
```
<a href="{{PICK_2_URL}}" class="fct-card"><img class="fct-card-img" src="{{PICK_2_IMG}}" alt="{{PICK_2_TITLE}}" loading="lazy">
```

Find:
```
<a href="{{PICK_3_URL}}" class="fct-card"><div class="fct-card-img" style="background-image:url('{{PICK_3_IMG}}');"></div>
```
Replace:
```
<a href="{{PICK_3_URL}}" class="fct-card"><img class="fct-card-img" src="{{PICK_3_IMG}}" alt="{{PICK_3_TITLE}}" loading="lazy">
```

### CSS update for img tag

In the same template.html `<style>` block, find:
```
.fct-card-img{aspect-ratio:16/10;background:#f1f5f9 center/cover no-repeat;display:block}
```

Replace with:
```
.fct-card-img{aspect-ratio:16/10;background:#f1f5f9;display:block;width:100%;height:auto;object-fit:cover}
```

---

## After all edits, run:

```bash
cd pages/homepage && node build.js
```

## Verify:

1. `homepage.html` contains `<img class="fct-card-img"` (not `<div class="fct-card-img"`)
2. `homepage.html` contains `alt="`
3. `homepage.html` contains `loading="lazy"`
4. `homepage.html` does NOT contain `&mdash;` as raw text (search for it)
5. `homepage.html` does NOT contain `&#038;` as raw text

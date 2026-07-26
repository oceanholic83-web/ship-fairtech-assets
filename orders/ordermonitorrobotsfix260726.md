# Cursor Order — Monitor robots-meta false positive fix (2026-07-26, order 4)

## Why

The full monitor run reported:

```
🔴 catNoindex https://faircast.kr/category/port-guide/: max-image-preview:large
```

This was a **false positive**. Verified by browser view-source: the page carries **two**
robots meta tags.

```html
<meta name='robots' content='max-image-preview:large' />   <!-- WordPress core -->
<meta name="robots" content="noindex, follow">              <!-- snippet 529 -->
```

Snippet 529 works correctly. The monitor read only the first tag with
`$('meta[name="robots"]').attr('content')` and concluded noindex was missing.

This resolves the "미확정" item carried since log v7: **529 is confirmed working.**

## What changes

`scripts/site-monitor.js` only. A `robotsContent($)` helper now joins the content of every
robots meta tag, and the three call sites use it:

- `checkSinglePost` (post noindex detection)
- `checkKeyPages` (indexability of key pages)
- `checkCategoryNoindex` (the check that produced the false CRITICAL)

The other two sites were producing correct verdicts by accident but had the same latent
blind spot — a second tag adding noindex would have gone unnoticed.

## Step 1 — Replace the file

`scripts/site-monitor.js` is provided alongside this order. Overwrite it. Do not hand-merge.

## Step 2 — Syntax check

```
node --check scripts/site-monitor.js
```

Expected: no output.

## Step 3 — Run the full monitor

```
node scripts/site-monitor.js
```

Expected changes vs the previous run:

- `catNoindex https://faircast.kr/category/port-guide/` is no longer CRITICAL
- infra CRITICAL count goes from **1 to 0**
- the report's category noindex row now shows both values joined, e.g.
  `max-image-preview:large | noindex, follow`

Everything else should be unchanged: infra warnings 0, buildStamp ✅, 61 posts with 0 issues.

If any NEW critical appears, stop and report it rather than committing.

## Step 4 — Commit and push

Run each line separately. PowerShell does not support `&&`.

```
git status
git add scripts/site-monitor.js
git commit -m "monitor: read all robots meta tags, not just the first"
git push
```

`git status` must NOT stage anything under `monitor/reports/`, nor `config.local.json`,
nor `port-guide.html`.

## Step 5 — Report back

Report the summary block from Step 3 (the 🔴/🟡/✅ counts) and `git log -1 --oneline`.

## Do NOT

- Do not edit `data.js`, `build.js`, `template.html`, `port-atlas*.js`, `loader.js`,
  or `monitor/expected-state.json`.
- Do not commit generated reports.

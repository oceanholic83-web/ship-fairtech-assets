# Cursor Order — Monitor build-stamp check (2026-07-26, order 3)

## Goal

Close the last hole in the port guide pipeline.

`data.js` → `build.js` → `port-guide.html` → **human pastes into WordPress**. That last step
is manual and has failed before (목포항, 2026-07-07: data.js was updated, the page never was,
and the card list stayed wrong for weeks).

`build.js` now stamps every build into the generated HTML:

```
<!-- faircast-port-guide data-rev:31c177d5 built:2026-07-26 -->
```

This order teaches `site-monitor.js` to read that stamp off the live page and compare it to a
fresh hash of the local `data.js`. Mismatch → CRITICAL.

Files changed: `scripts/site-monitor.js`, `monitor/expected-state.json`.
**Do not touch anything else.**

---

## Step 1 — Replace two files

Both files are provided alongside this order. Overwrite:

- `scripts/site-monitor.js`
- `monitor/expected-state.json`

Do not hand-merge. Replace them wholesale.

### What changed in `scripts/site-monitor.js`

- added `const crypto = require('crypto');`
- added `buildStamp: null` to the `detail` object
- added `async function checkBuildStamp(expected)` just above `checkPolicyRedFlags`
- wired the call into both modes — full is now `[10/10]`, quick is now `[4/4]`
- added a `## 빌드 스탬프` section to the report builder

### What changed in `monitor/expected-state.json`

One new top-level `buildStamp` block:

```json
"buildStamp": {
  "checkUrl": "https://faircast.kr/port-guide/",
  "sourceFile": "data.js",
  "marker": "faircast-port-guide"
}
```

---

## Step 2 — Syntax check

```
node --check scripts/site-monitor.js
```

Expected: no output (success).

```
node -e "JSON.parse(require('fs').readFileSync('monitor/expected-state.json','utf8')); console.log('json ok')"
```

Expected: `json ok`

---

## Step 3 — Run the monitor

```
node scripts/site-monitor.js --quick
```

`--quick` takes about 10 seconds. Expected output now ends with a 4th step:

```
[1/4] legacyRedirects...
[2/4] robotsTxt...
[3/4] snippetFootprints...
[4/4] buildStamp...
```

**The buildStamp result is the point of this order.** Two outcomes are correct:

- ✅ `buildStamp <hash> (2026-07-26) = 로컬 data.js` — the live page matches local data.js.
  This is what we expect right now, since the page was pasted today.
- 🔴 CRITICAL with `data-rev:...` mismatch — would mean the page is stale.

If it reports 🔴 **스탬프 없음**, the live page does not contain the comment. That would mean
the current WordPress page is older than order 1. Report it and stop.

---

## Step 4 — Deliberately verify the alarm works

A check that never fires is worthless. Prove it fires.

Temporarily append one blank line to the end of `data.js`:

```
node -e "require('fs').appendFileSync('data.js','\n')"
node scripts/site-monitor.js --quick
```

Expected: buildStamp now reports 🔴 CRITICAL, because the local hash changed while the live
page did not. Exit code should be 1.

Then undo it — this must leave `data.js` byte-identical to HEAD:

```
git checkout -- data.js
git status
```

`git status` must show `data.js` as unmodified. Confirm this before continuing.

Then re-run to confirm it returns to green:

```
node scripts/site-monitor.js --quick
```

Expected: buildStamp ✅ again.

---

## Step 5 — Commit and push

Run each line separately. PowerShell does not support `&&`.

```
git status
git add scripts/site-monitor.js monitor/expected-state.json
git commit -m "monitor: detect stale port-guide paste via build stamp"
git push
```

`git status` must NOT list `data.js`, `config.local.json`, `port-guide.html`, or anything under
`monitor/reports/` as staged.

---

## Step 6 — Report back

Report:
1. the `[4/4] buildStamp` line and its verdict from Step 3
2. whether Step 4 produced a 🔴 as expected, and that `git status` showed data.js clean afterwards
3. `git log -1 --oneline`

---

## Do NOT

- Do not edit `data.js`, `build.js`, `template.html`, `port-atlas*.js`, `loader.js`.
- Do not commit `data.js` if Step 4 left it modified — restore it first.
- Do not commit `config.local.json` or generated reports.

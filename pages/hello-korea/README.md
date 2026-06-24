# Hello, Korea Page Builder

Builds the **Hello, Korea** category landing page HTML for faircast.kr.

## Run

```powershell
cd pages\hello-korea
node build.js
```

## Output

`hello-korea.html` — copy into the WordPress **code editor** for page **post=488**.

## Notes

- Fetches post list via the fairwayeta monitor API, then loads full `_embed` data from faircast.kr REST API.
- Re-run after new articles are published in this category.

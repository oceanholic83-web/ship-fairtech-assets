# Hello, World Page Builder

Builds the **Hello, World** category landing page HTML for faircast.kr.

## Run

```powershell
cd pages\hello-world
node build.js
```

## Output

`hello-world.html` — copy into the WordPress **code editor** for page **post=490**.

## Notes

- Fetches post list via the fairwayeta monitor API, then loads full `_embed` data from faircast.kr REST API.
- Re-run after new articles are published in this category.

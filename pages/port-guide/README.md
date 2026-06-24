# Port Guide Page Builder

Builds the **항만 가이드** (Korea Port Atlas) page HTML for faircast.kr — hero panel plus the existing map/port list via `loader.js`.

## Run

```powershell
cd pages\port-guide
node build.js
```

## Output

`port-guide.html` — copy into a WordPress page **code editor** (create the page manually, then paste).

## What it includes

1. **Hero panel** — compact navy panel with Cloudinary background image (same style as hello-korea / hello-world)
2. **Port atlas** — `PORT_ATLAS_CONFIG`, `#korea-port-app`, and `loader.js` from jsDelivr (unchanged)

## After WP page is created

Add `wpPostId` to `config.json` and optional `body.page-id-XXX` CSS in `template.html` to hide the theme page title (same pattern as other builders).

## Disable WPCode snippet

After testing the new page, disable WPCode snippet **ID 68** ("Korea Port Atlas Map") to avoid duplicate map injection.

## Config

| Key | Purpose |
|-----|---------|
| `heroImage` | Hero background (Cloudinary) |
| `mapboxToken` | Mapbox token — set in `config.local.json` (not committed) |
| `loaderUrl` | jsDelivr URL for `loader.js` (pin to commit hash when needed) |

### Local secrets

```powershell
copy config.local.json.example config.local.json
# Edit config.local.json — add your Mapbox public token
node build.js
```

## Notes

- No post fetching — static config + template only
- `loader.js` / `port-atlas.js` logic is not modified; they still load from jsDelivr

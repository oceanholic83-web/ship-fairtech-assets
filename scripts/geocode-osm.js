#!/usr/bin/env node
/**
 * Geocode entries in data.js via Nominatim (OpenStreetMap).
 * Usage: node scripts/geocode-osm.js <CATEGORY_NAME>
 * No API key required. Rate-limited to 1 req/sec.
 */
const fs = require('fs');
const vm = require('vm');
const https = require('https');

const CATEGORY = process.argv[2];
if (!CATEGORY) {
  console.error('Usage: node scripts/geocode-osm.js <CATEGORY_NAME>');
  process.exit(1);
}

const DATA_FILE = 'data.js';
const rawCode = fs.readFileSync(DATA_FILE, 'utf8');

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(rawCode, ctx);
const dataObj = ctx.window.PORT_ATLAS_DATA;

if (!dataObj || !dataObj[CATEGORY]) {
  console.error(`ERROR: Category '${CATEGORY}' not found`);
  process.exit(1);
}

// Flatten nested categories (CUSTOMS_PORTS is grouped by region)
let entries;
const raw = dataObj[CATEGORY];
if (Array.isArray(raw)) {
  entries = raw;
} else if (raw && typeof raw === 'object') {
  // Object grouped by region — flatten items[] from each group
  entries = [];
  for (const groupKey of Object.keys(raw)) {
    const group = raw[groupKey];
    if (group && Array.isArray(group.items)) {
      entries.push(...group.items);
    }
  }
  if (entries.length === 0) {
    console.error(`ERROR: ${CATEGORY} object had no items[] arrays to flatten`);
    process.exit(1);
  }
  console.log(`(Flattened ${CATEGORY} from object: ${entries.length} entries total)`);
} else {
  console.error(`ERROR: ${CATEGORY} is neither array nor object`);
  process.exit(1);
}

function geocodeRaw(query) {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=kr&format=json&limit=1&accept-language=ko`;
    const req = https.get(url, {
      headers: {
        'User-Agent': 'FaircastPortAtlas/1.0 (hello@fairtech.kr)',
        'Accept-Language': 'ko'
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (Array.isArray(json) && json.length > 0) {
            const d = json[0];
            resolve({
              lat: parseFloat(d.lat),
              lng: parseFloat(d.lon),
              matchedAddress: d.display_name || '',
            });
          } else {
            resolve(null);
          }
        } catch (e) { reject(new Error(`Parse error: ${e.message}; body: ${body.substring(0,200)}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function cleanAddress(addr) {
  // Generate progressively cleaner variants of an address
  const variants = [addr];
  // Variant 2: strip everything after first comma (removes building name + floor)
  if (addr.includes(',')) {
    variants.push(addr.split(',')[0].trim());
  }
  // Variant 3: also strip parenthetical content
  const noParens = (variants[variants.length - 1]).replace(/\s*\([^)]*\)/g, '').trim();
  if (noParens !== variants[variants.length - 1]) {
    variants.push(noParens);
  }
  return Array.from(new Set(variants));
}

async function geocode(address) {
  const variants = cleanAddress(address);
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const result = await geocodeRaw(v);
    if (result) {
      result.usedVariant = v;
      result.fallbackLevel = i;
      return result;
    }
    if (i < variants.length - 1) {
      // Rate limit between fallback attempts
      await new Promise(r => setTimeout(r, 1100));
    }
  }
  return null;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

(async () => {
  console.log(`\n=== Geocoding ${CATEGORY} (${entries.length} entries) via Nominatim ===\n`);
  const results = [];
  for (const e of entries) {
    if (e.lat && e.lng) {
      results.push({ name: e.name, status: 'ALREADY_HAS_COORDS' });
      console.log(`  [SKIP] ${e.name} (already has coords)`);
      continue;
    }
    if (!e.address) {
      results.push({ name: e.name, status: 'NO_ADDRESS' });
      console.log(`  [SKIP] ${e.name} (no address)`);
      continue;
    }
    try {
      const coord = await geocode(e.address);
      if (coord) {
        results.push({ name: e.name, address: e.address, ...coord, status: 'OK' });
        const fb = coord.fallbackLevel > 0 ? ` (fallback L${coord.fallbackLevel}: "${coord.usedVariant}")` : '';
        console.log(`  [OK]   ${e.name} → ${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}${fb}`);
      } else {
        results.push({ name: e.name, address: e.address, status: 'NO_RESULT' });
        console.log(`  [FAIL] ${e.name} (no result for: ${e.address})`);
      }
    } catch (err) {
      results.push({ name: e.name, address: e.address, status: 'ERROR', error: err.message });
      console.log(`  [ERR]  ${e.name} (${err.message})`);
    }
    // Nominatim rate limit: 1 req/sec
    await new Promise(r => setTimeout(r, 1100));
  }

  let updatedCode = rawCode;
  let appliedCount = 0;
  for (const r of results) {
    if (r.status !== 'OK') continue;
    // Match both multi-line and single-line entry formats
    const multiLinePattern = new RegExp(
      `(\\{[^{}]*?name:\\s*'${escapeRegex(r.name)}'[^{}]*?)(\\n\\s*\\},)`
    );
    const singleLinePattern = new RegExp(
      `(\\{[^{}]*?name:\\s*'${escapeRegex(r.name)}'[^{}]*?)(\\s*\\},)`
    );
    let namePattern = multiLinePattern;
    if (!updatedCode.match(multiLinePattern)) {
      namePattern = singleLinePattern;
    }
    const match = updatedCode.match(namePattern);
    if (!match) {
      console.log(`  [WARN] Entry not found in source: ${r.name}`);
      continue;
    }
    if (match[0].includes('lat:')) {
      console.log(`  [WARN] Already has lat in source: ${r.name}`);
      continue;
    }
    updatedCode = updatedCode.replace(namePattern, (_, body, close) => {
      const isSingleLine = !close.startsWith('\n');
      if (isSingleLine) {
        return `${body}, lat: ${r.lat}, lng: ${r.lng}${close}`;
      }
      return `${body}\n      lat: ${r.lat},\n      lng: ${r.lng},${close}`;
    });
    appliedCount++;
  }

  if (appliedCount > 0) {
    fs.writeFileSync(DATA_FILE, updatedCode);
    console.log(`\n✅ Applied ${appliedCount} new coords to ${DATA_FILE}`);
  } else {
    console.log(`\n(No new coords applied)`);
  }

  const ok = results.filter(r => r.status === 'OK').length;
  const skip = results.filter(r => ['ALREADY_HAS_COORDS', 'NO_ADDRESS'].includes(r.status)).length;
  const fail = results.filter(r => ['NO_RESULT', 'ERROR'].includes(r.status)).length;
  console.log(`\nSummary: ${ok} new | ${skip} skipped | ${fail} failed\n`);

  if (fail > 0) {
    console.log('Failed entries (to be retried with corrected addresses):');
    results.filter(r => ['NO_RESULT', 'ERROR'].includes(r.status))
      .forEach(r => console.log(`  - ${r.name}: ${r.address || '(no address)'}`));
  }
})();

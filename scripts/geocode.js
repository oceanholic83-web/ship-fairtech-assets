#!/usr/bin/env node
/**
 * Geocode entries in data.js via Kakao Local API.
 * Usage: node scripts/geocode.js <CATEGORY_NAME>
 * Env: KAKAO_REST_API_KEY required.
 */
const fs = require('fs');
const vm = require('vm');
const https = require('https');

const KEY = process.env.KAKAO_REST_API_KEY;
if (!KEY) {
  console.error('ERROR: KAKAO_REST_API_KEY not set in env');
  process.exit(1);
}

const CATEGORY = process.argv[2];
if (!CATEGORY) {
  console.error('Usage: node scripts/geocode.js <CATEGORY_NAME>');
  process.exit(1);
}

const DATA_FILE = 'data.js';
const rawCode = fs.readFileSync(DATA_FILE, 'utf8');

// Evaluate data.js in a sandboxed context with window mock
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(rawCode, ctx);
const dataObj = ctx.window.PORT_ATLAS_DATA;

if (!dataObj || !dataObj[CATEGORY]) {
  console.error(`ERROR: Category '${CATEGORY}' not found in data.js`);
  process.exit(1);
}

const entries = dataObj[CATEGORY];
if (!Array.isArray(entries)) {
  console.error(`ERROR: ${CATEGORY} is not an array`);
  process.exit(1);
}

function geocode(address) {
  return new Promise((resolve, reject) => {
    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
    const req = https.get(url, {
      headers: { Authorization: `KakaoAK ${KEY}` }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.documents && json.documents.length > 0) {
            const d = json.documents[0];
            resolve({
              lat: parseFloat(d.y),
              lng: parseFloat(d.x),
              matchedAddress: d.address_name || d.road_address?.address_name || '',
            });
          } else {
            resolve(null);
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

(async () => {
  console.log(`\n=== Geocoding ${CATEGORY} (${entries.length} entries) ===\n`);
  const results = [];
  for (const e of entries) {
    if (e.lat && e.lng) {
      results.push({ name: e.name, status: 'ALREADY_HAS_COORDS', lat: e.lat, lng: e.lng });
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
        console.log(`  [OK]   ${e.name} → ${coord.lat}, ${coord.lng}`);
      } else {
        results.push({ name: e.name, address: e.address, status: 'NO_RESULT' });
        console.log(`  [FAIL] ${e.name} (no result for: ${e.address})`);
      }
    } catch (err) {
      results.push({ name: e.name, address: e.address, status: 'ERROR', error: err.message });
      console.log(`  [ERR]  ${e.name} (${err.message})`);
    }
    await new Promise(r => setTimeout(r, 50));
  }

  // Apply OK results to data.js
  let updatedCode = rawCode;
  let appliedCount = 0;
  for (const r of results) {
    if (r.status !== 'OK') continue;
    const namePattern = new RegExp(
      `(\\{[^{}]*?name:\\s*'${escapeRegex(r.name)}'[^{}]*?)(\\n\\s*\\},)`
    );
    const match = updatedCode.match(namePattern);
    if (!match) {
      console.log(`  [WARN] Entry not found in source for: ${r.name}`);
      continue;
    }
    if (match[0].includes('lat:')) {
      console.log(`  [WARN] Already has lat in source: ${r.name}`);
      continue;
    }
    updatedCode = updatedCode.replace(namePattern, (_, body, close) =>
      `${body}\n      lat: ${r.lat},\n      lng: ${r.lng},${close}`
    );
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
    console.log('Failed entries:');
    results.filter(r => ['NO_RESULT', 'ERROR'].includes(r.status))
      .forEach(r => console.log(`  - ${r.name}: ${r.address || '(no address)'}`));
  }
})();

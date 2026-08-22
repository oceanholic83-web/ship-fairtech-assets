#!/usr/bin/env node
/**
 * Cloudinary 원본 → WebP 변환 (faircast.kr)
 *
 * 입력  : cloudinary-export-faircast/   (download-cloudinary.ps1 결과, 237장)
 * 출력  : ../faircast-images/img/       (신설할 이미지 전용 레포)
 * 매핑  : audit/image-map.json          (URL 치환 단계가 소비)
 *
 * 원본은 건드리지 않는다. 워드프레스도 건드리지 않는다.
 *
 * 사용법 (레포 루트에서):
 *   npm i sharp
 *   node scripts/convert-webp.js --dry     # 계획만 출력
 *   node scripts/convert-webp.js
 *
 * 출력 경로를 바꾸려면:
 *   node scripts/convert-webp.js --out ..\faircast-images\img
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'cloudinary-export-faircast');
const INV = path.join(ROOT, 'audit', 'cloudinary-inventory.json');
const MAP_FILE = path.join(ROOT, 'audit', 'image-map.json');

const DRY = process.argv.includes('--dry');
const outIdx = process.argv.indexOf('--out');
const OUT_DIR = outIdx > -1 ? path.resolve(process.argv[outIdx + 1])
                            : path.resolve(ROOT, '..', 'faircast-images', 'img');

// 본문 최대 폭이 1100px(홈 wrapper 기준). 레티나 여유로 1600.
const MAX_WIDTH = 1600;
const QUALITY = 82;

let sharp;
try {
  sharp = require('sharp');
} catch {
  console.error('sharp 없음.  npm i sharp  먼저 실행.');
  process.exit(1);
}

if (!fs.existsSync(INV)) { console.error('audit/cloudinary-inventory.json 없음. audit-cloudinary.ps1 먼저.'); process.exit(1); }
if (!fs.existsSync(SRC_DIR)) { console.error('cloudinary-export-faircast/ 없음. download-cloudinary.ps1 먼저.'); process.exit(1); }

const inv = JSON.parse(fs.readFileSync(INV, 'utf8').replace(/^﻿/, ''));
const assets = inv.assets;
console.log(`인벤토리 자산 ${assets.length}개`);

// --- 디스크 인덱스 (다운로드 시 한글은 디코딩되어 저장됨) -------------------
const disk = new Map();
for (const f of fs.readdirSync(SRC_DIR)) {
  if (f.startsWith('_')) continue;
  disk.set(f, path.join(SRC_DIR, f));
  disk.set(encodeURIComponent(f), path.join(SRC_DIR, f)); // 퍼센트 인코딩 키도 등록
}
console.log(`디스크 파일 ${fs.readdirSync(SRC_DIR).filter(f => !f.startsWith('_')).length}개`);

/**
 * 출력 파일명.
 * Cloudinary가 붙이는 6자 접미사는 계정 전체에서 유일하다.
 * ASCII 이름은 그대로 쓰고, 한글 이름은 접미사만 남겨 ASCII로 만든다.
 */
function outputName(publicId) {
  const decoded = decodeURIComponent(publicId);
  if (/^[A-Za-z0-9._-]+$/.test(decoded)) return `${decoded}.webp`;
  const m = decoded.match(/_([a-z0-9]{6})$/i);
  if (m) return `${m[1]}.webp`;
  return `${decoded.replace(/[^A-Za-z0-9._-]/g, '') || 'img'}.webp`;
}

// --- 계획 -------------------------------------------------------------------
const plan = [];
const missing = [];
const collide = new Map();

for (const a of assets) {
  const pid = a.public_id;
  const decoded = decodeURIComponent(pid);
  let src = null;
  for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '.gif']) {
    if (disk.has(decoded + ext)) { src = disk.get(decoded + ext); break; }
    if (disk.has(pid + ext))     { src = disk.get(pid + ext);     break; }
  }
  if (!src) { missing.push(pid); continue; }

  const out = outputName(pid);
  if (collide.has(out)) console.warn(`  이름 충돌: ${pid} 와 ${collide.get(out)} 가 모두 ${out}`);
  collide.set(out, pid);

  plan.push({ public_id: pid, src, out, refs: a.ref_count, kinds: a.kinds });
}

if (missing.length) {
  console.log(`\n디스크에서 못 찾은 자산 ${missing.length}개 — 이 URL은 Cloudinary에 남는다:`);
  for (const m of missing) console.log(`  ${m}`);
  console.log('플랜 해지 전에 반드시 해결할 것.\n');
}

console.log(`변환 대상 ${plan.length}개  →  ${OUT_DIR}`);

if (DRY) {
  console.log('\n--dry : 아무것도 쓰지 않음. 샘플 10개:');
  for (const p of plan.slice(0, 10)) console.log(`  ${p.public_id}  ->  ${p.out}`);
  const kr = plan.filter(p => p.public_id !== p.out.replace(/\.webp$/, ''));
  console.log(`\n이름이 바뀌는 것 ${kr.length}개 (한글/인코딩):`);
  for (const p of kr.slice(0, 10)) console.log(`  ${decodeURIComponent(p.public_id)}  ->  ${p.out}`);
  process.exit(0);
}

// --- 변환 -------------------------------------------------------------------
fs.mkdirSync(OUT_DIR, { recursive: true });

(async () => {
  let done = 0, failed = 0, bytesIn = 0, bytesOut = 0;
  const entries = [];

  for (const p of plan) {
    try {
      const inSize = fs.statSync(p.src).size;
      const dest = path.join(OUT_DIR, p.out);
      await sharp(p.src)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(dest);
      const outSize = fs.statSync(dest).size;

      bytesIn += inSize; bytesOut += outSize;
      entries.push({
        public_id: p.public_id,
        public_id_decoded: decodeURIComponent(p.public_id),
        file: p.out,
        bytes_in: inSize,
        bytes_out: outSize,
        refs: p.refs,
        kinds: p.kinds,
      });
      done++;
      if (done % 25 === 0) console.log(`  ${done}/${plan.length}`);
    } catch (e) {
      failed++;
      console.error(`  실패 ${p.public_id}: ${e.message}`);
    }
  }

  const map = {
    generated: new Date().toISOString(),
    note: 'Cloudinary public_id → 로컬 WebP 파일명. URL 치환 단계가 소비한다.',
    outputDir: OUT_DIR,
    baseUrlPlaceholder: 'https://cdn.jsdelivr.net/gh/<user>/<repo>@<tag>/img/',
    unresolved: missing,
    entries,
  };
  fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));

  console.log('\n────────────────────────────────');
  console.log(`변환   : ${done}`);
  console.log(`실패   : ${failed}`);
  console.log(`미해결 : ${missing.length}`);
  console.log(`입력   : ${(bytesIn / 1024 / 1024).toFixed(1)} MB`);
  console.log(`출력   : ${(bytesOut / 1024 / 1024).toFixed(1)} MB`);
  console.log(`감소율 : ${(100 - (bytesOut / bytesIn) * 100).toFixed(0)}%`);
  console.log(`출력처 : ${OUT_DIR}`);
  console.log(`매핑   : audit/image-map.json`);
  console.log('\n워드프레스는 아직 아무것도 바뀌지 않았다. URL 치환은 다음 단계.');
})();

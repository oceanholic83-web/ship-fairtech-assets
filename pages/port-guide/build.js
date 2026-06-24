#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const localPath = path.join(__dirname, 'config.local.json');
if (fs.existsSync(localPath)) {
  Object.assign(cfg, JSON.parse(fs.readFileSync(localPath, 'utf8')));
}
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const OUTPUT = path.join(__dirname, 'port-guide.html');

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escJs(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function main() {
  console.log('Building Port Guide page...');

  if (!cfg.mapboxToken) {
    console.error('mapboxToken missing. Copy config.local.json.example → config.local.json and set your token.');
    process.exit(1);
  }

  let out = TEMPLATE;
  const vars = {
    title: escHtml(cfg.title),
    eyebrow: escHtml(cfg.eyebrow),
    description: escHtml(cfg.description),
    badge: escHtml(cfg.badge),
    heroImage: cfg.heroImage,
    mapboxToken: escJs(cfg.mapboxToken),
    loaderUrl: cfg.loaderUrl,
  };

  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  fs.writeFileSync(OUTPUT, out);
  console.log(`✓ Generated: ${OUTPUT}`);
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

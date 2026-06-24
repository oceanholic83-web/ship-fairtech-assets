#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const localPath = path.join(__dirname, 'config.local.json');
if (fs.existsSync(localPath)) {
  Object.assign(cfg, JSON.parse(fs.readFileSync(localPath, 'utf8')));
}
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const OUTPUT = path.join(__dirname, 'port-guide.html');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function stripHtml(s) {
  return (s || '')
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&#8217;/g, "'").replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&').replace(/&#8230;/g, '…')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, '').replace(/<[^>]*>/g, '').trim();
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escJs(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function fmtDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function fetchPostBySlug(slug) {
  try {
    const url = `${cfg.monitorApi}?key=${encodeURIComponent(cfg.monitorKey)}&mode=post&slug=${encodeURIComponent(slug)}`;
    const post = await fetchJson(url);
    return post && post.id ? post : null;
  } catch (e) {
    console.warn(`  ⚠ Failed: ${slug}: ${e.message}`);
    return null;
  }
}

function extractMeta(post) {
  let imgUrl = cfg.fallbackImage;
  const fifu = post.meta?.fifu_image_url || post.featured_image_url;
  if (fifu) imgUrl = fifu;
  else if (post._embedded?.['wp:featuredmedia']?.[0]?.source_url) {
    imgUrl = post._embedded['wp:featuredmedia'][0].source_url;
  }

  const TAG_EXCLUDE = cfg.excludeCategoryIds || [];
  const CAT_LABELS = cfg.categoryLabels || {};
  let catTags = [];
  if (post._embedded?.['wp:term']) {
    const terms = post._embedded['wp:term'][0] || [];
    catTags = terms
      .filter(t => !TAG_EXCLUDE.includes(t.id))
      .map(t => (CAT_LABELS[String(t.id)] || t.name || '').toUpperCase())
      .filter(Boolean);
  }

  let rawExc = stripHtml(post.excerpt?.rendered || '');
  if (!rawExc && post.content?.rendered) {
    rawExc = stripHtml(post.content.rendered);
  }
  const excerpt = rawExc.length > cfg.excerptMaxLen ? rawExc.slice(0, cfg.excerptMaxLen) + '…' : rawExc;

  return {
    url: post.link,
    title: stripHtml(post.title.rendered),
    excerpt,
    catTags: catTags.join(' · ') || '항만 가이드',
    imgUrl,
    date: fmtDate(post.date),
  };
}

async function main() {
  console.log('Building Port Guide page...');

  if (!cfg.mapboxToken) {
    console.error('mapboxToken missing. Copy config.local.json.example → config.local.json and set your token.');
    process.exit(1);
  }

  console.log(`1. Fetching articles in category ${cfg.categoryId}...`);
  const monitorUrl = `${cfg.monitorApi}?key=${encodeURIComponent(cfg.monitorKey)}`;
  const monitor = await fetchJson(monitorUrl);
  const categoryPosts = monitor.posts
    .filter(p => p.categories.includes(cfg.categoryId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  console.log(`   Found ${categoryPosts.length} articles`);

  console.log(`2. Fetching full data for ${categoryPosts.length} posts...`);
  const fullPosts = await Promise.all(categoryPosts.map(p => fetchPostBySlug(p.slug)));
  const metas = fullPosts.filter(Boolean).map(extractMeta);

  const cardsHtml = metas.map(m => `
<a href="${escHtml(m.url)}" class="fct-bigcard"><img class="fct-bigcard-img" src="${escHtml(m.imgUrl)}" alt="${escHtml(m.title)}" loading="lazy"><div class="fct-bigcard-body"><span class="fct-bigcard-tag">${escHtml(m.catTags)} · ${escHtml(m.date)}</span><h3 class="fct-bigcard-ttl">${escHtml(m.title)}</h3><p class="fct-bigcard-exc">${escHtml(m.excerpt)}</p></div></a>`).join('\n');

  let out = TEMPLATE;
  const vars = {
    title: escHtml(cfg.title),
    eyebrow: escHtml(cfg.eyebrow),
    description: escHtml(cfg.description),
    badge: escHtml(cfg.badge),
    heroImage: cfg.heroImage,
    mapboxToken: escJs(cfg.mapboxToken),
    loaderUrl: cfg.loaderUrl,
    cards: cardsHtml,
  };

  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }

  fs.writeFileSync(OUTPUT, out);
  console.log(`✓ Generated: ${OUTPUT}`);
  console.log(`  Article cards: ${metas.length}`);
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

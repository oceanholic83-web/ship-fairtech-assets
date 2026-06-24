#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
const TEMPLATE = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const OUTPUT = path.join(__dirname, path.basename(__dirname) + '.html');

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
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&#8230;/g, '…')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function escHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}

async function fetchPostBySlug(slug) {
  try {
    const url = `${cfg.site}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed`;
    const arr = await fetchJson(url);
    return arr && arr[0] ? arr[0] : null;
  } catch (e) {
    console.warn(`  ⚠ Failed to fetch ${slug}: ${e.message}`);
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

  const rawExc = stripHtml(post.excerpt?.rendered || '');
  const excerpt = rawExc.length > cfg.excerptMaxLen ? rawExc.slice(0, cfg.excerptMaxLen) + '…' : rawExc;

  return {
    url: post.link,
    title: stripHtml(post.title.rendered),
    excerpt,
    catTags: catTags.join(' · '),
    imgUrl,
    date: fmtDate(post.date),
  };
}

async function main() {
  console.log(`Building ${cfg.categoryName} page...`);
  console.log(`1. Fetching posts from category ${cfg.categoryId}...`);

  const monitorUrl = `${cfg.monitorApi}?key=${encodeURIComponent(cfg.monitorKey)}`;
  const monitor = await fetchJson(monitorUrl);

  const categoryPosts = monitor.posts.filter(p => p.categories.includes(cfg.categoryId));
  console.log(`   Found ${categoryPosts.length} posts in this category`);

  const limit = Math.min(cfg.postsPerPage || 24, categoryPosts.length);
  console.log(`2. Fetching full data for ${limit} posts (with _embed)...`);

  const fullPosts = await Promise.all(
    categoryPosts.slice(0, limit).map(p => fetchPostBySlug(p.slug))
  );
  const validPosts = fullPosts.filter(Boolean);
  const metas = validPosts.map(extractMeta);

  console.log(`3. Rendering ${metas.length} cards...`);

  const cardsHtml = metas.map(m => `
<a href="${escHtml(m.url)}" class="fct-card"><img class="fct-card-img" src="${escHtml(m.imgUrl)}" alt="${escHtml(m.title)}" loading="lazy"><div class="fct-card-body"><span class="fct-card-tag">${escHtml(m.catTags)} · ${escHtml(m.date)}</span><h3 class="fct-card-ttl">${escHtml(m.title)}</h3><p class="fct-card-exc">${escHtml(m.excerpt)}</p></div></a>`).join('\n');

  let out = TEMPLATE;
  out = out.replace(/\{\{CATEGORY_NAME\}\}/g, escHtml(cfg.categoryName));
  out = out.replace(/\{\{TOTAL_COUNT\}\}/g, String(categoryPosts.length));
  out = out.replace(/\{\{CARDS\}\}/g, cardsHtml);

  fs.writeFileSync(OUTPUT, out);
  console.log(`✓ Generated: ${OUTPUT}`);
  console.log(`  Total posts: ${categoryPosts.length}`);
  console.log(`  Cards rendered: ${metas.length}`);
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

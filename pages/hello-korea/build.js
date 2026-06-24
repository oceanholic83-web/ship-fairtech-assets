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
  let catIds = [];
  if (post._embedded?.['wp:term']) {
    const terms = post._embedded['wp:term'][0] || [];
    const filtered = terms.filter(t => !TAG_EXCLUDE.includes(t.id));
    catTags = filtered.map(t => (CAT_LABELS[String(t.id)] || t.name || '').toUpperCase()).filter(Boolean);
    catIds = filtered.map(t => t.id);
  }

  const rawExc = stripHtml(post.excerpt?.rendered || '');
  const excerpt = rawExc.length > cfg.excerptMaxLen ? rawExc.slice(0, cfg.excerptMaxLen) + '…' : rawExc;

  return {
    url: post.link,
    title: stripHtml(post.title.rendered),
    excerpt,
    catTags: catTags.join(' · '),
    catIds: catIds.join(','),
    imgUrl,
    date: fmtDate(post.date),
    slug: post.slug,
  };
}

function pickRandom(arr, exclude) {
  const pool = arr.filter(s => !exclude.includes(s));
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
}

async function main() {
  console.log(`Building ${cfg.categoryName}...`);

  const monitorUrl = `${cfg.monitorApi}?key=${encodeURIComponent(cfg.monitorKey)}`;
  const monitor = await fetchJson(monitorUrl);
  const categoryPosts = monitor.posts.filter(p => p.categories.includes(cfg.categoryId));
  console.log(`Found ${categoryPosts.length} posts`);

  // Latest 3 slugs
  const latestSlugs = categoryPosts.slice(0, 3).map(p => p.slug);

  // Pick 3 slugs (only for hello-korea)
  let pickSlugs = [];
  if (cfg.pickFromHomepage && cfg.pickFixed) {
    pickSlugs.push(cfg.pickFixed);

    // Read homepage config for deskPick and proPick
    const homepageConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'homepage', 'config.json'), 'utf8'));
    const deskRandom = pickRandom(homepageConfig.deskPick || [], [cfg.pickFixed]);
    const proRandom = pickRandom(homepageConfig.proPick || [], [cfg.pickFixed, deskRandom]);
    if (deskRandom) pickSlugs.push(deskRandom);
    if (proRandom) pickSlugs.push(proRandom);
  }

  // Fetch latest 3 + pick 3 + all category posts (for full list)
  const latestPostsData = await Promise.all(latestSlugs.map(fetchPostBySlug));
  const pickPostsData = pickSlugs.length > 0 ? await Promise.all(pickSlugs.map(fetchPostBySlug)) : [];
  const allPostsData = await Promise.all(categoryPosts.map(p => fetchPostBySlug(p.slug)));

  const latestMetas = latestPostsData.filter(Boolean).map(extractMeta);
  const pickMetas = pickPostsData.filter(Boolean).map(extractMeta);
  const allMetas = allPostsData.filter(Boolean).map(extractMeta);

  // Latest cards HTML
  const latestCardsHtml = latestMetas.map(m => `
<a href="${escHtml(m.url)}" class="fct-bigcard"><img class="fct-bigcard-img" src="${escHtml(m.imgUrl)}" alt="${escHtml(m.title)}" loading="lazy"><div class="fct-bigcard-body"><span class="fct-bigcard-tag">${escHtml(m.catTags)} · ${escHtml(m.date)}</span><h3 class="fct-bigcard-ttl">${escHtml(m.title)}</h3><p class="fct-bigcard-exc">${escHtml(m.excerpt)}</p></div></a>`).join('\n');

  // Pick cards HTML
  const pickCardsHtml = pickMetas.map(m => `
<a href="${escHtml(m.url)}" class="fct-bigcard"><img class="fct-bigcard-img" src="${escHtml(m.imgUrl)}" alt="${escHtml(m.title)}" loading="lazy"><div class="fct-bigcard-body"><span class="fct-bigcard-tag pick">PICK · ${escHtml(m.catTags)}</span><h3 class="fct-bigcard-ttl">${escHtml(m.title)}</h3><p class="fct-bigcard-exc">${escHtml(m.excerpt)}</p></div></a>`).join('\n');

  // Category filter bar
  const CAT_LABELS = cfg.categoryLabels || {};
  const categoryCounts = {};
  allMetas.forEach(m => {
    m.catIds.split(',').filter(Boolean).forEach(idStr => {
      const id = parseInt(idStr, 10);
      if (CAT_LABELS[String(id)]) {
        categoryCounts[id] = (categoryCounts[id] || 0) + 1;
      }
    });
  });

  const filterButtons = Object.keys(categoryCounts)
    .sort((a, b) => categoryCounts[b] - categoryCounts[a])
    .map(id => `<button class="fct-filter-btn" data-cat="${id}">${escHtml(CAT_LABELS[id])} <span class="fct-filter-count">${categoryCounts[id]}</span></button>`)
    .join('\n');

  // Full list HTML
  const fullListHtml = allMetas.map(m => `
<a href="${escHtml(m.url)}" class="fct-listitem" data-cats="${escHtml(m.catIds)}"><span class="fct-listitem-date">${escHtml(m.date)}</span><span class="fct-listitem-ttl">${escHtml(m.title)}</span><span class="fct-listitem-tags">${escHtml(m.catTags)}</span></a>`).join('\n');

  // Pick section visibility
  const pickSectionHtml = pickMetas.length > 0 ? `
<div class="fct-section-head"><h2 class="fct-section-h">${escHtml(cfg.categoryName)}'s Pick</h2><span class="fct-section-sub">매체가 추천하는 글 3편</span></div>
<section class="fct-biggrid">
${pickCardsHtml}
</section>` : '';

  let out = TEMPLATE;
  out = out.replace(/\{\{CATEGORY_NAME\}\}/g, escHtml(cfg.categoryName));
  out = out.replace(/\{\{TOTAL_COUNT\}\}/g, String(categoryPosts.length));
  out = out.replace(/\{\{LATEST_CARDS\}\}/g, latestCardsHtml);
  out = out.replace(/\{\{PICK_SECTION\}\}/g, pickSectionHtml);
  out = out.replace(/\{\{FILTER_BUTTONS\}\}/g, filterButtons);
  out = out.replace(/\{\{FULL_LIST\}\}/g, fullListHtml);

  fs.writeFileSync(OUTPUT, out);
  console.log(`✓ Generated: ${OUTPUT}`);
  console.log(`  Latest: ${latestMetas.length}, Pick: ${pickMetas.length}, Total: ${allMetas.length}`);
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

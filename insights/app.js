(function () {
  'use strict';

  var API_URL = 'https://faircast.kr/wp-json/wp/v2/posts';

  var CAT_IDS = {
    insights: 192,
    'hello-korea': 1,
    'hello-world': 8,
    market: 228,
    industry: 229,
    routes: 230,
    geopolitics: 231,
    general: 232,
    'korea-market': 233,
    'korea-industry': 234,
    explainers: 235,
    'port-guide': 47,
  };

  var PINNED_KO = [
    'hormuz-reopening-tanker-rate-floor-supply-constraint-korea-2026',
    'busan-port-transshipment-hub-30-year-strategy',
    'shadow-fleet-dark-fleet-2026-korea-5-touchpoints-guide',
  ];

  var PINNED_EN = [
    'korea-four-industrial-ports-2026',
    'yard-capacity-binding-constraint-2026-newbuild-burst',
    'what-is-charter-party-voyage-time-bareboat-explained-2026',
  ];

  var LANG_TABS = [
    { id: 'hello-korea', label: 'Hello, Korea' },
    { id: 'hello-world', label: 'Hello, World' },
  ];

  var CAT_TABS = {
    'hello-korea': [
      { id: 'all-ko',      label: '전체',     catId: null },
      { id: 'market',      label: '시장',     catId: CAT_IDS.market },
      { id: 'industry',    label: '산업',     catId: CAT_IDS.industry },
      { id: 'routes',      label: '항로·항만', catId: CAT_IDS.routes },
      { id: 'geopolitics', label: '지정학',   catId: CAT_IDS.geopolitics },
      { id: 'general',     label: '일반',     catId: CAT_IDS.general },
    ],
    'hello-world': [
      { id: 'all-en',         label: 'All',            catId: null },
      { id: 'korea-market',   label: 'Korea Market',   catId: CAT_IDS['korea-market'] },
      { id: 'korea-industry', label: 'Korea Industry', catId: CAT_IDS['korea-industry'] },
      { id: 'explainers',     label: 'Explainers',     catId: CAT_IDS.explainers },
    ],
  };

  var allPosts = [];
  var activeLang = 'hello-korea';
  var activeCat = 'all-ko';

  /* ─── design tokens ────────────────────────────────────────── */

  var C = {
    deep: '#0c1829',
    deepEnd: '#162032',
    teal: '#14b8a6',
    tealLight: '#99f6e4',
    tealBg: '#f0fdfa',
    surface: '#f1f5f9',
    card: '#ffffff',
    ink: '#0f172a',
    muted: '#64748b',
    faint: '#94a3b8',
    border: '#e2e8f0',
    amber: '#f59e0b',
  };

  /* ─── styles ─────────────────────────────────────────────── */

  function injectStyles() {
    var s = document.createElement('style');
    s.textContent = [
      /* reset & base */
      '#fct-insights-app{',
        'font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI","Apple SD Gothic Neo","Noto Sans KR",sans-serif;',
        'margin:0;padding:0;background:' + C.card + ';min-height:60vh;box-sizing:border-box;',
        'color:' + C.ink + ';line-height:1.6;}',
      '#fct-insights-app *{box-sizing:border-box;}',
      '#fct-insights-app a{color:inherit;text-decoration:none;}',

      /* ── HERO ── */
      '.fct-hero{',
        'background:linear-gradient(135deg,' + C.deep + ' 0%,' + C.deepEnd + ' 100%);',
        'padding:56px 24px 44px;text-align:center;position:relative;overflow:hidden;}',
      '.fct-hero::before{',
        'content:"";position:absolute;top:0;left:0;right:0;bottom:0;',
        'background:radial-gradient(ellipse at 30% 80%,rgba(20,184,166,0.06) 0%,transparent 60%),',
        'radial-gradient(ellipse at 70% 20%,rgba(20,184,166,0.04) 0%,transparent 50%);',
        'pointer-events:none;}',
      '.fct-hero-inner{position:relative;z-index:1;max-width:700px;margin:0 auto;}',
      '.fct-hero h1{',
        'font-size:42px;font-weight:800;color:#fff;margin:0 0 8px;',
        'letter-spacing:-0.03em;line-height:1.1;}',
      '.fct-hero-sub{font-size:16px;color:rgba(255,255,255,0.6);margin:0 0 20px;font-weight:400;}',

      /* hero stat badges */
      '.fct-hero-badges{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:24px;}',
      '.fct-badge{',
        'display:inline-flex;align-items:center;gap:5px;',
        'padding:5px 14px;border-radius:20px;font-size:12px;font-weight:600;',
        'background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.75);}',
      '.fct-badge-num{color:' + C.teal + ';font-weight:700;}',

      /* lang tabs in hero */
      '.fct-lang-tabs{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;}',
      '.fct-lang-tab{',
        'padding:8px 24px;border-radius:9999px;font-size:14px;font-weight:600;',
        'cursor:pointer;border:1.5px solid rgba(255,255,255,0.2);',
        'background:transparent;color:rgba(255,255,255,0.6);',
        'transition:all 0.2s;font-family:inherit;}',
      '.fct-lang-tab:hover{border-color:rgba(255,255,255,0.4);color:rgba(255,255,255,0.85);}',
      '.fct-lang-tab.active{background:' + C.teal + ';border-color:' + C.teal + ';color:#fff;}',

      /* ── CONTENT WRAPPER ── */
      '.fct-content{max-width:1100px;margin:0 auto;padding:0 20px;}',

      /* ── LEAD STORY ── */
      '.fct-lead{',
        'display:grid;grid-template-columns:1fr 1fr;gap:0;margin:36px 0 32px;',
        'border-radius:12px;overflow:hidden;background:' + C.card + ';',
        'border:1px solid ' + C.border + ';',
        'transition:box-shadow 0.25s,transform 0.25s;}',
      '.fct-lead:hover{box-shadow:0 8px 32px rgba(0,0,0,0.10);transform:translateY(-2px);}',
      '.fct-lead-img{width:100%;height:100%;min-height:320px;object-fit:cover;display:block;}',
      '.fct-lead-img-ph{width:100%;min-height:320px;background:' + C.deep + ';}',
      '.fct-lead-body{padding:32px 36px;display:flex;flex-direction:column;justify-content:center;}',
      '.fct-lead-cat{',
        'font-size:11px;font-weight:700;color:' + C.teal + ';',
        'text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;}',
      '.fct-lead-title{',
        'font-size:24px;font-weight:800;color:' + C.ink + ';',
        'line-height:1.35;letter-spacing:-0.02em;margin-bottom:14px;',
        'display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-lead-excerpt{',
        'font-size:15px;color:' + C.muted + ';line-height:1.7;margin-bottom:18px;',
        'display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-lead-date{font-size:12px;color:' + C.faint + ';}',

      /* ── FEATURED GRID (5 cards: 2 + 3) ── */
      '.fct-feat-section{margin-bottom:12px;}',
      '.fct-section-label{',
        'font-size:11px;font-weight:700;color:' + C.faint + ';',
        'text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;}',
      '#fct-featured-grid{',
        'display:grid;grid-template-columns:repeat(2,1fr);',
        'gap:20px;margin-bottom:20px;transition:opacity 0.2s;}',
      '#fct-featured-grid-b{',
        'display:grid;grid-template-columns:repeat(3,1fr);',
        'gap:20px;transition:opacity 0.2s;}',

      /* featured cards */
      '.fct-feat-card{',
        'border:1px solid ' + C.border + ';border-radius:10px;overflow:hidden;',
        'background:' + C.card + ';display:block;',
        'transition:box-shadow 0.2s,transform 0.2s;}',
      '.fct-feat-card:hover{box-shadow:0 6px 24px rgba(0,0,0,0.08);transform:translateY(-2px);}',
      '.fct-feat-img{width:100%;height:180px;object-fit:cover;display:block;background:' + C.deep + ';}',
      '.fct-feat-img-ph{width:100%;height:180px;background:' + C.deep + ';}',
      '.fct-feat-body{padding:16px 18px 20px;}',
      '.fct-feat-cat{',
        'font-size:10px;font-weight:700;color:' + C.teal + ';',
        'text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;}',
      '.fct-feat-title{',
        'font-size:16px;font-weight:700;color:' + C.ink + ';margin-bottom:8px;',
        'line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;',
        '-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-feat-excerpt{',
        'font-size:13px;color:' + C.muted + ';margin-bottom:10px;line-height:1.6;',
        'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-feat-date{font-size:12px;color:' + C.faint + ';}',

      /* ── ALL POSTS SECTION ── */
      '.fct-all-section{',
        'background:' + C.surface + ';margin:0 -20px;padding:40px 20px 48px;',
        'border-top:1px solid ' + C.border + ';}',
      '.fct-all-inner{max-width:1100px;margin:0 auto;}',
      '.fct-all-header{',
        'display:flex;align-items:baseline;gap:10px;margin-bottom:20px;}',
      '.fct-section-hd{',
        'font-size:22px;font-weight:800;color:' + C.ink + ';',
        'margin:0;letter-spacing:-0.02em;}',
      '.fct-all-count{font-size:15px;font-weight:400;color:' + C.faint + ';}',

      /* cat tabs */
      '.fct-cat-tab-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;}',
      '.fct-cat-tab{',
        'padding:7px 18px;border-radius:9999px;font-size:13px;font-weight:600;',
        'cursor:pointer;border:1.5px solid ' + C.border + ';background:' + C.card + ';color:' + C.muted + ';',
        'transition:all 0.15s;font-family:inherit;line-height:1.4;}',
      '.fct-cat-tab:hover{border-color:' + C.teal + ';color:#0f766e;}',
      '.fct-cat-tab.active{background:' + C.ink + ';border-color:' + C.ink + ';color:#fff;}',

      /* list items */
      '#fct-list{display:flex;flex-direction:column;width:100%;transition:opacity 0.15s;}',
      '.fct-list-item{',
        'display:flex;gap:18px;align-items:flex-start;width:100%;',
        'padding:18px 16px;border-radius:10px;background:' + C.card + ';',
        'margin-bottom:8px;border:1px solid transparent;',
        'transition:border-color 0.15s,box-shadow 0.15s;}',
      '.fct-list-item:hover{border-color:' + C.border + ';box-shadow:0 2px 12px rgba(0,0,0,0.04);}',
      '.fct-list-thumb{',
        'width:140px;min-width:140px;height:94px;',
        'object-fit:cover;border-radius:8px;display:block;background:' + C.deep + ';}',
      '.fct-list-thumb-ph{',
        'width:140px;min-width:140px;height:94px;',
        'background:' + C.deep + ';border-radius:8px;}',
      '.fct-list-body{flex:1;min-width:0;}',
      '.fct-list-meta{font-size:11px;color:' + C.faint + ';margin-bottom:5px;}',
      '.fct-list-meta-cat{color:' + C.teal + ';font-weight:600;}',
      '.fct-list-title{',
        'font-size:15px;font-weight:700;color:' + C.ink + ';',
        'margin-bottom:5px;line-height:1.45;',
        'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-list-excerpt{',
        'font-size:13px;color:' + C.muted + ';line-height:1.55;',
        'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',

      /* states */
      '.fct-loading{text-align:center;padding:56px;color:' + C.muted + ';font-size:15px;}',
      '.fct-error{text-align:center;padding:56px;color:#f87171;font-size:15px;}',
      '.fct-empty{text-align:center;padding:40px;color:' + C.faint + ';font-size:15px;}',

      /* ── FOOTER ── */
      '.fct-footer{',
        'background:' + C.deep + ';padding:36px 24px;margin:0 -20px;',
        'display:flex;justify-content:center;gap:14px;flex-wrap:wrap;}',
      '.fct-fl{',
        'padding:11px 24px;border-radius:8px;font-size:14px;font-weight:600;',
        'transition:opacity 0.15s,transform 0.15s;}',
      '.fct-fl:hover{opacity:0.88;transform:translateY(-1px);}',
      '.fct-fl-port{background:rgba(20,184,166,0.15);color:' + C.teal + ';border:1px solid rgba(20,184,166,0.3);}',
      '.fct-fl-eta{background:rgba(245,158,11,0.12);color:' + C.amber + ';border:1px solid rgba(245,158,11,0.25);}',
      '.fct-fl-en{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.12);}',

      /* ── RESPONSIVE ── */
      '@media(max-width:768px){',
        '.fct-hero{padding:40px 16px 32px;}',
        '.fct-hero h1{font-size:32px;}',
        '.fct-lead{grid-template-columns:1fr;}',
        '.fct-lead-img,.fct-lead-img-ph{min-height:220px;height:220px;}',
        '.fct-lead-body{padding:22px 20px;}',
        '.fct-lead-title{font-size:20px;}',
        '#fct-featured-grid{grid-template-columns:1fr;}',
        '#fct-featured-grid-b{grid-template-columns:1fr 1fr;}',
      '}',
      '@media(max-width:480px){',
        '.fct-hero h1{font-size:26px;}',
        '.fct-hero-sub{font-size:14px;}',
        '.fct-badge{font-size:11px;padding:4px 10px;}',
        '#fct-featured-grid-b{grid-template-columns:1fr;}',
        '.fct-list-thumb,.fct-list-thumb-ph{display:none;}',
        '.fct-list-item{padding:14px 12px;}',
        '.fct-lead-title{font-size:18px;}',
        '.fct-lead-body{padding:18px 16px;}',
      '}',
    ].join('');
    document.head.appendChild(s);
  }

  /* ─── helpers ─────────────────────────────────────────────── */

  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function decodeHtml(html) {
    var el = document.createElement('textarea');
    el.innerHTML = html;
    return el.value;
  }

  function getCategoryLabel(post) {
    if (!post._embedded || !post._embedded['wp:term']) return '';
    var terms = [].concat.apply([], post._embedded['wp:term']);
    var subIds = [
      CAT_IDS.market, CAT_IDS.industry, CAT_IDS.routes,
      CAT_IDS.geopolitics, CAT_IDS.general,
      CAT_IDS['korea-market'], CAT_IDS['korea-industry'], CAT_IDS.explainers,
    ];
    var sub = terms.find(function (t) { return subIds.indexOf(t.id) !== -1; });
    if (sub) return sub.name;
    var lang = terms.find(function (t) {
      return t.id === CAT_IDS['hello-korea'] || t.id === CAT_IDS['hello-world'];
    });
    return lang ? lang.name : '';
  }

  function getFeaturedImage(post) {
    try { return post._embedded['wp:featuredmedia'][0].source_url; }
    catch (e) { return null; }
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch (e) { return dateStr.slice(0, 10); }
  }

  function getExcerpt(post) {
    if (!post.excerpt || !post.excerpt.rendered) return '';
    return decodeHtml(post.excerpt.rendered
      .replace(/<[^>]+>/g, '')
      .replace(/\[&hellip;\]|\[…\]/g, '…')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim());
  }

  /* ─── card / item html ────────────────────────────────────── */

  function leadStoryHtml(post) {
    var imgUrl = getFeaturedImage(post);
    var catLabel = getCategoryLabel(post);
    var title = escapeHtml(decodeHtml(post.title.rendered.replace(/<[^>]+>/g, '')));
    var excerpt = escapeHtml(getExcerpt(post));
    var date = formatDate(post.date);
    var link = escapeHtml(post.link);
    return (
      '<a class="fct-lead" href="' + link + '" target="_blank" rel="noopener noreferrer">' +
        (imgUrl
          ? '<img class="fct-lead-img" src="' + escapeHtml(imgUrl) + '" alt="" loading="lazy">'
          : '<div class="fct-lead-img-ph"></div>') +
        '<div class="fct-lead-body">' +
          (catLabel ? '<div class="fct-lead-cat">' + escapeHtml(catLabel) + '</div>' : '') +
          '<div class="fct-lead-title">' + title + '</div>' +
          (excerpt ? '<div class="fct-lead-excerpt">' + excerpt + '</div>' : '') +
          '<div class="fct-lead-date">' + date + '</div>' +
        '</div>' +
      '</a>'
    );
  }

  function featuredCardHtml(post) {
    var imgUrl = getFeaturedImage(post);
    var catLabel = getCategoryLabel(post);
    var title = escapeHtml(decodeHtml(post.title.rendered.replace(/<[^>]+>/g, '')));
    var excerpt = escapeHtml(getExcerpt(post));
    var date = formatDate(post.date);
    var link = escapeHtml(post.link);
    return (
      '<a class="fct-feat-card" href="' + link + '" target="_blank" rel="noopener noreferrer">' +
        (imgUrl
          ? '<img class="fct-feat-img" src="' + escapeHtml(imgUrl) + '" alt="" loading="lazy">'
          : '<div class="fct-feat-img-ph"></div>') +
        '<div class="fct-feat-body">' +
          (catLabel ? '<div class="fct-feat-cat">' + escapeHtml(catLabel) + '</div>' : '') +
          '<div class="fct-feat-title">' + title + '</div>' +
          (excerpt ? '<div class="fct-feat-excerpt">' + excerpt + '</div>' : '') +
          '<div class="fct-feat-date">' + date + '</div>' +
        '</div>' +
      '</a>'
    );
  }

  function listItemHtml(post) {
    var imgUrl = getFeaturedImage(post);
    var catLabel = getCategoryLabel(post);
    var title = escapeHtml(decodeHtml(post.title.rendered.replace(/<[^>]+>/g, '')));
    var excerpt = escapeHtml(getExcerpt(post));
    var date = formatDate(post.date);
    var link = escapeHtml(post.link);
    return (
      '<a class="fct-list-item" href="' + link + '" target="_blank" rel="noopener noreferrer">' +
        (imgUrl
          ? '<img class="fct-list-thumb" src="' + escapeHtml(imgUrl) + '" alt="" loading="lazy">'
          : '<div class="fct-list-thumb-ph"></div>') +
        '<div class="fct-list-body">' +
          '<div class="fct-list-meta">' +
            (catLabel
              ? '<span class="fct-list-meta-cat">' + escapeHtml(catLabel) + '</span><span> · </span>'
              : '') +
            '<span>' + date + '</span>' +
          '</div>' +
          '<div class="fct-list-title">' + title + '</div>' +
          (excerpt ? '<div class="fct-list-excerpt">' + excerpt + '</div>' : '') +
        '</div>' +
      '</a>'
    );
  }

  /* ─── render functions ────────────────────────────────────── */

  function findPostBySlug(slug) {
    var langCatId = CAT_IDS[activeLang];
    var inLang = allPosts.find(function (p) {
      return p.slug === slug && p.categories.indexOf(langCatId) !== -1;
    });
    if (inLang) return inLang;
    return allPosts.find(function (p) { return p.slug === slug; }) || null;
  }

  function buildFeaturedPosts() {
    var langCatId = CAT_IDS[activeLang];
    var langPosts = allPosts.filter(function (p) {
      return p.categories.indexOf(langCatId) !== -1;
    });
    var used = {};
    var featured = [];

    langPosts.slice(0, 3).forEach(function (p) {
      used[p.id] = true;
      featured.push(p);
    });

    var pinnedSlugs = activeLang === 'hello-korea' ? PINNED_KO : PINNED_EN;
    pinnedSlugs.forEach(function (slug) {
      if (featured.length >= 6) return;
      var p = findPostBySlug(slug);
      if (p && !used[p.id]) {
        used[p.id] = true;
        featured.push(p);
      }
    });

    return featured;
  }

  function renderFeatured() {
    var leadEl = document.getElementById('fct-lead-story');
    var gridA = document.getElementById('fct-featured-grid');
    var gridB = document.getElementById('fct-featured-grid-b');
    if (!leadEl || !gridA || !gridB) return;

    var featured = buildFeaturedPosts();
    if (featured.length === 0) {
      leadEl.innerHTML = '';
      gridA.innerHTML = '';
      gridB.innerHTML = '';
      return;
    }

    /* first post = lead story */
    leadEl.innerHTML = leadStoryHtml(featured[0]);

    /* posts 2-3 = top row (2 cols) */
    gridA.innerHTML = featured.slice(1, 3).map(featuredCardHtml).join('');

    /* posts 4-6 = bottom row (3 cols) */
    gridB.innerHTML = featured.slice(3, 6).map(featuredCardHtml).join('');
  }

  function renderList(posts) {
    var el = document.getElementById('fct-list');
    if (!el) return;
    el.innerHTML = posts.length
      ? posts.map(listItemHtml).join('')
      : '<div class="fct-empty">게시물이 없습니다.</div>';
  }

  function updateHeroStats() {
    var koEl = document.getElementById('fct-stat-ko');
    var enEl = document.getElementById('fct-stat-en');
    if (!koEl || !enEl) return;
    var koCount = allPosts.filter(function (p) {
      return p.categories.indexOf(CAT_IDS['hello-korea']) !== -1;
    }).length;
    var enCount = allPosts.filter(function (p) {
      return p.categories.indexOf(CAT_IDS['hello-world']) !== -1;
    }).length;
    koEl.textContent = koCount;
    enEl.textContent = enCount;
  }

  function countForLangCat(langCatId, catId) {
    return allPosts.filter(function (p) {
      if (p.categories.indexOf(langCatId) === -1) return false;
      if (catId !== null && p.categories.indexOf(catId) === -1) return false;
      return true;
    }).length;
  }

  function updateCatTabs() {
    var container = document.getElementById('fct-cat-tabs');
    if (!container) return;
    var tabs = CAT_TABS[activeLang];
    var langCatId = CAT_IDS[activeLang];
    var hasPosts = allPosts.length > 0;
    container.innerHTML = tabs.map(function (tab) {
      var isActive = tab.id === activeCat;
      var countHtml = hasPosts
        ? '<span style="color:' + (isActive ? 'rgba(255,255,255,0.6)' : C.faint) +
          ';font-weight:400;margin-left:4px;font-size:12px">' +
          countForLangCat(langCatId, tab.catId) + '</span>'
        : '';
      return (
        '<button class="fct-cat-tab' + (isActive ? ' active' : '') +
          '" data-cat="' + tab.id + '">' + tab.label + countHtml + '</button>'
      );
    }).join('');
    var btns = container.querySelectorAll('.fct-cat-tab');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        activeCat = this.getAttribute('data-cat');
        var siblings = container.querySelectorAll('.fct-cat-tab');
        for (var j = 0; j < siblings.length; j++) siblings[j].classList.remove('active');
        this.classList.add('active');
        applyFilter(true);
      });
    }
  }

  function getFiltered() {
    var langCatId = CAT_IDS[activeLang];
    var catTabs = CAT_TABS[activeLang];
    var activeTab = catTabs.find(function (t) { return t.id === activeCat; });
    var filtered = allPosts.filter(function (p) {
      return p.categories.indexOf(langCatId) !== -1;
    });
    if (activeTab && activeTab.catId !== null) {
      filtered = filtered.filter(function (p) {
        return p.categories.indexOf(activeTab.catId) !== -1;
      });
    }
    return filtered;
  }

  function applyFilter(fadeList) {
    var filtered = getFiltered();
    var isAllTab = (activeCat === 'all-ko' || activeCat === 'all-en');
    var listPosts;
    if (isAllTab) {
      var featuredIds = {};
      buildFeaturedPosts().forEach(function (p) { featuredIds[p.id] = true; });
      listPosts = filtered.filter(function (p) { return !featuredIds[p.id]; });
    } else {
      listPosts = filtered;
    }

    var langCatId = CAT_IDS[activeLang];
    var total = countForLangCat(langCatId, null);
    var countEl = document.getElementById('fct-all-count');
    if (countEl) countEl.textContent = total + '편';

    if (fadeList) {
      var listEl = document.getElementById('fct-list');
      if (listEl) {
        listEl.style.opacity = '0';
        setTimeout(function () {
          renderList(listPosts);
          listEl.style.opacity = '1';
        }, 50);
        return;
      }
    }
    renderList(listPosts);
  }

  /* ─── app shell ───────────────────────────────────────────── */

  function renderApp(container) {
    container.innerHTML =
      /* HERO */
      '<div class="fct-hero">' +
        '<div class="fct-hero-inner">' +
          '<h1>Faircast</h1>' +
          '<p class="fct-hero-sub">한국 해운 · 항만 · 조선 인사이트</p>' +
          '<div class="fct-hero-badges">' +
            '<span class="fct-badge">한국어 <span class="fct-badge-num" id="fct-stat-ko">—</span>편</span>' +
            '<span class="fct-badge">English <span class="fct-badge-num" id="fct-stat-en">—</span>편</span>' +
            '<span class="fct-badge">무역항 <span class="fct-badge-num">12</span>개</span>' +
          '</div>' +
          '<div class="fct-lang-tabs" id="fct-lang-tabs">' +
            LANG_TABS.map(function (tab) {
              return (
                '<button class="fct-lang-tab' +
                  (tab.id === activeLang ? ' active' : '') +
                  '" data-lang="' + tab.id + '">' + tab.label + '</button>'
              );
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>' +

      /* FEATURED */
      '<div class="fct-content">' +
        '<div id="fct-lead-story"></div>' +
        '<div class="fct-feat-section">' +
          '<div id="fct-featured-grid"></div>' +
          '<div id="fct-featured-grid-b"></div>' +
        '</div>' +
      '</div>' +

      /* ALL POSTS */
      '<div class="fct-all-section">' +
        '<div class="fct-all-inner">' +
          '<div class="fct-all-header">' +
            '<h2 class="fct-section-hd">전체 글</h2>' +
            '<span id="fct-all-count" class="fct-all-count"></span>' +
          '</div>' +
          '<div class="fct-cat-tab-row" id="fct-cat-tabs"></div>' +
          '<div id="fct-list"><div class="fct-loading">불러오는 중...</div></div>' +
        '</div>' +
      '</div>' +

      /* FOOTER */
      '<div class="fct-footer">' +
        '<a class="fct-fl fct-fl-port" href="/category/port-guide/">항만 가이드 →</a>' +
        '<a class="fct-fl fct-fl-eta" href="https://fairwayeta.com/calculator" target="_blank" rel="noopener noreferrer">Fairway ETA 계산기 →</a>' +
        '<a class="fct-fl fct-fl-en" href="https://fairwayeta.com/insights" target="_blank" rel="noopener noreferrer">English Insights →</a>' +
      '</div>';

    /* lang tab events */
    var langBtns = document.getElementById('fct-lang-tabs').querySelectorAll('.fct-lang-tab');
    for (var i = 0; i < langBtns.length; i++) {
      langBtns[i].addEventListener('click', function () {
        activeLang = this.getAttribute('data-lang');
        activeCat = activeLang === 'hello-korea' ? 'all-ko' : 'all-en';
        var siblings = document.getElementById('fct-lang-tabs').querySelectorAll('.fct-lang-tab');
        for (var j = 0; j < siblings.length; j++) siblings[j].classList.remove('active');
        this.classList.add('active');
        updateCatTabs();
        var leadEl = document.getElementById('fct-lead-story');
        var gridA = document.getElementById('fct-featured-grid');
        var gridB = document.getElementById('fct-featured-grid-b');
        var listEl = document.getElementById('fct-list');
        if (leadEl) leadEl.style.opacity = '0';
        if (gridA) gridA.style.opacity = '0';
        if (gridB) gridB.style.opacity = '0';
        if (listEl) listEl.style.opacity = '0';
        setTimeout(function () {
          renderFeatured();
          applyFilter(false);
          if (leadEl) leadEl.style.opacity = '1';
          if (gridA) gridA.style.opacity = '1';
          if (gridB) gridB.style.opacity = '1';
          if (listEl) listEl.style.opacity = '1';
        }, 50);
      });
    }

    updateCatTabs();
  }

  /* ─── fetch ───────────────────────────────────────────────── */

  function fetchPosts() {
    var url = API_URL + '?categories=' + CAT_IDS.insights + '&per_page=100&_embed';
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        allPosts = data;
        updateHeroStats();
        renderFeatured();
        updateCatTabs();
        applyFilter(false);
      })
      .catch(function () {
        var listEl = document.getElementById('fct-list');
        if (listEl) listEl.innerHTML = '<div class="fct-error">글을 불러올 수 없습니다.</div>';
      });
  }

  /* ─── init ────────────────────────────────────────────────── */

  function init() {
    var container = document.getElementById('fct-insights-app');
    if (!container) return;
    injectStyles();
    renderApp(container);
    fetchPosts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

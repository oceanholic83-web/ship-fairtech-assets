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

  var C = {
    deep: '#0c1829',
    teal: '#14b8a6',
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
      /* hide WP page title "Faircast Insights" */
      '.entry-header,.page-header,.wp-block-post-title,.entry-title{display:none!important;}',

      /* base */
      '#fct-insights-app{',
        'font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI","Apple SD Gothic Neo","Noto Sans KR",sans-serif;',
        'margin:0;padding:0;background:' + C.card + ';min-height:60vh;box-sizing:border-box;',
        'color:' + C.ink + ';line-height:1.6;}',
      '#fct-insights-app *{box-sizing:border-box;}',
      '#fct-insights-app a{color:inherit;text-decoration:none;}',

      /* ── UTILITY BAR ── */
      '.fct-bar{',
        'display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;',
        'max-width:1100px;margin:0 auto;padding:20px 20px 16px;}',
      '.fct-bar-left{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}',
      '.fct-bar-right{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',

      /* stat badges */
      '.fct-badge{',
        'display:inline-flex;align-items:center;gap:4px;',
        'padding:4px 12px;border-radius:16px;font-size:12px;font-weight:500;',
        'background:' + C.surface + ';color:' + C.muted + ';}',
      '.fct-badge-num{color:' + C.teal + ';font-weight:700;}',

      /* lang tabs */
      '.fct-lang-tab{',
        'padding:7px 20px;border-radius:9999px;font-size:13px;font-weight:600;',
        'cursor:pointer;border:1.5px solid ' + C.border + ';',
        'background:' + C.card + ';color:' + C.muted + ';',
        'transition:all 0.15s;font-family:inherit;}',
      '.fct-lang-tab:hover{border-color:' + C.teal + ';color:#0f766e;}',
      '.fct-lang-tab.active{background:' + C.ink + ';border-color:' + C.ink + ';color:#fff;}',

      /* ── CONTENT WRAPPER ── */
      '.fct-content{max-width:1100px;margin:0 auto;padding:0 20px;}',

      /* ── LEAD STORY ── */
      '.fct-lead{',
        'display:grid;grid-template-columns:1.15fr 1fr;gap:0;margin:0 0 28px;',
        'border-radius:12px;overflow:hidden;background:' + C.card + ';',
        'border:1px solid ' + C.border + ';',
        'transition:box-shadow 0.25s,transform 0.25s;}',
      '.fct-lead:hover{box-shadow:0 8px 32px rgba(0,0,0,0.08);transform:translateY(-2px);}',
      '.fct-lead-img{width:100%;height:100%;min-height:300px;object-fit:cover;display:block;}',
      '.fct-lead-img-ph{width:100%;min-height:300px;background:' + C.deep + ';}',
      '.fct-lead-body{padding:32px 36px;display:flex;flex-direction:column;justify-content:center;}',
      '.fct-lead-cat{',
        'font-size:11px;font-weight:700;color:' + C.teal + ';',
        'text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;}',
      '.fct-lead-title{',
        'font-size:23px;font-weight:800;color:' + C.ink + ';',
        'line-height:1.35;letter-spacing:-0.02em;margin-bottom:14px;',
        'display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-lead-excerpt{',
        'font-size:14.5px;color:' + C.muted + ';line-height:1.7;margin-bottom:18px;',
        'display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-lead-date{font-size:12px;color:' + C.faint + ';}',

      /* ── FEATURED GRID ── */
      '#fct-featured-grid{',
        'display:grid;grid-template-columns:repeat(2,1fr);',
        'gap:18px;margin-bottom:18px;transition:opacity 0.2s;}',
      '#fct-featured-grid-b{',
        'display:grid;grid-template-columns:repeat(3,1fr);',
        'gap:18px;margin-bottom:8px;transition:opacity 0.2s;}',

      /* featured cards */
      '.fct-feat-card{',
        'border:1px solid ' + C.border + ';border-radius:10px;overflow:hidden;',
        'background:' + C.card + ';display:block;',
        'transition:box-shadow 0.2s,transform 0.2s;}',
      '.fct-feat-card:hover{box-shadow:0 4px 20px rgba(0,0,0,0.07);transform:translateY(-2px);}',
      '.fct-feat-img{width:100%;height:170px;object-fit:cover;display:block;background:' + C.deep + ';}',
      '.fct-feat-img-ph{width:100%;height:170px;background:' + C.deep + ';}',
      '.fct-feat-body{padding:14px 16px 18px;}',
      '.fct-feat-cat{',
        'font-size:10px;font-weight:700;color:' + C.teal + ';',
        'text-transform:uppercase;letter-spacing:0.06em;margin-bottom:7px;}',
      '.fct-feat-title{',
        'font-size:15px;font-weight:700;color:' + C.ink + ';margin-bottom:7px;',
        'line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;',
        '-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-feat-excerpt{',
        'font-size:13px;color:' + C.muted + ';margin-bottom:8px;line-height:1.55;',
        'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-feat-date{font-size:11px;color:' + C.faint + ';}',

      /* ── ALL POSTS SECTION ── */
      '.fct-all-section{',
        'background:' + C.surface + ';padding:36px 20px 48px;',
        'border-top:1px solid ' + C.border + ';}',
      '.fct-all-inner{max-width:1100px;margin:0 auto;}',
      '.fct-all-header{display:flex;align-items:baseline;gap:10px;margin-bottom:18px;}',
      '.fct-section-hd{',
        'font-size:20px;font-weight:800;color:' + C.ink + ';',
        'margin:0;letter-spacing:-0.01em;}',
      '.fct-all-count{font-size:14px;font-weight:400;color:' + C.faint + ';}',

      /* cat tabs */
      '.fct-cat-tab-row{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px;}',
      '.fct-cat-tab{',
        'padding:6px 16px;border-radius:9999px;font-size:13px;font-weight:600;',
        'cursor:pointer;border:1.5px solid ' + C.border + ';background:' + C.card + ';color:' + C.muted + ';',
        'transition:all 0.15s;font-family:inherit;line-height:1.4;}',
      '.fct-cat-tab:hover{border-color:' + C.teal + ';color:#0f766e;}',
      '.fct-cat-tab.active{background:' + C.ink + ';border-color:' + C.ink + ';color:#fff;}',

      /* list items */
      '#fct-list{display:flex;flex-direction:column;width:100%;transition:opacity 0.15s;}',
      '.fct-list-item{',
        'display:flex;gap:16px;align-items:flex-start;width:100%;',
        'padding:16px 14px;border-radius:10px;background:' + C.card + ';',
        'margin-bottom:6px;border:1px solid transparent;',
        'transition:border-color 0.15s,box-shadow 0.15s;}',
      '.fct-list-item:hover{border-color:' + C.border + ';box-shadow:0 2px 10px rgba(0,0,0,0.03);}',
      '.fct-list-thumb{',
        'width:130px;min-width:130px;height:87px;',
        'object-fit:cover;border-radius:8px;display:block;background:' + C.deep + ';}',
      '.fct-list-thumb-ph{',
        'width:130px;min-width:130px;height:87px;',
        'background:' + C.deep + ';border-radius:8px;}',
      '.fct-list-body{flex:1;min-width:0;}',
      '.fct-list-meta{font-size:11px;color:' + C.faint + ';margin-bottom:4px;}',
      '.fct-list-meta-cat{color:' + C.teal + ';font-weight:600;}',
      '.fct-list-title{',
        'font-size:15px;font-weight:700;color:' + C.ink + ';',
        'margin-bottom:4px;line-height:1.45;',
        'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-list-excerpt{',
        'font-size:13px;color:' + C.muted + ';line-height:1.55;',
        'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}',

      /* states */
      '.fct-loading{text-align:center;padding:48px;color:' + C.muted + ';font-size:14px;}',
      '.fct-error{text-align:center;padding:48px;color:#f87171;font-size:14px;}',
      '.fct-empty{text-align:center;padding:36px;color:' + C.faint + ';font-size:14px;}',

      /* ── FOOTER ── */
      '.fct-footer{',
        'background:' + C.deep + ';padding:32px 24px;',
        'display:flex;justify-content:center;gap:12px;flex-wrap:wrap;}',
      '.fct-fl{',
        'padding:10px 22px;border-radius:8px;font-size:13px;font-weight:600;',
        'transition:opacity 0.15s,transform 0.15s;}',
      '.fct-fl:hover{opacity:0.88;transform:translateY(-1px);}',
      '.fct-fl-port{background:rgba(20,184,166,0.15);color:' + C.teal + ';border:1px solid rgba(20,184,166,0.3);}',
      '.fct-fl-eta{background:rgba(245,158,11,0.12);color:' + C.amber + ';border:1px solid rgba(245,158,11,0.25);}',
      '.fct-fl-en{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.55);border:1px solid rgba(255,255,255,0.12);}',

      /* ── RESPONSIVE ── */
      '@media(max-width:768px){',
        '.fct-bar{flex-direction:column;align-items:flex-start;gap:10px;padding:16px 16px 12px;}',
        '.fct-lead{grid-template-columns:1fr;}',
        '.fct-lead-img,.fct-lead-img-ph{min-height:200px;height:200px;}',
        '.fct-lead-body{padding:20px 18px;}',
        '.fct-lead-title{font-size:19px;}',
        '#fct-featured-grid{grid-template-columns:1fr;}',
        '#fct-featured-grid-b{grid-template-columns:1fr 1fr;}',
      '}',
      '@media(max-width:480px){',
        '#fct-featured-grid-b{grid-template-columns:1fr;}',
        '.fct-list-thumb,.fct-list-thumb-ph{display:none;}',
        '.fct-list-item{padding:12px 10px;}',
        '.fct-lead-title{font-size:17px;}',
        '.fct-lead-body{padding:16px 14px;}',
        '.fct-badge{font-size:11px;padding:3px 9px;}',
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

    leadEl.innerHTML = leadStoryHtml(featured[0]);
    gridA.innerHTML = featured.slice(1, 3).map(featuredCardHtml).join('');
    gridB.innerHTML = featured.slice(3, 6).map(featuredCardHtml).join('');
  }

  function renderList(posts) {
    var el = document.getElementById('fct-list');
    if (!el) return;
    el.innerHTML = posts.length
      ? posts.map(listItemHtml).join('')
      : '<div class="fct-empty">게시물이 없습니다.</div>';
  }

  function updateBarStats() {
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
          ';font-weight:400;margin-left:4px;font-size:11px">' +
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
      /* UTILITY BAR */
      '<div class="fct-bar">' +
        '<div class="fct-bar-left">' +
          '<span class="fct-badge">한국어 <span class="fct-badge-num" id="fct-stat-ko">—</span>편</span>' +
          '<span class="fct-badge">English <span class="fct-badge-num" id="fct-stat-en">—</span>편</span>' +
          '<span class="fct-badge">무역항 <span class="fct-badge-num">12</span>개</span>' +
        '</div>' +
        '<div class="fct-bar-right" id="fct-lang-tabs">' +
          LANG_TABS.map(function (tab) {
            return (
              '<button class="fct-lang-tab' +
                (tab.id === activeLang ? ' active' : '') +
                '" data-lang="' + tab.id + '">' + tab.label + '</button>'
            );
          }).join('') +
        '</div>' +
      '</div>' +

      /* FEATURED */
      '<div class="fct-content">' +
        '<div id="fct-lead-story"></div>' +
        '<div id="fct-featured-grid"></div>' +
        '<div id="fct-featured-grid-b"></div>' +
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
        [leadEl,gridA,gridB,listEl].forEach(function(e){if(e)e.style.opacity='0';});
        setTimeout(function () {
          renderFeatured();
          applyFilter(false);
          [leadEl,gridA,gridB,listEl].forEach(function(e){if(e)e.style.opacity='1';});
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
        updateBarStats();
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

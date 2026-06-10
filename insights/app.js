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
    'busan-port-transshipment-hub-30-year-strategy',
    'shadow-fleet-dark-fleet-2026-korea-5-touchpoints-guide',
    'ten-shipping-routes-korea-perspective-2026',
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

  /* ─── styles ─────────────────────────────────────────────── */

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '#fct-insights-app{',
        'font-family:ui-sans-serif,system-ui,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;',
        'max-width:1200px;margin:0 auto;padding:0 16px 56px;background:#f8fafc;',
        'min-height:60vh;box-sizing:border-box;}',
      '#fct-insights-app *{box-sizing:border-box;}',

      /* hero */
      '.fct-hero{text-align:center;padding:48px 16px 28px;}',
      '.fct-hero h1{font-size:32px;font-weight:800;color:#0f172a;margin:0 0 8px;letter-spacing:-0.02em;}',
      '.fct-hero-sub{font-size:15px;color:#64748b;margin:0 0 6px;}',
      '.fct-hero-stats{font-size:12px;color:#94a3b8;margin:0;}',

      /* lang tabs */
      '.fct-lang-tabs{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;',
        'margin-bottom:28px;padding:0 8px;}',

      /* shared tab button */
      '.fct-tab-btn{',
        'padding:8px 20px;border-radius:9999px;font-size:0.875rem;font-weight:600;',
        'cursor:pointer;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;',
        'transition:border-color 0.15s,color 0.15s,background 0.15s;',
        'font-family:inherit;line-height:1.4;}',
      '.fct-tab-btn:hover{border-color:#14b8a6;color:#0f766e;}',
      '.fct-lang-tab.active{background:#14b8a6;border-color:#14b8a6;color:#fff;}',
      '.fct-lang-tab.active:hover{color:#fff;}',
      '.fct-cat-tab.active{background:#0f172a;border-color:#0f172a;color:#fff;}',
      '.fct-cat-tab.active:hover{color:#fff;}',

      /* section headings */
      '.fct-section-hd{font-size:20px;font-weight:700;color:#0f172a;',
        'margin:0 0 16px;letter-spacing:-0.01em;}',
      '.fct-all-count{font-size:16px;font-weight:400;color:#94a3b8;margin-left:6px;}',

      /* cat tab row */
      '.fct-cat-tab-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;}',

      /* featured grid */
      '#fct-featured-grid{',
        'display:grid;grid-template-columns:repeat(3,1fr);',
        'gap:20px;transition:opacity 0.2s ease;}',

      /* featured cards */
      '.fct-feat-card{',
        'border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;',
        'background:#fff;text-decoration:none;color:inherit;display:block;',
        'transition:box-shadow 0.15s;}',
      '.fct-feat-card:hover{box-shadow:0 4px 18px rgba(0,0,0,0.10);}',
      '.fct-feat-img{width:100%;height:180px;object-fit:cover;display:block;background:#1e293b;}',
      '.fct-feat-img-ph{width:100%;height:180px;background:#1e293b;}',
      '.fct-feat-body{padding:14px 16px 18px;}',
      '.fct-feat-cat{font-size:11px;font-weight:700;color:#14b8a6;',
        'text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;}',
      '.fct-feat-title{font-size:16px;font-weight:700;color:#0f172a;margin-bottom:8px;',
        'line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;',
        '-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-feat-excerpt{font-size:13px;color:#64748b;margin-bottom:10px;',
        'line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;',
        '-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-feat-date{font-size:12px;color:#94a3b8;}',

      /* divider */
      '.fct-divider{border:none;border-top:1px solid #e2e8f0;margin:40px 0 0;}',

      /* list — full-width vertical rows, not a card grid */
      '#fct-insights-app #fct-list{',
        'display:flex;flex-direction:column;width:100%;',
        'transition:opacity 0.15s ease;}',
      '.fct-list-item{',
        'display:flex;gap:16px;align-items:flex-start;width:100%;',
        'padding:16px 8px;border-bottom:1px solid #e2e8f0;',
        'text-decoration:none;color:inherit;transition:background 0.15s;}',
      '.fct-list-item:hover{background:#f8fafc;}',
      '.fct-list-item:last-child{border-bottom:none;}',
      '.fct-list-thumb{',
        'width:120px;min-width:120px;height:80px;',
        'object-fit:cover;border-radius:6px;display:block;background:#1e293b;flex-shrink:0;}',
      '.fct-list-thumb-ph{',
        'width:120px;min-width:120px;height:80px;',
        'background:#1e293b;border-radius:6px;flex-shrink:0;}',
      '.fct-list-body{flex:1;min-width:0;}',
      '.fct-list-meta{font-size:11px;color:#94a3b8;margin-bottom:4px;}',
      '.fct-list-meta-cat{color:#14b8a6;font-weight:600;}',
      '.fct-list-title{',
        'font-size:15px;font-weight:700;color:#0f172a;',
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
        'margin-bottom:4px;}',
      '.fct-list-excerpt{',
        'font-size:13px;color:#64748b;line-height:1.5;',
        'display:-webkit-box;-webkit-line-clamp:2;',
        '-webkit-box-orient:vertical;overflow:hidden;}',

      /* states */
      '.fct-loading{text-align:center;padding:56px;color:#64748b;font-size:0.95rem;}',
      '.fct-error{text-align:center;padding:56px;color:#f87171;font-size:0.95rem;}',
      '.fct-empty{text-align:center;padding:40px;color:#94a3b8;font-size:0.95rem;}',

      /* footer */
      '.fct-footer{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:40px;}',
      '.fct-fl{padding:10px 22px;border-radius:8px;font-size:0.875rem;font-weight:600;',
        'text-decoration:none;transition:opacity 0.15s;}',
      '.fct-fl:hover{opacity:0.82;}',
      '.fct-fl-port{background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4;}',
      '.fct-fl-eta{background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;}',
      '.fct-fl-en{background:#f8fafc;color:#475569;border:1px solid #e2e8f0;}',

      /* responsive */
      '@media(max-width:700px){',
        '#fct-featured-grid{grid-template-columns:repeat(2,1fr);}}',
      '@media(max-width:480px){',
        '#fct-featured-grid{grid-template-columns:1fr;}',
        '.fct-list-thumb,.fct-list-thumb-ph{display:none;}',
        '.fct-hero h1{font-size:24px;}}',
    ].join('');
    document.head.appendChild(style);
  }

  /* ─── helpers ─────────────────────────────────────────────── */

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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
    return post.excerpt.rendered
      .replace(/<[^>]+>/g, '')
      .replace(/\[&hellip;\]|\[…\]/g, '…')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  /* ─── card / item html ────────────────────────────────────── */

  function featuredCardHtml(post) {
    var imgUrl = getFeaturedImage(post);
    var catLabel = getCategoryLabel(post);
    var title = escapeHtml(post.title.rendered.replace(/<[^>]+>/g, ''));
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
    var title = escapeHtml(post.title.rendered.replace(/<[^>]+>/g, ''));
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
    var el = document.getElementById('fct-featured-grid');
    if (!el) return;
    el.innerHTML = buildFeaturedPosts().map(featuredCardHtml).join('');
  }

  function renderList(posts) {
    var el = document.getElementById('fct-list');
    if (!el) return;
    el.innerHTML = posts.length
      ? posts.map(listItemHtml).join('')
      : '<div class="fct-empty">게시물이 없습니다.</div>';
  }

  function updateHeroStats() {
    var el = document.getElementById('fct-hero-stats');
    if (!el) return;
    var koCount = allPosts.filter(function (p) {
      return p.categories.indexOf(CAT_IDS['hello-korea']) !== -1;
    }).length;
    var enCount = allPosts.filter(function (p) {
      return p.categories.indexOf(CAT_IDS['hello-world']) !== -1;
    }).length;
    el.textContent = '한국어 ' + koCount + '편 · English ' + enCount + '편';
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
        ? '<span style="color:' + (isActive ? 'rgba(255,255,255,0.7)' : '#94a3b8') +
          ';font-weight:400;margin-left:4px">' +
          countForLangCat(langCatId, tab.catId) + '</span>'
        : '';
      return (
        '<button class="fct-tab-btn fct-cat-tab' + (isActive ? ' active' : '') +
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
    var featuredIds = {};
    buildFeaturedPosts().forEach(function (p) { featuredIds[p.id] = true; });
    var listPosts = filtered.filter(function (p) { return !featuredIds[p.id]; });

    // "전체 글 N편" always shows total for the active language
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
      '<div class="fct-hero">' +
        '<h1>Faircast</h1>' +
        '<p class="fct-hero-sub">한국 해운·항만·조선 인사이트</p>' +
        '<p id="fct-hero-stats" class="fct-hero-stats"></p>' +
      '</div>' +
      '<div class="fct-lang-tabs" id="fct-lang-tabs">' +
        LANG_TABS.map(function (tab) {
          return (
            '<button class="fct-tab-btn fct-lang-tab' +
              (tab.id === activeLang ? ' active' : '') +
              '" data-lang="' + tab.id + '">' + tab.label + '</button>'
          );
        }).join('') +
      '</div>' +
      '<h2 class="fct-section-hd">주요 글</h2>' +
      '<div id="fct-featured-grid"></div>' +
      '<hr class="fct-divider">' +
      '<div style="margin-top:32px">' +
        '<div style="display:flex;align-items:baseline;margin-bottom:16px">' +
          '<h2 class="fct-section-hd" style="margin:0">전체 글</h2>' +
          '<span id="fct-all-count" class="fct-all-count"></span>' +
        '</div>' +
        '<div class="fct-cat-tab-row" id="fct-cat-tabs"></div>' +
        '<div id="fct-list"><div class="fct-loading">불러오는 중...</div></div>' +
      '</div>' +
      '<div class="fct-footer">' +
        '<a class="fct-fl fct-fl-port" href="/category/port-guide/">항만 가이드 →</a>' +
        '<a class="fct-fl fct-fl-eta" href="https://fairwayeta.com/calculator" target="_blank" rel="noopener noreferrer">Fairway ETA 계산기 →</a>' +
        '<a class="fct-fl fct-fl-en" href="https://fairwayeta.com/insights" target="_blank" rel="noopener noreferrer">English Insights →</a>' +
      '</div>';

    var langBtns = document.getElementById('fct-lang-tabs').querySelectorAll('.fct-lang-tab');
    for (var i = 0; i < langBtns.length; i++) {
      langBtns[i].addEventListener('click', function () {
        activeLang = this.getAttribute('data-lang');
        activeCat = activeLang === 'hello-korea' ? 'all-ko' : 'all-en';
        var siblings = document.getElementById('fct-lang-tabs').querySelectorAll('.fct-lang-tab');
        for (var j = 0; j < siblings.length; j++) siblings[j].classList.remove('active');
        this.classList.add('active');
        updateCatTabs();
        var featGrid = document.getElementById('fct-featured-grid');
        var listEl = document.getElementById('fct-list');
        if (featGrid) featGrid.style.opacity = '0';
        if (listEl) listEl.style.opacity = '0';
        setTimeout(function () {
          renderFeatured();
          applyFilter(false);
          if (featGrid) featGrid.style.opacity = '1';
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

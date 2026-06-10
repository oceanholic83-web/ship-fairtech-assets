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
  var currentFiltered = [];
  var visibleCount = 6;

  function injectStyles() {
    var style = document.createElement('style');
    style.textContent = [
      '#fct-insights-app{',
        'font-family:ui-sans-serif,system-ui,"Apple SD Gothic Neo","Noto Sans KR",sans-serif;',
        'max-width:1200px;margin:0 auto;padding:0 16px 56px;background:#f8fafc;',
        'min-height:60vh;box-sizing:border-box;}',
      '#fct-insights-app *{box-sizing:border-box;}',

      '.fct-hero{text-align:center;padding:48px 16px 28px;}',
      '.fct-hero h1{font-size:32px;font-weight:800;color:#0f172a;margin:0 0 8px;letter-spacing:-0.02em;}',
      '.fct-hero-sub{font-size:15px;color:#64748b;margin:0 0 6px;}',
      '.fct-hero-stats{font-size:12px;color:#94a3b8;margin:0;}',

      '.fct-tabs{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;',
        'margin-bottom:12px;padding:0 8px;}',
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

      '.fct-featured-grid{',
        'display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:20px;}',
      '.fct-card-lg{border-bottom:3px solid #14b8a6;}',
      '.fct-card-lg .fct-card-img{height:200px;}',
      '.fct-card-lg .fct-card-img-ph{height:200px;}',
      '.fct-card-lg .fct-card-title{font-size:16px;}',

      '.fct-divider{border:none;border-top:1px solid #e2e8f0;margin:24px 0;}',

      '.fct-grid{',
        'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));',
        'gap:20px;transition:opacity 0.2s ease;}',

      '.fct-card{',
        'border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;',
        'background:#fff;text-decoration:none;color:inherit;display:block;',
        'transition:box-shadow 0.15s;}',
      '.fct-card:hover{box-shadow:0 4px 18px rgba(0,0,0,0.10);}',

      '.fct-card-img{width:100%;height:160px;object-fit:cover;display:block;background:#1e293b;}',
      '.fct-card-img-ph{width:100%;height:160px;background:#1e293b;}',

      '.fct-card-body{padding:14px 16px 16px;}',
      '.fct-card-cat{font-size:11px;font-weight:700;color:#14b8a6;',
        'text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;}',
      '.fct-card-title{font-size:14px;font-weight:700;color:#0f172a;margin-bottom:8px;',
        'line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;',
        '-webkit-box-orient:vertical;overflow:hidden;}',
      '.fct-card-date{font-size:12px;color:#94a3b8;}',

      '.fct-more-btn{',
        'display:block;margin:20px auto 0;padding:10px 28px;',
        'border-radius:8px;border:1px solid #e2e8f0;background:#fff;',
        'color:#0f172a;font-size:13px;font-weight:600;cursor:pointer;',
        'font-family:inherit;transition:background 0.15s;}',
      '.fct-more-btn:hover{background:#f8fafc;}',

      '.fct-loading{text-align:center;padding:56px;color:#64748b;font-size:0.95rem;}',
      '.fct-error{text-align:center;padding:56px;color:#f87171;font-size:0.95rem;}',
      '.fct-empty{text-align:center;padding:56px;color:#94a3b8;font-size:0.95rem;}',

      '.fct-footer{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:40px;}',
      '.fct-fl{padding:10px 22px;border-radius:8px;font-size:0.875rem;font-weight:600;',
        'text-decoration:none;transition:opacity 0.15s;}',
      '.fct-fl:hover{opacity:0.82;}',
      '.fct-fl-port{background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4;}',
      '.fct-fl-eta{background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;}',
      '.fct-fl-en{background:#f8fafc;color:#475569;border:1px solid #e2e8f0;}',

      '@media(max-width:480px){',
        '.fct-featured-grid{grid-template-columns:1fr;}',
        '.fct-grid{grid-template-columns:1fr;}',
        '.fct-hero h1{font-size:24px;}}',
    ].join('');
    document.head.appendChild(style);
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
    try {
      return post._embedded['wp:featuredmedia'][0].source_url;
    } catch (e) {
      return null;
    }
  }

  function formatDate(dateStr) {
    try {
      return new Date(dateStr).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch (e) {
      return dateStr.slice(0, 10);
    }
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function cardHtml(post, isFeatured) {
    var imgUrl = getFeaturedImage(post);
    var catLabel = getCategoryLabel(post);
    var title = escapeHtml(post.title.rendered.replace(/<[^>]+>/g, ''));
    var date = formatDate(post.date);
    var link = escapeHtml(post.link);
    return (
      '<a class="fct-card' + (isFeatured ? ' fct-card-lg' : '') + '"' +
        ' href="' + link + '" target="_blank" rel="noopener noreferrer">' +
        (imgUrl
          ? '<img class="fct-card-img" src="' + escapeHtml(imgUrl) + '" alt="" loading="lazy">'
          : '<div class="fct-card-img-ph"></div>') +
        '<div class="fct-card-body">' +
          (catLabel ? '<div class="fct-card-cat">' + escapeHtml(catLabel) + '</div>' : '') +
          '<div class="fct-card-title">' + title + '</div>' +
          '<div class="fct-card-date">' + date + '</div>' +
        '</div>' +
      '</a>'
    );
  }

  function renderFeatured() {
    var el = document.getElementById('fct-featured-grid');
    if (!el) return;
    var langCatId = CAT_IDS[activeLang];
    var top3 = allPosts.filter(function (p) {
      return p.categories.indexOf(langCatId) !== -1;
    }).slice(0, 3);
    el.innerHTML = top3.map(function (p) { return cardHtml(p, true); }).join('');
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

  function renderGrid() {
    var grid = document.getElementById('fct-grid');
    var moreBtn = document.getElementById('fct-more-btn');
    if (!grid) return;
    if (!currentFiltered.length) {
      grid.innerHTML = '<div class="fct-empty">게시물이 없습니다.</div>';
      if (moreBtn) moreBtn.style.display = 'none';
      return;
    }
    grid.innerHTML = currentFiltered.slice(0, visibleCount).map(function (p) {
      return cardHtml(p, false);
    }).join('');
    if (moreBtn) {
      moreBtn.style.display = visibleCount < currentFiltered.length ? 'block' : 'none';
    }
  }

  function applyFilter(fade) {
    var langCatId = CAT_IDS[activeLang];
    var catTabs = CAT_TABS[activeLang];
    var activeTab = catTabs.find(function (t) { return t.id === activeCat; });

    currentFiltered = allPosts.filter(function (p) {
      return p.categories.indexOf(langCatId) !== -1;
    });

    if (activeTab && activeTab.catId !== null) {
      currentFiltered = currentFiltered.filter(function (p) {
        return p.categories.indexOf(activeTab.catId) !== -1;
      });
    }

    if (fade) {
      var grid = document.getElementById('fct-grid');
      if (grid) {
        grid.style.opacity = '0';
        setTimeout(function () {
          renderGrid();
          grid.style.opacity = '1';
        }, 50);
        return;
      }
    }
    renderGrid();
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
        visibleCount = 6;
        var siblings = container.querySelectorAll('.fct-cat-tab');
        for (var j = 0; j < siblings.length; j++) siblings[j].classList.remove('active');
        this.classList.add('active');
        applyFilter(true);
      });
    }
  }

  function renderApp(container) {
    container.innerHTML =
      '<div class="fct-hero">' +
        '<h1>Faircast</h1>' +
        '<p class="fct-hero-sub">한국 해운·항만·조선 인사이트</p>' +
        '<p id="fct-hero-stats" class="fct-hero-stats"></p>' +
      '</div>' +
      '<div class="fct-tabs" id="fct-lang-tabs">' +
        LANG_TABS.map(function (tab) {
          return (
            '<button class="fct-tab-btn fct-lang-tab' +
              (tab.id === activeLang ? ' active' : '') +
              '" data-lang="' + tab.id + '">' + tab.label + '</button>'
          );
        }).join('') +
      '</div>' +
      '<div class="fct-tabs" id="fct-cat-tabs"></div>' +
      '<div class="fct-featured-grid" id="fct-featured-grid"></div>' +
      '<hr class="fct-divider">' +
      '<div id="fct-grid" class="fct-grid"><div class="fct-loading">불러오는 중...</div></div>' +
      '<button id="fct-more-btn" class="fct-more-btn" style="display:none">더 보기</button>' +
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
        visibleCount = 6;
        var siblings = document.getElementById('fct-lang-tabs').querySelectorAll('.fct-lang-tab');
        for (var j = 0; j < siblings.length; j++) siblings[j].classList.remove('active');
        this.classList.add('active');
        updateCatTabs();
        renderFeatured();
        applyFilter();
      });
    }

    document.getElementById('fct-more-btn').addEventListener('click', function () {
      visibleCount += 6;
      renderGrid();
    });

    updateCatTabs();
  }

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
        applyFilter();
      })
      .catch(function () {
        var grid = document.getElementById('fct-grid');
        if (grid) grid.innerHTML = '<div class="fct-error">글을 불러올 수 없습니다.</div>';
      });
  }

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

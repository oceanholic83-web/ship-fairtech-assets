/**
 * ship.fairtech.kr - 한국 무역항 안내도 헤더 + 기관 디렉토리 (v3)
 * MOF 카드 + 3단계 중첩 탭 (부처 / 카테고리 / 권역)
 *
 * 사용처: ship.fairtech.kr/category/port-guide/
 */

(function () {
  'use strict';

  if (!window.PORT_ATLAS_DATA) {
    console.error('[port-atlas-header] PORT_ATLAS_DATA not loaded — ensure data.js is loaded before this file');
    return;
  }
  const { MOF, OFFICES, PORT_AUTHORITIES, PILOTS, MOF_AGENCIES, CUSTOMS_HQ, CUSTOMS_PORTS, KCG_AGENCIES, QUARANTINE_AGENCIES } = window.PORT_ATLAS_DATA;

  // ============================================================
  // MOF 카드 (상단 고정)
  // ============================================================
  function buildMofHtml() {
    return `
      <div style="margin-bottom:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#0f172a;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;flex-wrap:wrap;">
          <div>
            <div style="font-size:10px;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;font-weight:500;">총괄 부처</div>
            <div style="font-size:18px;color:#0f172a;font-weight:700;">${MOF.name}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">${MOF.nameEn} · ${MOF.abbr}</div>
          </div>
          <a href="${MOF.url}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 14px;background:#14b8a6;color:#ffffff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap;">공식 홈페이지 →</a>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:4px;margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;">
          <div>
            <div style="font-size:10px;color:#94a3b8;letter-spacing:0.8px;margin-bottom:4px;">본부 (2025년 부산 이전)</div>
            <div style="font-size:12px;color:#475569;line-height:1.5;">${MOF.headquarters}</div>
          </div>
          <div>
            <div style="font-size:10px;color:#94a3b8;letter-spacing:0.8px;margin-bottom:4px;">민원 연락처</div>
            <div style="font-size:12px;color:#475569;line-height:1.5;">${MOF.callCenter}</div>
          </div>
        </div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;font-style:italic;line-height:1.5;">${MOF.note}</div>
      </div>
    `;
  }

  // ============================================================
  // 트리거 버튼
  // ============================================================
  function buildTriggerHtml() {
    const officeCount = Object.values(OFFICES).reduce((s, g) => s + g.items.length, 0);
    const customsCount = CUSTOMS_HQ.length + Object.values(CUSTOMS_PORTS).reduce((s, g) => s + g.items.length, 0);
    const total = 1 + officeCount + PORT_AUTHORITIES.length + PILOTS.length + MOF_AGENCIES.length + customsCount + KCG_AGENCIES.length + QUARANTINE_AGENCIES.length;
    return `
      <div style="display:flex;gap:8px;align-items:stretch;flex-wrap:wrap;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
        <div style="flex:1;min-width:200px;position:relative;">
          <input id="port-directory-search" type="text" placeholder="기관 검색 (예: 부산, 도선, BPA)" autocomplete="off" style="width:100%;height:100%;padding:12px 14px 12px 38px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:12px;color:#0f172a;outline:none;box-sizing:border-box;" />
          <span style="position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:14px;color:#94a3b8;pointer-events:none;">🔍</span>
        </div>
        <button id="port-directory-trigger" style="flex:2;min-width:240px;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;font-family:inherit;font-size:13px;color:#0f172a;font-weight:600;transition:all 0.15s ease;">
          <span style="display:flex;align-items:center;gap:10px;">
            <span style="display:inline-block;width:6px;height:24px;background:#14b8a6;border-radius:3px;"></span>
            <span>한국 해양 행정 디렉토리</span>
            <span style="font-size:11px;color:#94a3b8;font-weight:400;">총 ${total}개 기관</span>
          </span>
          <span id="port-directory-arrow" style="font-size:14px;color:#64748b;transition:transform 0.2s ease;">▼</span>
        </button>
      </div>
    `;
  }

  // ============================================================
  // 메가 패널 (3단계 탭)
  // ============================================================
  function buildPanelHtml() {
    return `
      <div id="port-directory-panel" style="display:none;margin-top:8px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
        <div id="dir-l1-tabs" style="display:flex;border-bottom:1px solid #e2e8f0;background:#f8fafc;flex-wrap:wrap;">
          <button class="dir-l1-tab" data-l1="mof" style="flex:1;min-width:120px;padding:12px 14px;background:#ffffff;border:none;border-bottom:2px solid #14b8a6;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;color:#0f172a;">해양수산부</button>
          <button class="dir-l1-tab" data-l1="customs" style="flex:1;min-width:120px;padding:12px 14px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;color:#64748b;">관세청</button>
          <button class="dir-l1-tab" data-l1="kcg" style="flex:1;min-width:120px;padding:12px 14px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;color:#64748b;">해상치안</button>
          <button class="dir-l1-tab" data-l1="quarantine" style="flex:1;min-width:120px;padding:12px 14px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;color:#64748b;">검역·검사</button>
        </div>
        <div id="dir-l2-area"></div>
        <div id="dir-content-area" style="padding:16px 18px;"></div>
      </div>
    `;
  }

  // ============================================================
  // L2 탭 HTML 생성
  // ============================================================
  function buildL2Tabs(l1) {
    const map = {
      mof: [
        { id: 'offices', label: '지방청 (12)' },
        { id: 'pa', label: `항만공사 (${PORT_AUTHORITIES.length})` },
        { id: 'pilots', label: `도선사회 (${PILOTS.length})` },
        { id: 'agencies', label: `산하기관 (${MOF_AGENCIES.length})` },
      ],
      customs: [
        { id: 'cs-hq', label: '본청 (1)' },
        { id: 'cs-ports', label: `무역항별 세관 (${Object.values(CUSTOMS_PORTS).reduce((s,g)=>s+g.items.length,0)})` },
      ],
      kcg: [
        { id: 'kcg-main', label: `해양경찰청 (${KCG_AGENCIES.length})` },
      ],
      quarantine: [
        { id: 'q-all', label: `검역·검사 (${QUARANTINE_AGENCIES.length})` },
      ],
    };
    const tabs = map[l1] || [];
    const buttons = tabs.map((t, i) => `
      <button class="dir-l2-tab" data-l2="${t.id}" style="padding:10px 14px;background:${i===0?'#ffffff':'transparent'};border:none;border-bottom:2px solid ${i===0?'#0ea5e9':'transparent'};cursor:pointer;font-family:inherit;font-size:11px;font-weight:${i===0?'600':'500'};color:${i===0?'#0f172a':'#64748b'};">${t.label}</button>
    `).join('');
    return `<div id="dir-l2-tabs" style="display:flex;background:#fafbfc;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;">${buttons}</div>`;
  }

  // ============================================================
  // L3 권역 필터 HTML (지방청, 무역항별 세관에만 사용)
  // ============================================================
  function buildRegionFilter(activeRegion) {
    const regions = ['전체', '수도권충청', '호남', '영남', '동해안', '제주'];
    const labels = { 전체: '전체', 수도권충청: '수도권·충청', 호남: '호남', 영남: '영남', 동해안: '동해안', 제주: '제주' };
    const buttons = regions.map(r => {
      const isActive = r === activeRegion;
      return `
        <button class="dir-region-btn" data-region="${r}" style="padding:6px 12px;background:${isActive?'#0f172a':'#ffffff'};border:1px solid ${isActive?'#0f172a':'#e2e8f0'};border-radius:6px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:${isActive?'600':'500'};color:${isActive?'#ffffff':'#475569'};">${labels[r]}</button>
      `;
    }).join('');
    return `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">${buttons}</div>`;
  }

  // ============================================================
  // 카드 HTML
  // ============================================================
  function cardHtml(item, color, extraStyle = '') {
    const sub = item.sub ? `<span style="font-size:10px;color:#94a3b8;margin-left:6px;">· ${item.sub}</span>` : '';
    const abbr = item.abbr ? `<span style="font-size:9px;color:#94a3b8;background:#f1f5f9;padding:1px 5px;border-radius:3px;font-weight:600;margin-left:6px;">${item.abbr}</span>` : '';
    const meta = item.role || item.port || '';
    const url = item.url || '';
    const portKey = item.portKey || '';
    return `
      <button data-port-key="${portKey}" data-url="${url}" class="dir-card" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 10px 7px 12px;background:#ffffff;border:1px solid #e2e8f0;border-left:3px solid ${color};border-radius:5px;cursor:pointer;font-family:inherit;text-align:left;transition:all 0.12s ease;${extraStyle}">
        <div style="display:flex;align-items:center;gap:0;flex-wrap:wrap;min-width:0;">
          <span style="font-size:12px;color:#0f172a;font-weight:600;line-height:1.3;">${item.name}</span>
          ${abbr}
          ${sub}
        </div>
        <span style="font-size:10px;color:#64748b;line-height:1.3;text-align:right;white-space:nowrap;flex-shrink:0;">${meta}</span>
      </button>
    `;
  }

  // ============================================================
  // 콘텐츠 빌더 — 카테고리별
  // ============================================================
  function buildOfficesContent(activeRegion) {
    const regionFilter = buildRegionFilter(activeRegion);
    let groups;
    if (activeRegion === '전체') {
      groups = Object.entries(OFFICES);
    } else {
      groups = OFFICES[activeRegion] ? [[activeRegion, OFFICES[activeRegion]]] : [];
    }
    const groupsHtml = groups.map(([key, g]) => {
      const cards = g.items.map(o => cardHtml(o, g.color)).join('');
      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;padding-left:10px;border-left:3px solid ${g.color};">
            <span style="font-size:11px;color:#475569;font-weight:700;">${g.label}</span>
            <span style="font-size:10px;color:#94a3b8;">(${g.items.length})</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:4px;">${cards}</div>
        </div>
      `;
    }).join('');
    return regionFilter + groupsHtml;
  }

  function buildPaContent() {
    const cards = PORT_AUTHORITIES.map(pa => cardHtml(pa, '#14b8a6')).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:4px;">${cards}</div>`;
  }

  function buildPilotsContent() {
    const cards = PILOTS.map(p => cardHtml(p, p.port ? '#f97316' : '#a78bfa')).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:4px;">${cards}</div>`;
  }

  function buildAgenciesContent() {
    const cards = MOF_AGENCIES.map(a => cardHtml(a, '#8b5cf6')).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:4px;">${cards}</div>`;
  }

  function buildCustomsHqContent() {
    const cards = CUSTOMS_HQ.map(c => cardHtml(c, '#0ea5e9')).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:4px;">${cards}</div>`;
  }

  function buildCustomsPortsContent(activeRegion) {
    const regionFilter = buildRegionFilter(activeRegion);
    let groups;
    if (activeRegion === '전체') {
      groups = Object.entries(CUSTOMS_PORTS);
    } else {
      groups = CUSTOMS_PORTS[activeRegion] ? [[activeRegion, CUSTOMS_PORTS[activeRegion]]] : [];
    }
    const groupsHtml = groups.map(([key, g]) => {
      const cards = g.items.map(o => cardHtml(o, g.color)).join('');
      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;padding-left:10px;border-left:3px solid ${g.color};">
            <span style="font-size:11px;color:#475569;font-weight:700;">${g.label}</span>
            <span style="font-size:10px;color:#94a3b8;">(${g.items.length})</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:4px;">${cards}</div>
        </div>
      `;
    }).join('');
    return regionFilter + groupsHtml;
  }

  function buildKcgContent() {
    const cards = KCG_AGENCIES.map(a => cardHtml(a, '#ef4444')).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:4px;">${cards}</div>`;
  }

  function buildQuarantineContent() {
    const cards = QUARANTINE_AGENCIES.map(a => cardHtml(a, '#84cc16')).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:4px;">${cards}</div>`;
  }

  // ============================================================
  // 상태 관리 + 렌더링
  // ============================================================
  let state = {
    l1: 'mof',
    l2: 'offices',
    region: '전체',
    searchQuery: '',
  };

  function renderContent() {
    const area = document.getElementById('dir-content-area');
    if (!area) return;
    // If search is active, override tab content
    if (state.searchQuery && state.searchQuery.trim()) {
      const html = buildSearchContent(state.searchQuery);
      if (html !== null) {
        area.innerHTML = html;
        attachCardHandlers();
        return;
      }
    }
    const key = state.l2;
    if (key === 'offices') area.innerHTML = buildOfficesContent(state.region);
    else if (key === 'pa') area.innerHTML = buildPaContent();
    else if (key === 'pilots') area.innerHTML = buildPilotsContent();
    else if (key === 'agencies') area.innerHTML = buildAgenciesContent();
    else if (key === 'cs-hq') area.innerHTML = buildCustomsHqContent();
    else if (key === 'cs-ports') area.innerHTML = buildCustomsPortsContent(state.region);
    else if (key === 'kcg-main') area.innerHTML = buildKcgContent();
    else if (key === 'q-all') area.innerHTML = buildQuarantineContent();
    attachCardHandlers();
    attachRegionHandlers();
  }

  function renderL2() {
    const area = document.getElementById('dir-l2-area');
    if (!area) return;
    area.innerHTML = buildL2Tabs(state.l1);
    attachL2Handlers();
  }

  function setL1(l1) {
    state.l1 = l1;
    const defaults = {
      mof: 'offices',
      customs: 'cs-hq',
      kcg: 'kcg-main',
      quarantine: 'q-all',
    };
    state.l2 = defaults[l1];
    state.region = '전체';
    document.querySelectorAll('.dir-l1-tab').forEach(t => {
      const isActive = t.getAttribute('data-l1') === l1;
      t.style.background = isActive ? '#ffffff' : 'transparent';
      t.style.borderBottomColor = isActive ? '#14b8a6' : 'transparent';
      t.style.color = isActive ? '#0f172a' : '#64748b';
      t.style.fontWeight = isActive ? '600' : '500';
    });
    renderL2();
    renderContent();
  }

  function setL2(l2) {
    state.l2 = l2;
    state.region = '전체';
    document.querySelectorAll('.dir-l2-tab').forEach(t => {
      const isActive = t.getAttribute('data-l2') === l2;
      t.style.background = isActive ? '#ffffff' : 'transparent';
      t.style.borderBottomColor = isActive ? '#0ea5e9' : 'transparent';
      t.style.color = isActive ? '#0f172a' : '#64748b';
      t.style.fontWeight = isActive ? '600' : '500';
    });
    renderContent();
  }

  function setRegion(region) {
    state.region = region;
    renderContent();
  }

  // ============================================================
  // 이벤트 핸들러
  // ============================================================
  function attachL1Handlers() {
    document.querySelectorAll('.dir-l1-tab').forEach(tab => {
      tab.addEventListener('click', () => setL1(tab.getAttribute('data-l1')));
    });
  }

  function attachL2Handlers() {
    document.querySelectorAll('.dir-l2-tab').forEach(tab => {
      tab.addEventListener('click', () => setL2(tab.getAttribute('data-l2')));
    });
  }

  function attachRegionHandlers() {
    document.querySelectorAll('.dir-region-btn').forEach(btn => {
      btn.addEventListener('click', () => setRegion(btn.getAttribute('data-region')));
    });
  }

  function attachCardHandlers() {
    document.querySelectorAll('.dir-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.background = '#f8fafc';
        card.style.transform = 'translateY(-1px)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.background = '#ffffff';
        card.style.transform = 'translateY(0)';
      });
      card.addEventListener('click', (e) => {
        const portKey = card.getAttribute('data-port-key');
        const url = card.getAttribute('data-url');
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          if (url) window.open(url, '_blank', 'noopener');
          return;
        }
        if (portKey) {
          window.dispatchEvent(new CustomEvent('port-atlas:focus-port', { detail: { portKey } }));
        }
        if (url) {
          window.open(url, '_blank', 'noopener');
        }
      });
    });
  }

  function attachTriggerHandler() {
    const trigger = document.getElementById('port-directory-trigger');
    const panel = document.getElementById('port-directory-panel');
    const arrow = document.getElementById('port-directory-arrow');
    if (!trigger || !panel || !arrow) return;
    trigger.addEventListener('click', () => {
      const isOpen = panel.style.display === 'block';
      panel.style.display = isOpen ? 'none' : 'block';
      arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });
    trigger.addEventListener('mouseenter', () => { trigger.style.background = '#f8fafc'; });
    trigger.addEventListener('mouseleave', () => { trigger.style.background = '#ffffff'; });
  }

  function attachSearchHandler() {
    const input = document.getElementById('port-directory-search');
    const panel = document.getElementById('port-directory-panel');
    const arrow = document.getElementById('port-directory-arrow');
    if (!input) return;

    let debounceTimer = null;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchQuery = input.value;
        // Auto-open panel when searching
        if (input.value.trim() && panel && panel.style.display !== 'block') {
          panel.style.display = 'block';
          if (arrow) arrow.style.transform = 'rotate(180deg)';
        }
        renderContent();
      }, 150);
    });
  }

  function buildSearchContent(query) {
    const q = query.trim().toLowerCase();
    if (!q) return null; // empty -> use normal tab content

    const allItems = [];
    // Collect from all data sources
    Object.values(OFFICES).forEach(g => g.items.forEach(o => allItems.push({ ...o, type: '지방청', typeColor: g.color })));
    PORT_AUTHORITIES.forEach(p => allItems.push({ ...p, type: '항만공사', typeColor: '#14b8a6' }));
    PILOTS.forEach(p => allItems.push({ ...p, type: '도선사회', typeColor: p.port ? '#f97316' : '#a78bfa' }));
    MOF_AGENCIES.forEach(a => allItems.push({ ...a, type: '산하기관', typeColor: '#8b5cf6' }));
    CUSTOMS_HQ.forEach(c => allItems.push({ ...c, type: '관세청 본청', typeColor: '#0ea5e9' }));
    Object.values(CUSTOMS_PORTS).forEach(g => g.items.forEach(o => allItems.push({ ...o, type: '항만별 세관', typeColor: g.color })));
    KCG_AGENCIES.forEach(a => allItems.push({ ...a, type: '해상치안', typeColor: '#ef4444' }));
    QUARANTINE_AGENCIES.forEach(a => allItems.push({ ...a, type: '검역·검사', typeColor: '#84cc16' }));

    // Filter by query (search name, abbr, port, role, sub)
    const matches = allItems.filter(item => {
      const haystack = [item.name, item.abbr, item.port, item.role, item.sub].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });

    if (matches.length === 0) {
      return `<div style="padding:20px;text-align:center;color:#94a3b8;font-size:13px;">검색 결과 없음 (${query})</div>`;
    }

    const cards = matches.map(item => {
      // Inject a type tag into the meta column so users can see which category this match came from
      const itemWithTypeMeta = {
        ...item,
        role: item.role || item.port || '',
        // Append type to whatever already exists in the meta column
      };
      // We use cardHtml directly, but augment the right-side meta to include the type
      const sub = item.sub ? `<span style="font-size:10px;color:#94a3b8;margin-left:6px;">· ${item.sub}</span>` : '';
      const abbr = item.abbr ? `<span style="font-size:9px;color:#94a3b8;background:#f1f5f9;padding:1px 5px;border-radius:3px;font-weight:600;margin-left:6px;">${item.abbr}</span>` : '';
      const typeBadge = `<span style="font-size:9px;color:#0f172a;background:#e0f2fe;padding:1px 5px;border-radius:3px;font-weight:600;margin-left:6px;">${item.type}</span>`;
      const meta = item.role || item.port || '';
      const url = item.url || '';
      const portKey = item.portKey || '';
      return `
        <button data-port-key="${portKey}" data-url="${url}" class="dir-card" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 10px 7px 12px;background:#ffffff;border:1px solid #e2e8f0;border-left:3px solid ${item.typeColor};border-radius:5px;cursor:pointer;font-family:inherit;text-align:left;transition:all 0.12s ease;">
          <div style="display:flex;align-items:center;gap:0;flex-wrap:wrap;min-width:0;">
            <span style="font-size:12px;color:#0f172a;font-weight:600;line-height:1.3;">${item.name}</span>
            ${abbr}
            ${typeBadge}
            ${sub}
          </div>
          <span style="font-size:10px;color:#64748b;line-height:1.3;text-align:right;white-space:nowrap;flex-shrink:0;">${meta}</span>
        </button>
      `;
    }).join('');

    return `
      <div style="margin-bottom:10px;font-size:11px;color:#64748b;">검색 결과: <strong style="color:#0f172a;">${matches.length}건</strong> "${query}"</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:4px;">${cards}</div>
    `;
  }

  // ============================================================
  // 진입점
  // ============================================================
  function renderHeader() {
    const container = document.getElementById('korea-port-header');
    if (!container) {
      console.error('[port-atlas-header] Container #korea-port-header not found');
      return;
    }
    container.innerHTML = buildTriggerHtml() + buildPanelHtml();
    attachTriggerHandler();
    attachSearchHandler();
    attachL1Handlers();
    renderL2();
    renderContent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeader);
  } else {
    renderHeader();
  }
})();

/**
 * ship.fairtech.kr - 한국 무역항 안내도 헤더 + 기관 디렉토리
 * MOF 카드 + 메가 메뉴 (5개 탭: 총괄/지방청/항만공사/도선사회/산하기관)
 *
 * 사용처: ship.fairtech.kr/category/port-guide/
 * 작동:
 *   - #korea-port-header 컨테이너에 MOF 카드 + 트리거 버튼 렌더링
 *   - 트리거 클릭 시 메가 패널 펼침
 *   - 일부 카드는 클릭 시 지도와 연동 (CustomEvent 발송)
 */

(function () {
  'use strict';

  // ============================================================
  // 1. 해양수산부 (총괄)
  // ============================================================
  const MOF = {
    name: '해양수산부',
    nameEn: 'Ministry of Oceans and Fisheries',
    abbr: 'MOF',
    headquarters: '부산광역시 동구 중앙대로 361번길 14 (아이엠빌딩)',
    note: '2025년 세종 → 부산 이전. 정부세종청사에 일부 부서 잔존.',
    url: 'https://www.mof.go.kr',
    callCenter: '110 (정부민원안내콜센터)',
  };

  // ============================================================
  // 2. 지방해양수산청 (11) + 제주관리단 (1)
  // ============================================================
  const OFFICES = {
    수도권충청: {
      color: '#14b8a6',
      label: '수도권·충청',
      items: [
        { name: '인천지방해양수산청', port: '인천항', url: 'https://incheon.mof.go.kr', portKey: '인천항' },
        { name: '평택지방해양수산청', port: '평택·당진항', url: 'https://pyeongtaek.mof.go.kr', portKey: '평택·당진항' },
        { name: '대산지방해양수산청', port: '대산항', url: 'https://daesan.mof.go.kr', portKey: '대산항' },
      ],
    },
    호남: {
      color: '#fbbf24',
      label: '호남',
      items: [
        { name: '군산지방해양수산청', port: '군산항', url: 'https://gunsan.mof.go.kr', portKey: '군산항' },
        { name: '목포지방해양수산청', port: '목포항', url: 'https://mokpo.mof.go.kr', portKey: '목포항' },
        { name: '여수지방해양수산청', port: '광양·여수항', url: 'https://yeosu.mof.go.kr', portKey: '광양항' },
      ],
    },
    영남: {
      color: '#f97316',
      label: '영남',
      items: [
        { name: '부산지방해양수산청', port: '부산항', url: 'https://busan.mof.go.kr', portKey: '부산항' },
        { name: '마산지방해양수산청', port: '마산항', url: 'https://masan.mof.go.kr', portKey: '마산항' },
        { name: '울산지방해양수산청', port: '울산항', url: 'https://ulsan.mof.go.kr', portKey: '울산항' },
        { name: '포항지방해양수산청', port: '포항항', url: 'https://pohang.mof.go.kr', portKey: '포항항' },
      ],
    },
    동해안: {
      color: '#ef4444',
      label: '동해안',
      items: [
        { name: '동해지방해양수산청', port: '동해·묵호항', url: 'https://donghae.mof.go.kr', portKey: '동해·묵호항' },
      ],
    },
    제주: {
      color: '#a78bfa',
      label: '제주',
      items: [
        { name: '제주해양수산관리단', port: '제주항', url: 'https://yeosu.mof.go.kr', portKey: '제주항', sub: '여수청 산하' },
      ],
    },
  };

  // ============================================================
  // 3. 항만공사 5개
  // ============================================================
  const PORT_AUTHORITIES = [
    { name: '부산항만공사', abbr: 'BPA', port: '부산항', url: 'https://www.busanpa.com', portKey: '부산항' },
    { name: '인천항만공사', abbr: 'IPA', port: '인천항', url: 'https://www.icpa.or.kr', portKey: '인천항' },
    { name: '여수광양항만공사', abbr: 'YGPA', port: '광양·여수항', url: 'https://www.ygpa.or.kr', portKey: '광양항' },
    { name: '울산항만공사', abbr: 'UPA', port: '울산항', url: 'https://www.upa.or.kr', portKey: '울산항' },
    { name: '경기평택항만공사', abbr: 'GPPC', port: '평택·당진항', url: 'https://www.gppc.or.kr', portKey: '평택·당진항', sub: '지방공기업' },
  ];

  // ============================================================
  // 4. 도선사회 12개
  // ============================================================
  const PILOTS = [
    { name: '한국도선사협회', abbr: 'KMPA', url: 'https://www.kmpilot.or.kr', sub: '총괄 협회' },
    { name: '부산항도선사회', port: '부산항', url: 'http://www.busanpilot.co.kr', tel: '051-465-1651', portKey: '부산항' },
    { name: '인천항도선사회', port: '인천항', url: 'http://www.incheonpilot.com', tel: '032-883-8111', portKey: '인천항' },
    { name: '여수항도선사회', port: '광양·여수항', url: 'http://www.yspilot.co.kr', tel: '061-660-1383', portKey: '광양항' },
    { name: '울산항도선사회', port: '울산항', tel: '052-261-7703', portKey: '울산항' },
    { name: '평택당진항도선사회', port: '평택·당진항', portKey: '평택·당진항' },
    { name: '대산항도선사회', port: '대산항', portKey: '대산항' },
    { name: '마산항도선사회', port: '마산항', portKey: '마산항' },
    { name: '포항항도선사회', port: '포항항', portKey: '포항항' },
    { name: '군산항도선사회', port: '군산항', portKey: '군산항' },
    { name: '목포항도선사회', port: '목포항', url: 'http://www.mppilot.co.kr', portKey: '목포항' },
    { name: '동해항도선사회', port: '동해·묵호항', portKey: '동해·묵호항' },
    { name: '제주항도선사회', port: '제주항', portKey: '제주항' },
  ];

  // ============================================================
  // 5. 산하 기관 / 유관 단체
  // ============================================================
  const AGENCIES = [
    { name: '한국해양교통안전공단', abbr: 'KOMSA', url: 'https://www.komsa.or.kr', role: '해양교통안전 종합관리, 선박검사' },
    { name: '한국해양과학기술원', abbr: 'KIOST', url: 'https://www.kiost.ac.kr', role: '해양과학기술 연구개발' },
    { name: '한국해양수산개발원', abbr: 'KMI', url: 'https://www.kmi.re.kr', role: '해양수산 정책 연구' },
    { name: '국립해양조사원', abbr: 'KHOA', url: 'https://www.khoa.go.kr', role: '수로·해양조사' },
    { name: '국립수산과학원', abbr: 'NIFS', url: 'https://www.nifs.go.kr', role: '수산 연구' },
    { name: '해양환경공단', abbr: 'KOEM', url: 'https://www.koem.or.kr', role: '해양환경 보전·관리, 방제' },
    { name: '한국해양수산연수원', abbr: 'KIMFT', url: 'https://www.seaman.or.kr', role: '선원 교육·훈련' },
    { name: '국립해양박물관', abbr: 'NMM', url: 'https://www.nmm.go.kr', role: '해양문화·산업 유산' },
    { name: '국립해양과학관', abbr: '', url: '', role: '해양과학 전시·교육' },
    { name: '해양수산과학기술진흥원', abbr: 'KIMST', url: '', role: '해양과학기술 정책 지원' },
    { name: '국립해양생물자원관', abbr: 'MABIK', url: '', role: '해양생물자원' },
    { name: '한국수산자원공단', abbr: 'FIRA', url: '', role: '인공어초·바다숲·종묘방류' },
    { name: '한국선급', abbr: 'KR', url: 'https://www.krs.co.kr', role: '선급·검사 (민간)' },
    { name: '해양경찰청', abbr: 'KCG', url: 'https://www.kcg.go.kr', role: '해상경비·구조·방제 (행안부 산하)' },
    { name: '한국항만물류협회', abbr: '', url: '', role: '항만물류 협회 (11개 지방협회)' },
  ];

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
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;">
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
    const totalCount = 1 + 12 + PORT_AUTHORITIES.length + PILOTS.length + AGENCIES.length;
    return `
      <button id="port-directory-trigger" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;font-size:13px;color:#0f172a;font-weight:600;transition:all 0.15s ease;">
        <span style="display:flex;align-items:center;gap:10px;">
          <span style="display:inline-block;width:6px;height:24px;background:#14b8a6;border-radius:3px;"></span>
          <span>한국 해양 행정 디렉토리</span>
          <span style="font-size:11px;color:#94a3b8;font-weight:400;">총 ${totalCount}개 기관</span>
        </span>
        <span id="port-directory-arrow" style="font-size:14px;color:#64748b;transition:transform 0.2s ease;">▼</span>
      </button>
    `;
  }

  // ============================================================
  // 메가 패널 (탭 + 콘텐츠)
  // ============================================================
  function buildPanelHtml() {
    return `
      <div id="port-directory-panel" style="display:none;margin-top:8px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
        <div style="display:flex;border-bottom:1px solid #e2e8f0;background:#f8fafc;flex-wrap:wrap;">
          <button class="dir-tab" data-tab="offices" style="flex:1;min-width:120px;padding:12px 14px;background:#ffffff;border:none;border-bottom:2px solid #14b8a6;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;color:#0f172a;">지방청 (12)</button>
          <button class="dir-tab" data-tab="pa" style="flex:1;min-width:120px;padding:12px 14px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;color:#64748b;">항만공사 (${PORT_AUTHORITIES.length})</button>
          <button class="dir-tab" data-tab="pilots" style="flex:1;min-width:120px;padding:12px 14px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;color:#64748b;">도선사회 (${PILOTS.length})</button>
          <button class="dir-tab" data-tab="agencies" style="flex:1;min-width:120px;padding:12px 14px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;color:#64748b;">산하기관 (${AGENCIES.length})</button>
        </div>
        <div id="dir-tab-content" style="padding:16px 18px;">${buildOfficesTabHtml()}</div>
      </div>
    `;
  }

  // ============================================================
  // 탭 콘텐츠 — 지방청
  // ============================================================
  function buildOfficesTabHtml() {
    const groups = Object.entries(OFFICES).map(([key, group]) => {
      const cards = group.items.map(o => {
        const sub = o.sub ? `<div style="font-size:9px;color:#94a3b8;margin-top:2px;">${o.sub}</div>` : '';
        return `
          <button data-port-key="${o.portKey}" data-url="${o.url}" class="dir-card" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:10px 12px;background:#ffffff;border:1px solid #e2e8f0;border-left:3px solid ${group.color};border-radius:6px;cursor:pointer;font-family:inherit;text-align:left;transition:all 0.15s ease;">
            <div style="font-size:12px;color:#0f172a;font-weight:600;line-height:1.3;">${o.name}</div>
            <div style="font-size:10px;color:#64748b;">${o.port}</div>
            ${sub}
          </button>
        `;
      }).join('');
      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${group.color};"></span>
            <span style="font-size:11px;color:#475569;font-weight:600;">${group.label} (${group.items.length})</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px;">${cards}</div>
        </div>
      `;
    }).join('');
    return groups;
  }

  // ============================================================
  // 탭 콘텐츠 — 항만공사
  // ============================================================
  function buildPaTabHtml() {
    const cards = PORT_AUTHORITIES.map(pa => {
      const sub = pa.sub ? `<div style="font-size:9px;color:#94a3b8;margin-top:2px;">${pa.sub}</div>` : '';
      return `
        <button data-port-key="${pa.portKey}" data-url="${pa.url}" class="dir-card" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:12px 14px;background:#ffffff;border:1px solid #e2e8f0;border-left:3px solid #14b8a6;border-radius:6px;cursor:pointer;font-family:inherit;text-align:left;transition:all 0.15s ease;">
          <div style="display:flex;align-items:center;gap:6px;">
            <div style="font-size:13px;color:#0f172a;font-weight:700;">${pa.name}</div>
            <div style="font-size:10px;color:#94a3b8;background:#f1f5f9;padding:2px 6px;border-radius:3px;font-weight:600;">${pa.abbr}</div>
          </div>
          <div style="font-size:11px;color:#64748b;">${pa.port}</div>
          ${sub}
        </button>
      `;
    }).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;">${cards}</div>`;
  }

  // ============================================================
  // 탭 콘텐츠 — 도선사회
  // ============================================================
  function buildPilotsTabHtml() {
    const cards = PILOTS.map(p => {
      const isAssoc = !p.port;
      const borderColor = isAssoc ? '#a78bfa' : '#f97316';
      const portText = p.port ? p.port : (p.sub || '');
      const tel = p.tel ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px;">${p.tel}</div>` : '';
      const url = p.url || '';
      return `
        <button data-port-key="${p.portKey || ''}" data-url="${url}" class="dir-card" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:10px 12px;background:#ffffff;border:1px solid #e2e8f0;border-left:3px solid ${borderColor};border-radius:6px;cursor:pointer;font-family:inherit;text-align:left;transition:all 0.15s ease;">
          <div style="font-size:12px;color:#0f172a;font-weight:600;line-height:1.3;">${p.name}</div>
          <div style="font-size:10px;color:#64748b;">${portText}</div>
          ${tel}
        </button>
      `;
    }).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px;">${cards}</div>`;
  }

  // ============================================================
  // 탭 콘텐츠 — 산하기관
  // ============================================================
  function buildAgenciesTabHtml() {
    const cards = AGENCIES.map(a => {
      const abbr = a.abbr ? `<div style="font-size:10px;color:#94a3b8;background:#f1f5f9;padding:2px 6px;border-radius:3px;font-weight:600;">${a.abbr}</div>` : '';
      const url = a.url || '';
      return `
        <button data-port-key="" data-url="${url}" class="dir-card" style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:12px 14px;background:#ffffff;border:1px solid #e2e8f0;border-left:3px solid #6366f1;border-radius:6px;cursor:pointer;font-family:inherit;text-align:left;transition:all 0.15s ease;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <div style="font-size:12px;color:#0f172a;font-weight:700;line-height:1.3;">${a.name}</div>
            ${abbr}
          </div>
          <div style="font-size:10px;color:#64748b;line-height:1.4;">${a.role}</div>
        </button>
      `;
    }).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;">${cards}</div>`;
  }

  // ============================================================
  // 이벤트 핸들러
  // ============================================================
  function attachHandlers() {
    const trigger = document.getElementById('port-directory-trigger');
    const panel = document.getElementById('port-directory-panel');
    const arrow = document.getElementById('port-directory-arrow');

    if (trigger && panel && arrow) {
      trigger.addEventListener('click', () => {
        const isOpen = panel.style.display === 'block';
        panel.style.display = isOpen ? 'none' : 'block';
        arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
      });
      trigger.addEventListener('mouseenter', () => { trigger.style.background = '#f8fafc'; });
      trigger.addEventListener('mouseleave', () => { trigger.style.background = '#ffffff'; });
    }

    attachTabHandlers();
  }

  function attachTabHandlers() {
    const tabs = document.querySelectorAll('.dir-tab');
    const content = document.getElementById('dir-tab-content');
    if (!content) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.style.background = 'transparent';
          t.style.borderBottomColor = 'transparent';
          t.style.color = '#64748b';
          t.style.fontWeight = '500';
        });
        tab.style.background = '#ffffff';
        tab.style.borderBottomColor = '#14b8a6';
        tab.style.color = '#0f172a';
        tab.style.fontWeight = '600';

        const tabName = tab.getAttribute('data-tab');
        if (tabName === 'offices') content.innerHTML = buildOfficesTabHtml();
        else if (tabName === 'pa') content.innerHTML = buildPaTabHtml();
        else if (tabName === 'pilots') content.innerHTML = buildPilotsTabHtml();
        else if (tabName === 'agencies') content.innerHTML = buildAgenciesTabHtml();

        attachCardHandlers();
      });
    });

    attachCardHandlers();
  }

  function attachCardHandlers() {
    const cards = document.querySelectorAll('.dir-card');
    cards.forEach(card => {
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
        // Shift-click 또는 우클릭 = URL 새 탭
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          if (url) window.open(url, '_blank', 'noopener');
          return;
        }
        // 일반 클릭 = 지도 연동 (있으면) + URL 열기
        if (portKey) {
          window.dispatchEvent(new CustomEvent('port-atlas:focus-port', { detail: { portKey } }));
        }
        if (url) {
          window.open(url, '_blank', 'noopener');
        }
      });
    });
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
    container.innerHTML = buildMofHtml() + buildTriggerHtml() + buildPanelHtml();
    attachHandlers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeader);
  } else {
    renderHeader();
  }
})();

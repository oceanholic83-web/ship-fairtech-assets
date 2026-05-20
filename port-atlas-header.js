/**
 * ship.fairtech.kr - 한국 무역항 안내도 헤더
 * 해양수산부 + 지방청 + 항만공사 계층 정보
 *
 * 사용처: ship.fairtech.kr/category/port-guide/
 * 작동: #korea-port-header 컨테이너에 카드 렌더링
 */

(function () {
  'use strict';

  // ============================================================
  // 데이터 — 해양수산부 (총괄)
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

  // 지방해양수산청 11개 (권역별)
  const OFFICES = {
    수도권충청: {
      color: '#14b8a6',
      label: '수도권·충청',
      items: [
        { id: 'incheon', name: '인천지방해양수산청', port: '인천항', url: 'https://incheon.mof.go.kr', portKey: '인천항' },
        { id: 'pyeongtaek', name: '평택지방해양수산청', port: '평택·당진항', url: 'https://pyeongtaek.mof.go.kr', portKey: '평택·당진항' },
        { id: 'daesan', name: '대산지방해양수산청', port: '대산항', url: 'https://daesan.mof.go.kr', portKey: '대산항' },
      ],
    },
    호남: {
      color: '#fbbf24',
      label: '호남',
      items: [
        { id: 'gunsan', name: '군산지방해양수산청', port: '군산항', url: 'https://gunsan.mof.go.kr', portKey: '군산항' },
        { id: 'mokpo', name: '목포지방해양수산청', port: '목포항', url: 'https://mokpo.mof.go.kr', portKey: '목포항' },
        { id: 'yeosu', name: '여수지방해양수산청', port: '광양·여수항', url: 'https://yeosu.mof.go.kr', portKey: '광양항' },
      ],
    },
    영남: {
      color: '#f97316',
      label: '영남',
      items: [
        { id: 'busan', name: '부산지방해양수산청', port: '부산항', url: 'https://busan.mof.go.kr', portKey: '부산항' },
        { id: 'masan', name: '마산지방해양수산청', port: '마산항', url: 'https://masan.mof.go.kr', portKey: '마산항' },
        { id: 'ulsan', name: '울산지방해양수산청', port: '울산항', url: 'https://ulsan.mof.go.kr', portKey: '울산항' },
        { id: 'pohang', name: '포항지방해양수산청', port: '포항항', url: 'https://pohang.mof.go.kr', portKey: '포항항' },
      ],
    },
    동해안: {
      color: '#ef4444',
      label: '동해안',
      items: [
        { id: 'donghae', name: '동해지방해양수산청', port: '동해·묵호항', url: 'https://donghae.mof.go.kr', portKey: '동해·묵호항' },
      ],
    },
  };

  // 제주는 별도 (제주해양수산관리단, 여수청 산하)
  const JEJU_OFFICE = {
    id: 'jeju',
    name: '제주해양수산관리단',
    port: '제주항',
    parentNote: '여수지방해양수산청 산하',
    portKey: '제주항',
    color: '#a78bfa',
  };

  // ============================================================
  // 헤더 박스 HTML 생성 — 해양수산부 카드만 (1차)
  // ============================================================
  function buildHeaderHtml() {
    return `
      <div style="margin-bottom:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#0f172a;">
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

  function buildOfficesHtml() {
    const groups = Object.entries(OFFICES).map(([key, group]) => {
      const cards = group.items.map(o => `
        <button data-port-key="${o.portKey}" class="port-office-card" style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:10px 12px;background:#ffffff;border:1px solid #e2e8f0;border-left:3px solid ${group.color};border-radius:6px;cursor:pointer;font-family:inherit;text-align:left;transition:all 0.15s ease;">
          <div style="font-size:12px;color:#0f172a;font-weight:600;">${o.name}</div>
          <div style="font-size:10px;color:#64748b;">${o.port}</div>
        </button>
      `).join('');
      return `
        <div style="margin-top:10px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${group.color};"></span>
            <span style="font-size:11px;color:#475569;font-weight:600;">${group.label} (${group.items.length})</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px;">${cards}</div>
        </div>
      `;
    }).join('');

    const jejuCard = `
      <div style="margin-top:10px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${JEJU_OFFICE.color};"></span>
          <span style="font-size:11px;color:#475569;font-weight:600;">제주 (1)</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px;">
          <button data-port-key="${JEJU_OFFICE.portKey}" class="port-office-card" style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:10px 12px;background:#ffffff;border:1px solid #e2e8f0;border-left:3px solid ${JEJU_OFFICE.color};border-radius:6px;cursor:pointer;font-family:inherit;text-align:left;transition:all 0.15s ease;">
            <div style="font-size:12px;color:#0f172a;font-weight:600;">${JEJU_OFFICE.name}</div>
            <div style="font-size:10px;color:#64748b;">${JEJU_OFFICE.port} · ${JEJU_OFFICE.parentNote}</div>
          </button>
        </div>
      </div>
    `;

    return `
      <div style="margin-bottom:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#0f172a;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-size:10px;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;font-weight:500;">지방해양수산청</div>
            <div style="font-size:16px;color:#0f172a;font-weight:700;">전국 11개 + 제주관리단</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">카드를 클릭하면 지도가 해당 항만으로 이동합니다.</div>
          </div>
        </div>
        ${groups}
        ${jejuCard}
      </div>
    `;
  }

  function attachOfficeCardHandlers() {
    const cards = document.querySelectorAll('.port-office-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.background = '#f1f5f9';
        card.style.transform = 'translateY(-1px)';
      });
      card.addEventListener('mouseleave', () => {
        card.style.background = '#ffffff';
        card.style.transform = 'translateY(0)';
      });
      card.addEventListener('click', () => {
        const portKey = card.getAttribute('data-port-key');
        // Dispatch custom event for port-atlas.js to listen to
        window.dispatchEvent(new CustomEvent('port-atlas:focus-port', { detail: { portKey } }));
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
    container.innerHTML = buildHeaderHtml() + buildOfficesHtml();
    attachOfficeCardHandlers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeader);
  } else {
    renderHeader();
  }
})();

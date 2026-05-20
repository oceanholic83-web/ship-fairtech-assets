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

  // ============================================================
  // 진입점
  // ============================================================
  function renderHeader() {
    const container = document.getElementById('korea-port-header');
    if (!container) {
      console.error('[port-atlas-header] Container #korea-port-header not found');
      return;
    }
    container.innerHTML = buildHeaderHtml();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeader);
  } else {
    renderHeader();
  }
})();

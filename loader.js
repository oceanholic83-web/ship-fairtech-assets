/**
 * ship.fairtech.kr - 항만 가이드 페이지 단일 진입점 (loader)
 *
 * WPCode 예시 (토큰은 인라인으로 설정 — 저장소에 커밋하지 않음):
 *   <script>window.PORT_ATLAS_CONFIG={mapboxToken:'pk.YOUR_TOKEN'};</script>
 *   <div id="korea-port-app"></div>
 *   <script src="https://cdn.jsdelivr.net/gh/oceanholic83-web/ship-fairtech-assets@main/loader.js"></script>
 *
 * 이 파일이 나머지 모든 것 (HTML 구조, Mapbox CSS/JS, 토큰, 헤더/지도 스크립트) 로드.
 */

(function () {
  'use strict';

  const MAPBOX_TOKEN = (window.PORT_ATLAS_CONFIG && window.PORT_ATLAS_CONFIG.mapboxToken) || '';
  const REPO_BASE = 'https://cdn.jsdelivr.net/gh/oceanholic83-web/ship-fairtech-assets@76bb9e6';
  const MAPBOX_VERSION = 'v3.7.0';

  // 페이지 구조 HTML
  function buildAppHtml() {
    return `
      <div style="margin:24px 0;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;margin-bottom:12px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#0f172a;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;">
            <div style="flex:1;min-width:240px;">
              <div style="font-size:10px;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;font-weight:500;">한국 무역항 종합 안내도 · 총괄 해양수산부 (MOF)</div>
              <div style="font-size:13px;color:#475569;line-height:1.5;">전국 12개 무역항의 위치, 관할 청, 항만공사, VTS 채널, 시설을 한눈에. 마커 또는 카드를 클릭해 각 항만 정보를 확인하세요.</div>
              <div style="font-size:11px;color:#94a3b8;line-height:1.5;margin-top:6px;">2025년 본부 부산 이전 (부산광역시 동구 아이엠빌딩) · 민원 콜센터 110</div>
            </div>
            <a href="https://www.mof.go.kr" target="_blank" rel="noopener" style="display:inline-block;padding:8px 14px;background:#14b8a6;color:#ffffff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap;">해양수산부 →</a>
          </div>
        </div>
        <div id="korea-port-header"></div>
        <div id="korea-port-map" style="width:100%;height:600px;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;margin-top:12px;"></div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;font-size:11px;color:#475569;">
          <div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#14b8a6;"></span>수도권·충청</div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#fbbf24;"></span>호남</div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#f97316;"></span>영남</div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ef4444;"></span>동해안</div>
          <div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#a78bfa;"></span>제주</div>
        </div>
      </div>
    `;
  }

  // 외부 리소스 동적 로드 헬퍼
  function loadCss(href) {
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });
  }

  // 진입점
  async function init() {
    const container = document.getElementById('korea-port-app');
    if (!container) {
      console.error('[loader] #korea-port-app not found');
      return;
    }

    // 1) HTML 구조 주입
    container.innerHTML = buildAppHtml();

    // 2) Mapbox 토큰 확인 (WPCode 인라인 script에서 PORT_ATLAS_CONFIG 설정 필요)
    if (!MAPBOX_TOKEN) {
      console.error('[loader] Mapbox token not provided. Set window.PORT_ATLAS_CONFIG.mapboxToken before loader.js');
      return;
    }
    window.PORT_ATLAS_CONFIG = Object.assign({}, window.PORT_ATLAS_CONFIG, { mapboxToken: MAPBOX_TOKEN });

    // 3) Mapbox CSS + JS 로드
    await loadCss(`https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.css`);
    try {
      await loadScript(`https://api.mapbox.com/mapbox-gl-js/${MAPBOX_VERSION}/mapbox-gl.js`);
    } catch (e) {
      console.error('[loader] Mapbox GL JS load failed', e);
      return;
    }

    // 4) Header + Map 스크립트 로드 (순서 중요: header 먼저)
    try {
      await loadScript(`${REPO_BASE}/data.js`);
      await loadScript(`${REPO_BASE}/port-atlas-header.js`);
      await loadScript(`${REPO_BASE}/port-atlas.js`);
    } catch (e) {
      console.error('[loader] App scripts load failed', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

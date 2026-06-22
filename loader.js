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
  const REPO_BASE = (() => {
    // Try to extract base (including @version anchor) from this script's own src
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      const m = s.src.match(/^(https:\/\/cdn\.jsdelivr\.net\/gh\/oceanholic83-web\/ship-fairtech-assets@[^/]+)\/loader\.js/);
      if (m) return m[1];
    }
    // Fallback to @main if not found
    return 'https://cdn.jsdelivr.net/gh/oceanholic83-web/ship-fairtech-assets@main';
  })();
  const MAPBOX_VERSION = 'v3.7.0';

  // 페이지 구조 HTML
  function buildAppHtml() {
    return `
      <div style="margin:8px 0 16px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 16px;margin-bottom:8px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#0f172a;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;">
            <div style="flex:1;min-width:240px;">
              <div style="font-size:10px;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;font-weight:500;">FAIRCAST 항만 가이드</div>
              <div style="font-size:13px;color:#475569;line-height:1.6;">한국 12개 무역항의 입항 절차, 시설, 운영 정보를 정리한 실용 가이드입니다. 지도에서 항만을 클릭하거나, 아래 카드에서 각 항만의 상세 가이드로 이동할 수 있습니다.</div>
            </div>
          </div>
        </div>
        <div id="korea-port-header"></div>
        <div id="korea-port-map" style="width:100%;height:600px;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden;margin-top:8px;"></div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;font-size:11px;color:#475569;">
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

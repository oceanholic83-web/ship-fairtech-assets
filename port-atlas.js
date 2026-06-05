/**
 * ship.fairtech.kr - 한국 무역항 종합 안내도
 * Mapbox GL JS 기반 인터랙티브 지도
 *
 * 사용처: ship.fairtech.kr/category/port-guide/
 *
 * 사용법 (워드프레스 임베드 코드에서):
 *   window.PORT_ATLAS_CONFIG = { mapboxToken: 'pk.xxx' };
 *   <script src=".../port-atlas.js"></script>
 *
 * 데이터 구조 (PORTS 배열):
 *   name, nameEn, locode, coords, region, color
 *   authority, authorityUrl, pa, paUrl, pilotage, vts
 *   facilities, note, faircall, guideUrl
 *
 * guideUrl이 null이면 가이드 버튼 미표시.
 * 가이드 글 발행 시 해당 항만 guideUrl만 채우면 됨.
 */

(function () {
  'use strict';

  // ============================================================
  // 설정 (토큰은 외부에서 주입)
  // ============================================================
  const CONFIG = {
    mapboxToken: (window.PORT_ATLAS_CONFIG && window.PORT_ATLAS_CONFIG.mapboxToken) || '',
    mapStyle: 'mapbox://styles/mapbox/light-v11',
    center: [127.8, 36.0],
    zoom: 6,
    containerId: 'korea-port-map',
  };

  const REGION_COLORS = {
    수도권충청: '#14b8a6',
    호남: '#fbbf24',
    영남: '#f97316',
    동해안: '#ef4444',
    제주: '#a78bfa',
  };

  // PORTS data now lives in data.js (single source of truth). data.js loads first per loader.js.
  const PORTS = window.PORT_ATLAS_DATA.PORTS;

  // ============================================================
  // 팝업 HTML 생성
  // ============================================================
  function buildPopupHtml(port) {
    const guideBtn = port.guideUrl
      ? `<a href="${port.guideUrl}" target="_blank" rel="noopener" style="display:block;padding:7px 8px;background:#f1f5f9;color:#0f172a;text-align:center;text-decoration:none;border-radius:5px;font-size:11px;font-weight:600;">📖 가이드</a>`
      : '';
    const gridCols = port.guideUrl ? '1fr 1fr 1fr' : '1fr 1fr';

    return `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;min-width:260px;max-width:300px;color:#0f172a;">
        <div style="border-bottom:2px solid ${port.color};padding-bottom:8px;margin-bottom:10px;">
          <div style="font-size:16px;font-weight:700;color:${port.color};">${port.name}</div>
          <div style="font-size:10px;color:#64748b;margin-top:2px;">${port.nameEn} · ${port.locode}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:12px;line-height:1.5;">
          <div><span style="color:#94a3b8;width:65px;display:inline-block;">관할청</span><span style="color:#0f172a;">${port.authority}</span></div>
          <div><span style="color:#94a3b8;width:65px;display:inline-block;">항만공사</span><span style="color:#0f172a;">${port.pa}</span></div>
          <div><span style="color:#94a3b8;width:65px;display:inline-block;">도선사회</span><span style="color:#0f172a;">${port.pilotage}</span></div>
          <div><span style="color:#94a3b8;width:65px;display:inline-block;">VTS</span><span style="color:#0f172a;">${port.vts}</span></div>
        </div>
        <div style="margin-top:10px;padding-top:8px;border-top:1px solid #e2e8f0;">
          <div style="font-size:10px;color:#94a3b8;letter-spacing:0.8px;margin-bottom:4px;">주요 시설</div>
          <div style="font-size:11px;color:#475569;line-height:1.5;">${port.facilities}</div>
        </div>
        <div style="margin-top:8px;padding:8px 10px;background:#f8fafc;border-radius:6px;border-left:2px solid ${port.color};">
          <div style="font-size:11px;color:#64748b;line-height:1.5;font-style:italic;">${port.note}</div>
        </div>
        <div style="display:grid;grid-template-columns:${gridCols};gap:6px;margin-top:10px;">
          <a href="${port.faircall}" target="_blank" rel="noopener" style="display:block;padding:7px 8px;background:${port.color};color:#ffffff;text-align:center;text-decoration:none;border-radius:5px;font-size:11px;font-weight:700;">🔴 실시간</a>
          <a href="${port.authorityUrl}" target="_blank" rel="noopener" style="display:block;padding:7px 8px;background:#f1f5f9;color:#0f172a;text-align:center;text-decoration:none;border-radius:5px;font-size:11px;font-weight:600;">📋 관할청</a>
          ${guideBtn}
        </div>
      </div>
    `;
  }

  // ============================================================
  // 마커 엘리먼트 생성 (호버 버그 해결 — wrapper + inner 구조)
  // ============================================================
  function createMarkerEl(port) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      width:18px;
      height:18px;
      cursor:pointer;
    `;

    const inner = document.createElement('div');
    inner.style.cssText = `
      width:100%;
      height:100%;
      border-radius:50%;
      background:${port.color};
      border:2px solid #ffffff;
      box-shadow:0 0 0 2px ${port.color}40, 0 2px 4px rgba(0,0,0,0.4);
      transition:transform 0.15s ease;
      transform-origin:center;
      box-sizing:border-box;
    `;

    wrapper.addEventListener('mouseenter', () => {
      inner.style.transform = 'scale(1.3)';
    });
    wrapper.addEventListener('mouseleave', () => {
      inner.style.transform = 'scale(1)';
    });

    wrapper.appendChild(inner);
    return wrapper;
  }

  // ============================================================
  // 팝업 스타일 주입 (1회)
  // ============================================================
  function injectPopupStyle() {
    if (document.getElementById('korea-port-popup-style')) return;
    const style = document.createElement('style');
    style.id = 'korea-port-popup-style';
    style.textContent = `
    .korea-port-popup .mapboxgl-popup-content {
      background: #ffffff !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 10px !important;
      padding: 14px !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.12) !important;
      max-height: 480px !important;
      overflow-y: auto !important;
    }
    .korea-port-popup .mapboxgl-popup-tip {
      border-top-color: #ffffff !important;
      border-bottom-color: #ffffff !important;
    }
    .korea-port-popup .mapboxgl-popup-close-button {
      color: #94a3b8 !important;
      font-size: 18px !important;
      padding: 4px 8px !important;
    }
    .korea-port-popup .mapboxgl-popup-close-button:hover {
      color: #0f172a !important;
      background: transparent !important;
    }
    `;
    document.head.appendChild(style);
  }

  // ============================================================
  // 지도 초기화 + 마커 렌더링
  // ============================================================
  function initMap() {
    if (typeof mapboxgl === 'undefined') {
      console.error('[port-atlas] Mapbox GL JS not loaded');
      return;
    }
    if (!CONFIG.mapboxToken) {
      console.error('[port-atlas] Mapbox token not provided. Set window.PORT_ATLAS_CONFIG.mapboxToken before loading this script.');
      return;
    }
    const container = document.getElementById(CONFIG.containerId);
    if (!container) {
      console.error(`[port-atlas] Container #${CONFIG.containerId} not found`);
      return;
    }

    mapboxgl.accessToken = CONFIG.mapboxToken;

    const map = new mapboxgl.Map({
      container: CONFIG.containerId,
      style: CONFIG.mapStyle,
      center: CONFIG.center,
      zoom: CONFIG.zoom,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');

    injectPopupStyle();

    const markersByName = {};
    PORTS.forEach((port) => {
      const el = createMarkerEl(port);
      const popup = new mapboxgl.Popup({
        offset: 15,
        maxWidth: '300px',
        closeButton: true,
        className: 'korea-port-popup',
      }).setHTML(buildPopupHtml(port));

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(port.coords)
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', (ev) => {
        ev.stopPropagation();
        // Recenter map on marker with vertical offset so popup has room on both sides
        map.flyTo({
          center: port.coords,
          zoom: Math.max(map.getZoom(), 8),
          duration: 600,
        });
      });

      markersByName[port.name] = marker;
    });

    window.addEventListener('port-atlas:focus-port', (e) => {
      const portKey = e.detail.portKey;
      const port = PORTS.find(p => p.name === portKey);
      if (!port) {
        console.warn('[port-atlas] Port not found:', portKey);
        return;
      }
      map.flyTo({
        center: port.coords,
        zoom: 9,
        duration: 1500,
        essential: true,
      });
      const marker = markersByName[portKey];
      if (marker) {
        marker.togglePopup();
      }
    });
  }

  // ============================================================
  // 진입점 (DOM ready)
  // ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();

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

  // ============================================================
  // 항만 데이터 (13개: 12개 무역항 + 광양만권 여수)
  // ============================================================
  const PORTS = [
    {
      name: '부산항',
      nameEn: 'Port of Busan',
      locode: 'KRPUS',
      coords: [129.07, 35.10],
      region: '영남',
      color: REGION_COLORS.영남,
      authority: '부산지방해양수산청',
      authorityUrl: 'https://busan.mof.go.kr',
      pa: '부산항만공사 (BPA)',
      paUrl: 'https://www.busanpa.com',
      pilotage: '부산항도선사회',
      vts: 'CH 12, 14',
      facilities: '북항(재래/일반), 신항(컨테이너), 감천항, 다대포항',
      note: '세계 7위 컨테이너 항만, 세계 최상위권 환적 허브, 한국 최대 무역항',
      faircall: 'https://faircall.kr/regions/yeongnam/busan',
      guideUrl: 'https://ship.fairtech.kr/busan-port-transshipment-hub-30-year-strategy/',
    },
    {
      name: '인천항',
      nameEn: 'Port of Incheon',
      locode: 'KRINC',
      coords: [126.62, 37.45],
      region: '수도권·충청',
      color: REGION_COLORS.수도권충청,
      authority: '인천지방해양수산청',
      authorityUrl: 'https://incheon.mof.go.kr',
      pa: '인천항만공사 (IPA)',
      paUrl: 'https://www.icpa.or.kr',
      pilotage: '인천항도선사회',
      vts: 'CH 14',
      facilities: '내항(1~8부두), 남항, 북항, 신항(컨테이너), 연안여객',
      note: '수도권 관문, 컨테이너 + 자동차 + 카페리',
      faircall: 'https://faircall.kr/regions/capital/incheon',
      guideUrl: 'https://ship.fairtech.kr/incheon-port-tidal-lock-gate-explained/',
    },
    {
      name: '평택·당진항',
      nameEn: 'Port of Pyeongtaek-Dangjin',
      locode: 'KRPTK',
      coords: [126.83, 36.97],
      region: '수도권·충청',
      color: REGION_COLORS.수도권충청,
      authority: '평택지방해양수산청',
      authorityUrl: 'https://pyeongtaek.mof.go.kr',
      pa: '경기평택항만공사',
      paUrl: 'https://www.gppc.or.kr',
      pilotage: '평택항도선사회',
      vts: 'CH 14',
      facilities: '동부두, 서부두, 자동차전용, LNG돌핀, 한전돌핀, 현대제철',
      note: '자동차 수출 1위, LNG 도입 거점',
      faircall: 'https://faircall.kr/regions/capital/031',
      guideUrl: null,
    },
    {
      name: '대산항',
      nameEn: 'Port of Daesan',
      locode: 'KRDSN',
      coords: [126.36, 37.00],
      region: '수도권·충청',
      color: REGION_COLORS.수도권충청,
      authority: '대산지방해양수산청',
      authorityUrl: 'https://daesan.mof.go.kr',
      pa: '관할청 직접 운영',
      paUrl: null,
      pilotage: '대산항도선사회',
      vts: 'CH 11',
      facilities: '일반부두, 석유화학부두(현대오일뱅크/롯데케미칼/한화토탈/LG화학), SBM',
      note: '한국 3위 액체화물 항만, Suezmax~VLCC 접안',
      faircall: 'https://faircall.kr/regions/chungcheong/daesan',
      guideUrl: null,
    },
    {
      name: '군산항',
      nameEn: 'Port of Gunsan',
      locode: 'KRKUV',
      coords: [126.62, 35.98],
      region: '호남',
      color: REGION_COLORS.호남,
      authority: '군산지방해양수산청',
      authorityUrl: 'https://gunsan.mof.go.kr',
      pa: '관할청 직접 운영',
      paUrl: null,
      pilotage: '군산항도선사회',
      vts: 'CH 14',
      facilities: '일반부두, 잡화, 컨테이너, 자동차전용',
      note: '새만금 인근, 자동차 + 잡화',
      faircall: 'https://faircall.kr/regions/honam/gunsan',
      guideUrl: null,
    },
    {
      name: '목포항',
      nameEn: 'Port of Mokpo',
      locode: 'KRMOK',
      coords: [126.38, 34.78],
      region: '호남',
      color: REGION_COLORS.호남,
      authority: '목포지방해양수산청',
      authorityUrl: 'https://mokpo.mof.go.kr',
      pa: '관할청 직접 운영',
      paUrl: null,
      pilotage: '목포항도선사회',
      vts: 'CH 14',
      facilities: '내항, 남항, 신항(자동차/잡화), 연안여객',
      note: '서남해 거점, 도서 여객 + 자동차',
      faircall: 'https://faircall.kr/regions/honam/mokpo',
      guideUrl: null,
    },
    {
      name: '광양항',
      nameEn: 'Port of Gwangyang',
      locode: 'KRKAN',
      coords: [127.70, 34.90],
      region: '호남',
      color: REGION_COLORS.호남,
      authority: '여수지방해양수산청',
      authorityUrl: 'https://yeosu.mof.go.kr',
      pa: '여수광양항만공사 (YGPA)',
      paUrl: 'https://www.ygpa.or.kr',
      pilotage: '여수항도선사회',
      vts: 'CH 14 (광양만권)',
      facilities: '컨테이너, 일반, 원료(POSCO), 석유화학(GS칼텍스/여천NCC)',
      note: '광양만권 거점 항만, POSCO 원료 + 컨테이너 + 석유화학, VLCC 접안 가능',
      faircall: 'https://faircall.kr/regions/gwangyang-bay/gwangyang',
      guideUrl: 'https://ship.fairtech.kr/gwangyang-yeosu-port-division-korea-guide/',
    },
    {
      name: '여수항',
      nameEn: 'Port of Yeosu',
      locode: 'KRYOS',
      coords: [127.74, 34.74],
      region: '호남',
      color: REGION_COLORS.호남,
      authority: '여수지방해양수산청',
      authorityUrl: 'https://yeosu.mof.go.kr',
      pa: '여수광양항만공사 (YGPA)',
      paUrl: 'https://www.ygpa.or.kr',
      pilotage: '여수항도선사회',
      vts: 'CH 14 (광양만권)',
      facilities: '여수국가산업단지(LG화학/GS칼텍스 외), 컨테이너 + 일반',
      note: '여수 석유화학 단지 연결',
      faircall: 'https://faircall.kr/regions/gwangyang-bay/yeosu',
      guideUrl: 'https://ship.fairtech.kr/gwangyang-yeosu-port-division-korea-guide/',
    },
    {
      name: '마산항',
      nameEn: 'Port of Masan',
      locode: 'KRMAS',
      coords: [128.58, 35.20],
      region: '영남',
      color: REGION_COLORS.영남,
      authority: '마산지방해양수산청',
      authorityUrl: 'https://masan.mof.go.kr',
      pa: '관할청 직접 운영',
      paUrl: null,
      pilotage: '마산항도선사회',
      vts: 'CH 14',
      facilities: '일반부두, 컨테이너, 잡화',
      note: '창원·진해 산업 단지 연결',
      faircall: 'https://faircall.kr/regions/yeongnam/masan',
      guideUrl: null,
    },
    {
      name: '울산항',
      nameEn: 'Port of Ulsan',
      locode: 'KRUSN',
      coords: [129.42, 35.50],
      region: '영남',
      color: REGION_COLORS.영남,
      authority: '울산지방해양수산청',
      authorityUrl: 'https://ulsan.mof.go.kr',
      pa: '울산항만공사 (UPA)',
      paUrl: 'https://www.upa.or.kr',
      pilotage: '울산항도선사회',
      vts: 'CH 14',
      facilities: '본항, 미포항, 온산항, 신항, SBM (SK에너지/S-Oil)',
      note: '한국 최대 액체화물 항만, VLCC 접안',
      faircall: 'https://faircall.kr/regions/yeongnam/ulsan',
      guideUrl: null,
    },
    {
      name: '포항항',
      nameEn: 'Port of Pohang',
      locode: 'KRKPO',
      coords: [129.39, 36.04],
      region: '영남',
      color: REGION_COLORS.영남,
      authority: '포항지방해양수산청',
      authorityUrl: 'https://pohang.mof.go.kr',
      pa: '관할청 직접 운영',
      paUrl: null,
      pilotage: '포항항도선사회',
      vts: 'CH 12',
      facilities: '신항(POSCO 원료부두), 구항, 영일만항',
      note: 'POSCO 포항제철소 연결, 원료(철광석/석탄) 중심',
      faircall: 'https://faircall.kr/regions/yeongnam/pohang',
      guideUrl: null,
    },
    {
      name: '동해·묵호항',
      nameEn: 'Port of Donghae-Mukho',
      locode: 'KRDHE',
      coords: [129.13, 37.50],
      region: '동해안',
      color: REGION_COLORS.동해안,
      authority: '동해지방해양수산청',
      authorityUrl: 'https://donghae.mof.go.kr',
      pa: '관할청 직접 운영',
      paUrl: null,
      pilotage: '동해항도선사회',
      vts: 'CH 14',
      facilities: '일반부두, 시멘트, 잡화 (옥계/묵호 포함)',
      note: '동해안 산업 항만, 시멘트/석탄 중심',
      faircall: 'https://faircall.kr/regions/east-coast/donghae',
      guideUrl: null,
    },
    {
      name: '제주항',
      nameEn: 'Port of Jeju',
      locode: 'KRCJU',
      coords: [126.54, 33.52],
      region: '제주',
      color: REGION_COLORS.제주,
      authority: '제주지방해양수산청',
      authorityUrl: 'https://jeju.mof.go.kr',
      pa: '관할청 직접 운영',
      paUrl: null,
      pilotage: '제주항도선사회',
      vts: 'CH 12',
      facilities: '외항, 내항, 서귀포항, 한림항',
      note: '카페리 + 크루즈 + 연안 여객',
      faircall: 'https://faircall.kr/regions/jeju/jeju',
      guideUrl: null,
    },
  ];

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
        maxWidth: '320px',
        closeButton: true,
        className: 'korea-port-popup',
      }).setHTML(buildPopupHtml(port));

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(port.coords)
        .setPopup(popup)
        .addTo(map);

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

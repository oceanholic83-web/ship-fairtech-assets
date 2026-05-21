 * ship.fairtech.kr - ?쒓뎅 臾댁뿭???덈궡???ㅻ뜑 + 湲곌? ?붾젆?좊━ (v3)
 * MOF 移대뱶 + 3?④퀎 以묒꺽 ??(遺泥?/ 移댄뀒怨좊━ / 沅뚯뿭)
 *
 * ?ъ슜泥? ship.fairtech.kr/category/port-guide/
 */

(function () {
  'use strict';

  // ============================================================
  // 1. ?댁뼇?섏궛遺 (珥앷큵 移대뱶)
  // ============================================================
  const MOF = {
    name: '?댁뼇?섏궛遺',
    nameEn: 'Ministry of Oceans and Fisheries',
    abbr: 'MOF',
    headquarters: '遺?곌킅??떆 ?숆뎄 以묒븰?濡?361踰덇만 14 (?꾩씠?좊퉴??',
    note: '2025???몄쥌 ??遺???댁쟾. ?뺣??몄쥌泥?궗???쇰? 遺???붿〈.',
    url: 'https://www.mof.go.kr',
    callCenter: '110 (?뺣?誘쇱썝?덈궡肄쒖꽱??',
  };

  // ============================================================
  // 2. 吏諛⑺빐?묒닔?곗껌 (12) ??沅뚯뿭蹂?  // ============================================================
  const OFFICES = {
    ?섎룄沅뚯땐泥? {
      color: '#14b8a6',
      label: '?섎룄沅뙿룹땐泥?,
      items: [
        { name: '?몄쿇吏諛⑺빐?묒닔?곗껌', port: '?몄쿇??, url: 'https://incheon.mof.go.kr', portKey: '?몄쿇?? },
        { name: '?됲깮吏諛⑺빐?묒닔?곗껌', port: '?됲깮쨌?뱀쭊??, url: 'https://pyeongtaek.mof.go.kr', portKey: '?됲깮쨌?뱀쭊?? },
        { name: '??곗?諛⑺빐?묒닔?곗껌', port: '??고빆', url: 'https://daesan.mof.go.kr', portKey: '??고빆' },
      ],
    },
    ?몃궓: {
      color: '#fbbf24',
      label: '?몃궓',
      items: [
        { name: '援곗궛吏諛⑺빐?묒닔?곗껌', port: '援곗궛??, url: 'https://gunsan.mof.go.kr', portKey: '援곗궛?? },
        { name: '紐⑺룷吏諛⑺빐?묒닔?곗껌', port: '紐⑺룷??, url: 'https://mokpo.mof.go.kr', portKey: '紐⑺룷?? },
        { name: '?ъ닔吏諛⑺빐?묒닔?곗껌', port: '愿묒뼇쨌?ъ닔??, url: 'https://yeosu.mof.go.kr', portKey: '愿묒뼇?? },
      ],
    },
    ?곷궓: {
      color: '#f97316',
      label: '?곷궓',
      items: [
        { name: '遺?곗?諛⑺빐?묒닔?곗껌', port: '遺?고빆', url: 'https://busan.mof.go.kr', portKey: '遺?고빆' },
        { name: '留덉궛吏諛⑺빐?묒닔?곗껌', port: '留덉궛??, url: 'https://masan.mof.go.kr', portKey: '留덉궛?? },
        { name: '?몄궛吏諛⑺빐?묒닔?곗껌', port: '?몄궛??, url: 'https://ulsan.mof.go.kr', portKey: '?몄궛?? },
        { name: '?ы빆吏諛⑺빐?묒닔?곗껌', port: '?ы빆??, url: 'https://pohang.mof.go.kr', portKey: '?ы빆?? },
      ],
    },
    ?숉빐?? {
      color: '#ef4444',
      label: '?숉빐??,
      items: [
        { name: '?숉빐吏諛⑺빐?묒닔?곗껌', port: '?숉빐쨌臾듯샇??, url: 'https://donghae.mof.go.kr', portKey: '?숉빐쨌臾듯샇?? },
      ],
    },
    ?쒖＜: {
      color: '#a78bfa',
      label: '?쒖＜',
      items: [
        { name: '?쒖＜?댁뼇?섏궛愿由щ떒', port: '?쒖＜??, url: 'https://yeosu.mof.go.kr', portKey: '?쒖＜??, sub: '?ъ닔泥??고븯' },
      ],
    },
  };

  // ============================================================
  // 3. ??쭔怨듭궗 (5)
  // ============================================================
  const PORT_AUTHORITIES = [
    { name: '遺?고빆留뚭났??, abbr: 'BPA', port: '遺?고빆', url: 'https://www.busanpa.com', portKey: '遺?고빆' },
    { name: '?몄쿇??쭔怨듭궗', abbr: 'IPA', port: '?몄쿇??, url: 'https://www.icpa.or.kr', portKey: '?몄쿇?? },
    { name: '?ъ닔愿묒뼇??쭔怨듭궗', abbr: 'YGPA', port: '愿묒뼇쨌?ъ닔??, url: 'https://www.ygpa.or.kr', portKey: '愿묒뼇?? },
    { name: '?몄궛??쭔怨듭궗', abbr: 'UPA', port: '?몄궛??, url: 'https://www.upa.or.kr', portKey: '?몄궛?? },
    { name: '寃쎄린?됲깮??쭔怨듭궗', abbr: 'GPPC', port: '?됲깮쨌?뱀쭊??, url: 'https://www.gppc.or.kr', portKey: '?됲깮쨌?뱀쭊??, sub: '吏諛⑷났湲곗뾽' },
  ];

  // ============================================================
  // 4. ?꾩꽑?ы쉶 (13)
  // ============================================================
  const PILOTS = [
    { name: '?쒓뎅?꾩꽑?ы삊??, abbr: 'KMPA', url: 'https://www.kmpilot.or.kr', sub: '珥앷큵 ?묓쉶' },
    { name: '遺?고빆?꾩꽑?ы쉶', port: '遺?고빆', url: 'http://www.busanpilot.co.kr', portKey: '遺?고빆' },
    { name: '?몄쿇??룄?좎궗??, port: '?몄쿇??, url: 'http://www.incheonpilot.com', portKey: '?몄쿇?? },
    { name: '?ъ닔??룄?좎궗??, port: '愿묒뼇쨌?ъ닔??, url: 'http://www.yspilot.co.kr', portKey: '愿묒뼇?? },
    { name: '?몄궛??룄?좎궗??, port: '?몄궛??, portKey: '?몄궛?? },
    { name: '?됲깮?뱀쭊??룄?좎궗??, port: '?됲깮쨌?뱀쭊??, portKey: '?됲깮쨌?뱀쭊?? },
    { name: '??고빆?꾩꽑?ы쉶', port: '??고빆', portKey: '??고빆' },
    { name: '留덉궛??룄?좎궗??, port: '留덉궛??, portKey: '留덉궛?? },
    { name: '?ы빆??룄?좎궗??, port: '?ы빆??, portKey: '?ы빆?? },
    { name: '援곗궛??룄?좎궗??, port: '援곗궛??, portKey: '援곗궛?? },
    { name: '紐⑺룷??룄?좎궗??, port: '紐⑺룷??, url: 'http://www.mppilot.co.kr', portKey: '紐⑺룷?? },
    { name: '?숉빐??룄?좎궗??, port: '?숉빐쨌臾듯샇??, portKey: '?숉빐쨌臾듯샇?? },
    { name: '?쒖＜??룄?좎궗??, port: '?쒖＜??, portKey: '?쒖＜?? },
  ];

  // ============================================================
  // 5. ?댁닔遺 ?고븯湲곌? (?댁뼇 吏곸냽留?
  // ============================================================
  const MOF_AGENCIES = [
    { name: '?쒓뎅?댁뼇援먰넻?덉쟾怨듬떒', abbr: 'KOMSA', url: 'https://www.komsa.or.kr', role: '?좊컯寃??룻빐?곴탳?듭븞?? },
    { name: '?쒓뎅?댁뼇?섏궛媛쒕컻??, abbr: 'KMI', url: 'https://www.kmi.re.kr', role: '?댁뼇?섏궛 ?뺤콉 ?곌뎄' },
    { name: '?쒓뎅?댁뼇怨쇳븰湲곗닠??, abbr: 'KIOST', url: 'https://www.kiost.ac.kr', role: '?댁뼇怨쇳븰湲곗닠 ?곌뎄' },
    { name: '援?┰?댁뼇議곗궗??, abbr: 'KHOA', url: 'https://www.khoa.go.kr', role: '?섎줈쨌?댁뼇議곗궗' },
    { name: '援?┰?섏궛怨쇳븰??, abbr: 'NIFS', url: 'https://www.nifs.go.kr', role: '?섏궛 ?곌뎄' },
    { name: '?댁뼇?섍꼍怨듬떒', abbr: 'KOEM', url: 'https://www.koem.or.kr', role: '?댁뼇?섍꼍 蹂댁쟾쨌諛⑹젣' },
    { name: '?쒓뎅?댁뼇?섏궛?곗닔??, abbr: 'KIMFT', url: 'https://www.seaman.or.kr', role: '?좎썝 援먯쑁쨌?덈젴' },
    { name: '援?┰?댁뼇諛뺣Ъ愿', abbr: 'NMM', url: 'https://www.nmm.go.kr', role: '?댁뼇臾명솕 ?좎궛 (遺??' },
    { name: '援?┰?댁뼇?앸Ъ?먯썝愿', abbr: 'MABIK', role: '?댁뼇?앸Ъ?먯썝 (?쒖쿇)' },
    { name: '?쒓뎅?섏궛?먯썝怨듬떒', abbr: 'FIRA', role: '?멸났?댁큹쨌諛붾떎?꼲룹쥌臾섎갑瑜? },
  ];

  // ============================================================
  // 6. 愿?몄껌 (蹂몄껌 + 臾댁뿭??퀎 ?멸?)
  // ============================================================
  const CUSTOMS_HQ = [
    { name: '愿?몄껌', abbr: 'KCS', url: 'https://www.customs.go.kr', role: '蹂몄껌 (???' },
  ];

  const CUSTOMS_PORTS = {
    ?섎룄沅뚯땐泥? {
      color: '#14b8a6',
      label: '?섎룄沅뙿룹땐泥?,
      items: [
        { name: '?몄쿇?멸?', role: '?몄쿇蹂몃?', url: 'https://www.customs.go.kr/incheon/main.do', portKey: '?몄쿇?? },
        { name: '?됲깮?멸?', role: '吏곹븷', url: 'https://www.customs.go.kr/pyeongtaek/main.do', portKey: '?됲깮쨌?뱀쭊?? },
        { name: '??꾩꽭愿 ??곗???, role: '?쒖슱蹂몃? ?고븯', portKey: '??고빆' },
      ],
    },
    ?몃궓: {
      color: '#fbbf24',
      label: '?몃궓',
      items: [
        { name: '援곗궛?멸?', role: '愿묒＜蹂몃? ?고븯', portKey: '援곗궛?? },
        { name: '紐⑺룷?멸?', role: '愿묒＜蹂몃? ?고븯', portKey: '紐⑺룷?? },
        { name: '愿묒뼇?멸?', role: '愿묒＜蹂몃? ?고븯', portKey: '愿묒뼇?? },
        { name: '?ъ닔?멸?', role: '愿묒＜蹂몃? ?고븯', portKey: '愿묒뼇?? },
      ],
    },
    ?곷궓: {
      color: '#f97316',
      label: '?곷궓',
      items: [
        { name: '遺?곗꽭愿', role: '遺?곕낯遺', url: 'https://www.customs.go.kr/busan/main.do', portKey: '遺?고빆' },
        { name: '留덉궛?멸?', role: '遺?곕낯遺 ?고븯', portKey: '留덉궛?? },
        { name: '?몄궛?멸?', role: '遺?곕낯遺 ?고븯', portKey: '?몄궛?? },
        { name: '?ы빆?멸?', role: '遺?곕낯遺 ?고븯', portKey: '?ы빆?? },
      ],
    },
    ?숉빐?? {
      color: '#ef4444',
      label: '?숉빐??,
      items: [
        { name: '?숉빐?멸?', role: '?쒖슱蹂몃? ?고븯', portKey: '?숉빐쨌臾듯샇?? },
      ],
    },
    ?쒖＜: {
      color: '#a78bfa',
      label: '?쒖＜',
      items: [
        { name: '?쒖＜?멸?', role: '遺?곕낯遺 ?고븯', portKey: '?쒖＜?? },
      ],
    },
  };

  // ============================================================
  // 7. ?댁긽移섏븞
  // ============================================================
  const KCG_AGENCIES = [
    { name: '?댁뼇寃쎌같泥?, abbr: 'KCG', url: 'https://www.kcg.go.kr', role: '?댁긽寃쎈퉬쨌援ъ“쨌諛⑹젣 (?됱븞遺 ?고븯)' },
  ];

  // ============================================================
  // 8. 寃??룰???  // ============================================================
  const QUARANTINE_AGENCIES = [
    { name: '?띾┝異뺤궛寃??낯遺', abbr: 'QIA', url: 'https://www.qia.go.kr', role: '?숈떇臾?寃??(?띾┝遺 ?고븯)' },
    { name: '援?┰?섏궛臾쇳뭹吏덇?由ъ썝', abbr: 'NFQS', url: 'https://www.nfqs.go.kr', role: '?섏궛臾?寃??룻뭹吏덇?由? },
    { name: '?쒓뎅?좉툒', abbr: 'KR', url: 'https://www.krs.co.kr', role: '?좉툒 寃??룹씤利?(誘쇨컙)' },
  ];

  // ============================================================
  // MOF 移대뱶 (?곷떒 怨좎젙)
  // ============================================================
  function buildMofHtml() {
    return `
      <div style="margin-bottom:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#0f172a;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;flex-wrap:wrap;">
          <div>
            <div style="font-size:10px;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;font-weight:500;">珥앷큵 遺泥?/div>
            <div style="font-size:18px;color:#0f172a;font-weight:700;">${MOF.name}</div>
            <div style="font-size:11px;color:#64748b;margin-top:2px;">${MOF.nameEn} 쨌 ${MOF.abbr}</div>
          </div>
          <a href="${MOF.url}" target="_blank" rel="noopener" style="display:inline-block;padding:8px 14px;background:#14b8a6;color:#ffffff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap;">怨듭떇 ?덊럹?댁? ??/a>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;">
          <div>
            <div style="font-size:10px;color:#94a3b8;letter-spacing:0.8px;margin-bottom:4px;">蹂몃? (2025??遺???댁쟾)</div>
            <div style="font-size:12px;color:#475569;line-height:1.5;">${MOF.headquarters}</div>
          </div>
          <div>
            <div style="font-size:10px;color:#94a3b8;letter-spacing:0.8px;margin-bottom:4px;">誘쇱썝 ?곕씫泥?/div>
            <div style="font-size:12px;color:#475569;line-height:1.5;">${MOF.callCenter}</div>
          </div>
        </div>
        <div style="margin-top:10px;padding-top:10px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;font-style:italic;line-height:1.5;">${MOF.note}</div>
      </div>
    `;
  }

  // ============================================================
  // ?몃━嫄?踰꾪듉
  // ============================================================
  function buildTriggerHtml() {
    const officeCount = Object.values(OFFICES).reduce((s, g) => s + g.items.length, 0);
    const customsCount = CUSTOMS_HQ.length + Object.values(CUSTOMS_PORTS).reduce((s, g) => s + g.items.length, 0);
    const total = 1 + officeCount + PORT_AUTHORITIES.length + PILOTS.length + MOF_AGENCIES.length + customsCount + KCG_AGENCIES.length + QUARANTINE_AGENCIES.length;
    return `
      <button id="port-directory-trigger" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;font-size:13px;color:#0f172a;font-weight:600;transition:all 0.15s ease;">
        <span style="display:flex;align-items:center;gap:10px;">
          <span style="display:inline-block;width:6px;height:24px;background:#14b8a6;border-radius:3px;"></span>
          <span>?쒓뎅 ?댁뼇 ?됱젙 ?붾젆?좊━</span>
          <span style="font-size:11px;color:#94a3b8;font-weight:400;">珥?${total}媛?湲곌?</span>
        </span>
        <span id="port-directory-arrow" style="font-size:14px;color:#64748b;transition:transform 0.2s ease;">??/span>
      </button>
    `;
  }

  // ============================================================
  // 硫붽? ?⑤꼸 (3?④퀎 ??
  // ============================================================
  function buildPanelHtml() {
    return `
      <div id="port-directory-panel" style="display:none;margin-top:8px;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
        <div id="dir-l1-tabs" style="display:flex;border-bottom:1px solid #e2e8f0;background:#f8fafc;flex-wrap:wrap;">
          <button class="dir-l1-tab" data-l1="mof" style="flex:1;min-width:120px;padding:12px 14px;background:#ffffff;border:none;border-bottom:2px solid #14b8a6;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;color:#0f172a;">?댁뼇?섏궛遺</button>
          <button class="dir-l1-tab" data-l1="customs" style="flex:1;min-width:120px;padding:12px 14px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;color:#64748b;">愿?몄껌</button>
          <button class="dir-l1-tab" data-l1="kcg" style="flex:1;min-width:120px;padding:12px 14px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;color:#64748b;">?댁긽移섏븞</button>
          <button class="dir-l1-tab" data-l1="quarantine" style="flex:1;min-width:120px;padding:12px 14px;background:transparent;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;color:#64748b;">寃??룰???/button>
        </div>
        <div id="dir-l2-area"></div>
        <div id="dir-content-area" style="padding:16px 18px;"></div>
      </div>
    `;
  }

  // ============================================================
  // L2 ??HTML ?앹꽦
  // ============================================================
  function buildL2Tabs(l1) {
    const map = {
      mof: [
        { id: 'offices', label: '吏諛⑹껌 (12)' },
        { id: 'pa', label: `??쭔怨듭궗 (${PORT_AUTHORITIES.length})` },
        { id: 'pilots', label: `?꾩꽑?ы쉶 (${PILOTS.length})` },
        { id: 'agencies', label: `?고븯湲곌? (${MOF_AGENCIES.length})` },
      ],
      customs: [
        { id: 'cs-hq', label: '蹂몄껌 (1)' },
        { id: 'cs-ports', label: `臾댁뿭??퀎 ?멸? (${Object.values(CUSTOMS_PORTS).reduce((s,g)=>s+g.items.length,0)})` },
      ],
      kcg: [
        { id: 'kcg-main', label: `?댁뼇寃쎌같泥?(${KCG_AGENCIES.length})` },
      ],
      quarantine: [
        { id: 'q-all', label: `寃??룰???(${QUARANTINE_AGENCIES.length})` },
      ],
    };
    const tabs = map[l1] || [];
    const buttons = tabs.map((t, i) => `
      <button class="dir-l2-tab" data-l2="${t.id}" style="padding:10px 14px;background:${i===0?'#ffffff':'transparent'};border:none;border-bottom:2px solid ${i===0?'#0ea5e9':'transparent'};cursor:pointer;font-family:inherit;font-size:11px;font-weight:${i===0?'600':'500'};color:${i===0?'#0f172a':'#64748b'};">${t.label}</button>
    `).join('');
    return `<div id="dir-l2-tabs" style="display:flex;background:#fafbfc;border-bottom:1px solid #e2e8f0;flex-wrap:wrap;">${buttons}</div>`;
  }

  // ============================================================
  // L3 沅뚯뿭 ?꾪꽣 HTML (吏諛⑹껌, 臾댁뿭??퀎 ?멸??먮쭔 ?ъ슜)
  // ============================================================
  function buildRegionFilter(activeRegion) {
    const regions = ['?꾩껜', '?섎룄沅뚯땐泥?, '?몃궓', '?곷궓', '?숉빐??, '?쒖＜'];
    const labels = { ?꾩껜: '?꾩껜', ?섎룄沅뚯땐泥? '?섎룄沅뙿룹땐泥?, ?몃궓: '?몃궓', ?곷궓: '?곷궓', ?숉빐?? '?숉빐??, ?쒖＜: '?쒖＜' };
    const buttons = regions.map(r => {
      const isActive = r === activeRegion;
      return `
        <button class="dir-region-btn" data-region="${r}" style="padding:6px 12px;background:${isActive?'#0f172a':'#ffffff'};border:1px solid ${isActive?'#0f172a':'#e2e8f0'};border-radius:6px;cursor:pointer;font-family:inherit;font-size:11px;font-weight:${isActive?'600':'500'};color:${isActive?'#ffffff':'#475569'};">${labels[r]}</button>
      `;
    }).join('');
    return `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">${buttons}</div>`;
  }

  // ============================================================
  // 移대뱶 HTML
  // ============================================================
  function cardHtml(item, color, extraStyle = '') {
    const sub = item.sub ? `<div style="font-size:9px;color:#94a3b8;margin-top:2px;">${item.sub}</div>` : '';
    const abbr = item.abbr ? `<div style="font-size:10px;color:#94a3b8;background:#f1f5f9;padding:2px 6px;border-radius:3px;font-weight:600;">${item.abbr}</div>` : '';
    const role = item.role ? `<div style="font-size:10px;color:#64748b;line-height:1.4;margin-top:2px;">${item.role}</div>` : '';
    const port = item.port ? `<div style="font-size:10px;color:#64748b;">${item.port}</div>` : '';
    const url = item.url || '';
    const portKey = item.portKey || '';
    return `
      <button data-port-key="${portKey}" data-url="${url}" class="dir-card" style="display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:10px 12px;background:#ffffff;border:1px solid #e2e8f0;border-left:3px solid ${color};border-radius:6px;cursor:pointer;font-family:inherit;text-align:left;transition:all 0.15s ease;${extraStyle}">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <div style="font-size:12px;color:#0f172a;font-weight:600;line-height:1.3;">${item.name}</div>
          ${abbr}
        </div>
        ${port}
        ${role}
        ${sub}
      </button>
    `;
  }

  // ============================================================
  // 肄섑뀗痢?鍮뚮뜑 ??移댄뀒怨좊━蹂?  // ============================================================
  function buildOfficesContent(activeRegion) {
    const regionFilter = buildRegionFilter(activeRegion);
    let groups;
    if (activeRegion === '?꾩껜') {
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
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px;">${cards}</div>
        </div>
      `;
    }).join('');
    return regionFilter + groupsHtml;
  }

  function buildPaContent() {
    const cards = PORT_AUTHORITIES.map(pa => cardHtml(pa, '#14b8a6')).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;">${cards}</div>`;
  }

  function buildPilotsContent() {
    const cards = PILOTS.map(p => cardHtml(p, p.port ? '#f97316' : '#a78bfa')).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px;">${cards}</div>`;
  }

  function buildAgenciesContent() {
    const cards = MOF_AGENCIES.map(a => cardHtml(a, '#8b5cf6')).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;">${cards}</div>`;
  }

  function buildCustomsHqContent() {
    const cards = CUSTOMS_HQ.map(c => cardHtml(c, '#0ea5e9')).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;">${cards}</div>`;
  }

  function buildCustomsPortsContent(activeRegion) {
    const regionFilter = buildRegionFilter(activeRegion);
    let groups;
    if (activeRegion === '?꾩껜') {
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
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:6px;">${cards}</div>
        </div>
      `;
    }).join('');
    return regionFilter + groupsHtml;
  }

  function buildKcgContent() {
    const cards = KCG_AGENCIES.map(a => cardHtml(a, '#ef4444')).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;">${cards}</div>`;
  }

  function buildQuarantineContent() {
    const cards = QUARANTINE_AGENCIES.map(a => cardHtml(a, '#84cc16')).join('');
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;">${cards}</div>`;
  }

  // ============================================================
  // ?곹깭 愿由?+ ?뚮뜑留?  // ============================================================
  let state = {
    l1: 'mof',
    l2: 'offices',
    region: '?꾩껜',
  };

  function renderContent() {
    const area = document.getElementById('dir-content-area');
    if (!area) return;
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
    state.region = '?꾩껜';
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
    state.region = '?꾩껜';
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
  // ?대깽???몃뱾??  // ============================================================
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

  // ============================================================
  // 吏꾩엯??  // ============================================================
  function renderHeader() {
    const container = document.getElementById('korea-port-header');
    if (!container) {
      console.error('[port-atlas-header] Container #korea-port-header not found');
      return;
    }
    container.innerHTML = buildMofHtml() + buildTriggerHtml() + buildPanelHtml();
    attachTriggerHandler();
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

Then commit and push to main with the message:
    refactor: 3-tier nested tabs for directory (ministry > category > region)

Verify with:
    grep -n "dir-l1-tab\|dir-l2-tab\|dir-region-btn\|setL1\|setL2\|setRegion" port-atlas-header.js | head -20

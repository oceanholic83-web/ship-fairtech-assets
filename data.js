/**
 * ship.fairtech.kr - 항만 가이드 데이터
 * 모든 기관 데이터 (지방청, 항만공사, 도선사회, 산하기관, 세관, 해경, 검역)
 *
 * 이 파일은 port-atlas-header.js보다 먼저 로드되어야 함 (loader.js에서 보장)
 *
 * window.PORT_ATLAS_DATA를 통해 전역 접근.
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
  // 2. 지방해양수산청 (12) — 권역별
  // ============================================================
  const OFFICES = {
    수도권충청: {
      color: '#14b8a6',
      label: '수도권·충청',
      items: [
        { name: '인천지방해양수산청', port: '인천항', url: 'https://incheon.mof.go.kr', portKey: '인천항', address: '인천광역시 중구 서해대로 365-1', postcode: '22346', tel: '032-880-6114', fax: '032-882-4642' },
        { name: '평택지방해양수산청', port: '평택·당진항', url: 'https://pyeongtaek.mof.go.kr', portKey: '평택·당진항', address: '경기도 평택시 포승읍 평택항만길 116 (만호리 566)', postcode: '17962', tel: '031-683-0313', fax: '031-680-7219' },
        { name: '대산지방해양수산청', port: '대산항', url: 'https://daesan.mof.go.kr', portKey: '대산항', address: '충청남도 서산시 홍천로 42 (잠홍동)', postcode: '32002', tel: '041-660-7700', fax: '041-663-0356' },
      ],
    },
    호남: {
      color: '#fbbf24',
      label: '호남',
      items: [
        { name: '군산지방해양수산청', port: '군산항', url: 'https://gunsan.mof.go.kr', portKey: '군산항', address: '전북 군산시 설림길 11 (소룡동)', postcode: '54014', tel: '063-441-2223', telNight: '063-441-2208', telCivil: '063-441-2204', fax: '063-441-2352' },
        { name: '목포지방해양수산청', port: '목포항', url: 'https://mokpo.mof.go.kr', portKey: '목포항', address: '전라남도 목포시 통일대로 130 (옥암동)', postcode: '58746', tel: '061-280-1700', fax: '061-280-1703' },
        { name: '여수지방해양수산청', port: '광양·여수항', url: 'https://yeosu.mof.go.kr', portKey: '광양항', address: '전라남도 여수시 여서1로 107', postcode: '59713', tel: '061-650-6000', fax: '061-654-2353' },
      ],
    },
    영남: {
      color: '#f97316',
      label: '영남',
      items: [
        { name: '부산지방해양수산청', port: '부산항', url: 'https://busan.mof.go.kr', portKey: '부산항', address: '부산광역시 동구 충장대로 351 (좌천동)', postcode: '48755', tel: '051-609-6114', fax: '051-609-6219' },
        { name: '마산지방해양수산청', port: '마산항', url: 'https://masan.mof.go.kr', portKey: '마산항', address: '경상남도 창원시 마산합포구 제2부두로 10 (정부경남지방합동청사)', postcode: '51716', tel: '055-981-5000', fax: '055-245-0885' },
        { name: '울산지방해양수산청', port: '울산항', url: 'https://ulsan.mof.go.kr', portKey: '울산항', address: '울산광역시 남구 장생포고래로 288번길 6', postcode: '44780', tel: '052-228-5500', fax: '052-228-5549' },
        { name: '포항지방해양수산청', port: '포항항', url: 'https://pohang.mof.go.kr', portKey: '포항항', address: '경상북도 포항시 북구 해동로 376', postcode: '37716', tel: '054-242-1812', fax: '054-245-1649' },
      ],
    },
    동해안: {
      color: '#ef4444',
      label: '동해안',
      items: [
        { name: '동해지방해양수산청', port: '동해·묵호항', url: 'https://donghae.mof.go.kr', portKey: '동해·묵호항', address: '강원도 동해시 평원로 46', postcode: '25752', tel: '033-520-6000', telNight: '033-520-6200' },
      ],
    },
    제주: {
      color: '#a78bfa',
      label: '제주',
      items: [
        { name: '제주해양수산관리단', port: '제주항', url: 'https://busan.mof.go.kr', portKey: '제주항', sub: '부산청 산하' },
      ],
    },
  };

  // ============================================================
  // 3. 항만공사 (5)
  // ============================================================
  const PORT_AUTHORITIES = [
    { name: '부산항만공사', abbr: 'BPA', port: '부산항', url: 'https://www.busanpa.com', portKey: '부산항' },
    { name: '인천항만공사', abbr: 'IPA', port: '인천항', url: 'https://www.icpa.or.kr', portKey: '인천항' },
    { name: '여수광양항만공사', abbr: 'YGPA', port: '광양·여수항', url: 'https://www.ygpa.or.kr', portKey: '광양항' },
    { name: '울산항만공사', abbr: 'UPA', port: '울산항', url: 'https://www.upa.or.kr', portKey: '울산항' },
    { name: '경기평택항만공사', abbr: 'GPPC', port: '평택·당진항', url: 'https://www.gppc.or.kr', portKey: '평택·당진항', sub: '지방공기업' },
  ];

  // ============================================================
  // 4. 도선사회 (13)
  // ============================================================
  const PILOTS = [
    { name: '한국도선사협회', abbr: 'KMPA', url: 'https://www.kmpilot.or.kr', sub: '총괄 협회' },
    { name: '부산항도선사회', port: '부산항', url: 'http://www.busanpilot.co.kr', portKey: '부산항' },
    { name: '인천항도선사회', port: '인천항', url: 'http://www.incheonpilot.com', portKey: '인천항' },
    { name: '여수항도선사회', port: '광양·여수항', url: 'http://www.yspilot.co.kr', portKey: '광양항' },
    { name: '울산항도선사회', port: '울산항', portKey: '울산항' },
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
  // 5. 해수부 산하기관
  // ============================================================
  const MOF_AGENCIES = [
    { name: '한국해양교통안전공단', abbr: 'KOMSA', url: 'https://www.komsa.or.kr', role: '선박검사·해상교통안전' },
    { name: '한국해양수산개발원', abbr: 'KMI', url: 'https://www.kmi.re.kr', role: '해양수산 정책 연구' },
    { name: '한국해양과학기술원', abbr: 'KIOST', url: 'https://www.kiost.ac.kr', role: '해양과학기술 연구' },
    { name: '국립해양조사원', abbr: 'KHOA', url: 'https://www.khoa.go.kr', role: '수로·해양조사' },
    { name: '국립수산과학원', abbr: 'NIFS', url: 'https://www.nifs.go.kr', role: '수산 연구' },
    { name: '해양환경공단', abbr: 'KOEM', url: 'https://www.koem.or.kr', role: '해양환경 보전·방제' },
    { name: '한국해양수산연수원', abbr: 'KIMFT', url: 'https://www.seaman.or.kr', role: '선원 교육·훈련' },
    { name: '국립해양박물관', abbr: 'NMM', url: 'https://www.nmm.go.kr', role: '해양문화 유산 (부산)' },
    { name: '국립해양생물자원관', abbr: 'MABIK', role: '해양생물자원 (서천)' },
    { name: '한국수산자원공단', abbr: 'FIRA', role: '인공어초·바다숲·종묘방류' },
  ];

  // ============================================================
  // 6. 관세청
  // ============================================================
  const CUSTOMS_HQ = [];

  const CUSTOMS_PORTS = {
    수도권충청: {
      color: '#14b8a6',
      label: '수도권·충청',
      items: [
        {
          name: '인천세관',
          fullName: '인천본부세관',
          role: '인천본부',
          url: 'https://www.customs.go.kr/incheon/main.do',
          portKey: '인천항',
          address: '인천광역시 중구 서해대로 339',
          postcode: '22346',
          tel: '032-452-3114',
          note: '2023.4.18 인천공항세관 분리 (TEL 032-722-4114)',
          children: [
            { name: '김포공항세관' },
            { name: '인천공항국제우편세관' },
            { name: '수원세관' },
            { name: '안산세관 (부평지원센터)' },
          ],
        },
        {
          name: '평택세관',
          role: '직할',
          url: 'https://www.customs.go.kr/pyeongtaek/main.do',
          portKey: '평택·당진항',
          address: '경기도 평택시 포승읍 평택항만길 45',
          postcode: '17962',
          tel: '031-8054-7000',
          children: [
            { name: '대산지원센터', tel: '041-419-2714' },
          ],
        },
      ],
    },
    호남: {
      color: '#fbbf24',
      label: '호남',
      items: [
        { name: '군산세관', role: '광주본부 산하', portKey: '군산항' },
        { name: '목포세관', role: '광주본부 산하', portKey: '목포항' },
        { name: '광양세관', role: '광주본부 산하', portKey: '광양항' },
        { name: '여수세관', role: '광주본부 산하', portKey: '광양항' },
      ],
    },
    영남: {
      color: '#f97316',
      label: '영남',
      items: [
        {
          name: '부산세관',
          fullName: '부산·경남본부세관',
          role: '부산본부',
          url: 'https://www.customs.go.kr/busan/main.do',
          portKey: '부산항',
          address: '부산광역시 중구 충장대로 20 (중앙동 4가 17-26)',
          postcode: '48940',
          tel: '051-620-6114',
          fax: '051-620-1115',
          children: [
            { name: '김해공항세관' },
            { name: '북부산세관' },
            { name: '양산세관' },
            { name: '창원세관' },
            { name: '마산세관' },
            { name: '경남남부세관' },
            { name: '경남서부세관' },
          ],
        },
        { name: '마산세관', role: '부산본부 산하', portKey: '마산항' },
        { name: '울산세관', role: '부산본부 산하', portKey: '울산항' },
        { name: '포항세관', role: '부산본부 산하', portKey: '포항항' },
      ],
    },
    동해안: {
      color: '#ef4444',
      label: '동해안',
      items: [
        { name: '동해세관', role: '서울본부 산하', portKey: '동해·묵호항' },
      ],
    },
    제주: {
      color: '#a78bfa',
      label: '제주',
      items: [
        { name: '제주세관', role: '부산본부 산하', portKey: '제주항' },
      ],
    },
  };

  // ============================================================
  // 7. 해상치안
  // ============================================================
  const KCG_AGENCIES = [
    { name: '해양경찰청', abbr: 'KCG', url: 'https://www.kcg.go.kr', role: '해상경비·구조·방제 (행안부 산하)' },
  ];

  // ============================================================
  // 8. 검역·검사
  // ============================================================
  const QUARANTINE_AGENCIES = [
    { name: '국립수산물품질관리원', abbr: 'NFQS', url: 'https://www.nfqs.go.kr', role: '수산물 검역·품질관리 (해수부)' },
    { name: '한국선급', abbr: 'KR', url: 'https://www.krs.co.kr', role: '선급 검사·인증 (민간)' },
  ];

  // ============================================================
  // 전역 노출
  // ============================================================
  window.PORT_ATLAS_DATA = {
    MOF,
    OFFICES,
    PORT_AUTHORITIES,
    PILOTS,
    MOF_AGENCIES,
    CUSTOMS_HQ,
    CUSTOMS_PORTS,
    KCG_AGENCIES,
    QUARANTINE_AGENCIES,
  };
})();

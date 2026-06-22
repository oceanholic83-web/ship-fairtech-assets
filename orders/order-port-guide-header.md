# 오더: 항만 가이드 페이지 — 상단 패널 내용 교체

파일: `loader.js` (repo root)

---

## 수정 내용

상단 안내 패널의 MOF 중심 내용을 Faircast 매체 소개 + 실용 안내로 교체.

Find this exact block (loader.js 약 32~39번 줄):

```javascript
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;">
            <div style="flex:1;min-width:240px;">
              <div style="font-size:10px;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;font-weight:500;">한국 무역항 종합 안내도 · 총괄 해양수산부 (MOF)</div>
              <div style="font-size:13px;color:#475569;line-height:1.5;">전국 12개 무역항의 위치, 관할 청, 항만공사, VTS 채널, 시설을 한눈에. 마커 또는 카드를 클릭해 각 항만 정보를 확인하세요.</div>
              <div style="font-size:11px;color:#94a3b8;line-height:1.5;margin-top:6px;">2025년 본부 부산 이전 (부산광역시 동구 아이엠빌딩) · 민원 콜센터 110</div>
            </div>
            <a href="https://www.mof.go.kr" target="_blank" rel="noopener" style="display:inline-block;padding:8px 14px;background:#14b8a6;color:#ffffff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:700;white-space:nowrap;">해양수산부 →</a>
          </div>
```

Replace with:

```javascript
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;">
            <div style="flex:1;min-width:240px;">
              <div style="font-size:10px;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;font-weight:500;">FAIRCAST 항만 가이드</div>
              <div style="font-size:13px;color:#475569;line-height:1.6;">한국 12개 무역항의 입항 절차, 시설, 운영 정보를 정리한 실용 가이드입니다. 지도에서 항만을 클릭하거나, 아래 카드에서 각 항만의 상세 가이드로 이동할 수 있습니다.</div>
            </div>
          </div>
```

Key changes:
- "총괄 해양수산부 (MOF)" → "FAIRCAST 항만 가이드"
- 설명 문구를 매체 관점으로 변경
- MOF 본부 이전·민원 콜센터 줄 삭제 (디렉토리 내부에 이미 있음)
- 해양수산부 버튼 삭제 (디렉토리에 이미 링크 있음)

---

## 수정 후

```bash
git add loader.js
git commit -m "refactor: port-guide header panel - replace MOF info with Faircast guide intro"
git push origin main
```

Push 후 jsDelivr 캐시 퍼지:
```
https://purge.jsdelivr.net/gh/oceanholic83-web/ship-fairtech-assets@main/loader.js
```

브라우저에서 위 URL 열어서 퍼지 확인 후, 시크릿 창에서 `faircast.kr/category/port-guide/` 새로고침.

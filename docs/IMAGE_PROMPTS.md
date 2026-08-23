# 이미지 생성 규칙 — 항만 시리즈

2026-08-23 신설. 평택·당진항 개고에서 생성 이미지 3장이 전부 틀린 그림으로 나온 게 계기다.

관련: `docs/NAMING_POLICY.md`(파일명·변환) · 지침 [9] 이미지 정책

---

## 1. 왜 틀린 그림이 나오는가

두 가지 원인이 겹쳤다.

**고유명사를 넣었다.** 「평택항」이라고 쓰면 모델은 그 이름의 학습 이미지가 부족할 때
자기가 아는 대형 항만(부산 신항·나고야·로테르담)의 요소를 합성한다.
컨테이너 크레인·자동차 야적장·구형 탱크가 한 프레임에 모인 그림이 그 결과였다.

**항만 전체를 한 컷에 요구했다.** 부감(aerial)으로 넓게 잡으라고 하면
모델은 **부두 배치를 지어낸다.** 실제 배치를 알 리가 없다.

---

## 2. 강제 규칙 다섯

프롬프트마다 반드시 들어간다.

| # | 규칙 | 이유 |
|---|---|---|
| 1 | **한 컷에 한 화물** | 자동차면 자동차만. 섞으면 배치가 조작된다 |
| 2 | **고유명사 금지** | 항만명 대신 물리 조건으로 서술한다 |
| 3 | **부감 금지** | `not aerial`, `eye-level` 명시. 배치 조작을 막는 유일한 장치 |
| 4 | **금지 목록 명시** | `no spherical tanks`, `no container cranes` 등을 컷마다 다르게 |
| 5 | **안전 필터 준수** | `no readable text, no logos, no brand marks, no visible faces, no flags` |

---

## 3. 설비 오류 — 자주 틀리는 것

| 대상 | 잘못된 표현 | 맞는 표현 |
|---|---|---|
| LNG 저장탱크 | 구형(sphere) | **원통형 완전방호식** — `cylindrical full-containment, low and wide` |
| LPG 저장탱크 | — | 구형이 맞다 |
| 액체화물 접안 | 안벽 계류 | **돌핀부두** — `isolated concrete dolphins linked by steel catwalk`, `marine loading arms` |
| 자동차 하역 | 크레인 | **램프** — `stern ramp lowered onto the apron` |
| 벌커 하역 | 컨테이너 크레인 | **연속식 언로더 / 그랩** |

---

## 4. 해역별 조건 — 물색과 지형

⚠️ **탁도를 과장하지 않는다.** 준설된 항내 수역은 흙탕물이 아니다.
서해 느낌은 **물색이 아니라 조위 흔적**으로 낸다 — 안벽 하단의 물때 자국 한 줄이면 충분하다.

| 해역 | 항 | 물색 | 지형·광질 | 특징 |
|---|---|---|---|---|
| 서해 (조위차 大) | 인천 · 평택·당진 · 대산 · 군산 · 목포 | `muted grey-green, low saturation` | 흐림, 평탄한 매립지, 낮은 하늘 | 안벽 하단 `faint darker tide line`. 갯벌은 넣지 않는다 |
| 남해 | 부산 · 광양·여수 · 마산 | `calm blue-green` | 배후에 산·섬 실루엣 | 만 지형, 잔잔한 수면 |
| 동해 | 동해·묵호 · 포항 · 울산 | `deep blue-green, clear` | 급경사 배후, 조위차 거의 없음 | 외해형 사석 방파제 |

---

## 5. 재사용 골격

```
Industrial documentary photograph of <시설 하나> at a Korean <해역> port.
<피사체 서술 — 척수·기수·단수까지 규모를 지정>
Eye-level view from <위치>, not aerial.
<해역 조건: 물색 · 광질 · 배후 지형>
Muted desaturated palette, restrained colour grading.
No <이 컷에 있으면 안 되는 설비 나열>.
No readable text, no logos, no brand marks, no visible faces.
```

**규모를 숫자로 지정한다.** 「container terminal」만 쓰면 모델이 세계 최대급을 그린다.
`four ship-to-shore gantry cranes`, `feeder-size container ship, roughly 2,000 TEU class`,
`stacked three to four tiers only` 처럼 항의 실제 체급을 박아 넣는다.

---

## 6. 검수 체크리스트

생성본을 받으면 본문에 넣기 전에 확인한다.

- [ ] 한 컷에 화물이 하나인가
- [ ] 없어야 할 설비가 들어오지 않았나 (특히 구형 탱크)
- [ ] 배가 그 부두에 맞는 선형·체급인가
- [ ] 물색·지형이 해역과 맞는가
- [ ] 읽히는 글자·로고·얼굴·국기가 없는가
- [ ] 세 장의 톤이 통일됐는가 (광질·채도)
- [ ] 본문 수치와 이미지 수치가 어긋나지 않는가

---

## 7. 실사진을 쓸 때

생성으로 못 만드는 특정 구조물은 실사진이 필요하다 — 인천 갑문, 평택 국제여객부두 부잔교 등.

| 경로 | 상업 이용 | 주의 |
|---|---|---|
| 공공누리(KOGL) **제1유형** | 가능 | **출처표시 의무.** 제2·3·4유형은 상업이용 또는 변형 금지 — 건별 확인 |
| Wikimedia Commons | 라이선스별 | 한국 항만 사진 수가 적다 |
| Unsplash · Pexels | 가능 | 특정 항만 사진이 없다. 일반 항만 이미지라 문제가 그대로 남는다 |
| 직접 촬영 | 완전 자유 | 각 항만공사 홍보관·안내선 운영 |

---

## 8. 완료 기록

| 날짜 | 항 | 파일 |
|---|---|---|
| 2026-08-23 | 평택·당진 | `260823-pyeongtaek-car-yard` · `-container-terminal` · `-lng-jetty` (태그 v3) |

---

## 버전 이력

| v | 날짜 | 변경 |
|---|---|---|
| v1 | 2026-08-23 | 문서 신설. 평택·당진 3장 재생성 경험 반영 |

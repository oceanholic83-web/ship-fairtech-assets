# 백업 런북

2026-08-13 Cloudinary 계정 정지 사고가 이 문서를 만든 이유다. 무료 한도(25 크레딧)에 33.58 사용으로 정지 → 양쪽 사이트 이미지가 전부 401, 9/12 영구 삭제 예약. `cloudinary-export/`가 없었으면 381개를 잃을 뻔했다.

**단일 실패점 셋:** 워드프레스 DB, WPCode 스니펫, Cloudinary 자산. 셋 다 레포에 없다.

## 대상

| 대상 | 어디에 있나 | 백업 위치 | 주기 | 상태 |
|---|---|---|---|---|
| 워드프레스 DB | 가비아 호스팅 | 가비아 자동 백업 | **주기 미확인** | ⚠️ 확인 필요 |
| 발행글 본문 | 워드프레스 DB | — | — | ⚠️ 미구축 |
| WPCode 스니펫 | DB에만 존재 | `docs/wpcode-snippets-*.md` | 스니펫 변경 시 | 260725판이 최신 |
| Cloudinary 자산 (계정 전체) | `dzatgu3y7` | `cloudinary-export/` (gitignore, 631.5 MB) | 자산 추가 시 | 381개. **미니PC에만 있음** |
| Cloudinary 자산 (faircast 참조분) | `dzatgu3y7` | `cloudinary-export-faircast/` (gitignore, 418.6 MB) | 발행 시 | **237개 전량 확보 (2026-08-22)** |
| 레포 (코드) | GitHub | `oceanholic83-web/ship-fairtech-assets` | 커밋 시 | 정상 |
| 레포 (이미지) | GitHub | `oceanholic83-web/faircast-images` | 배치 추가 시 | **237장 WebP, 태그 v1 (2026-08-22)** |
| `config.local.json` 4개 | 로컬만 (gitignore) | **USB 수동** | 기기 교체 시 | 2026-08-23 노트북1 이관 완료. **git 에 없으므로 별도 보관 필수** |

## 절차

### 워드프레스 글 본문 — REST로 전량 추출

```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$all = @()
1..4 | ForEach-Object {
  $all += curl.exe -s "https://faircast.kr/wp-json/wp/v2/posts?per_page=100&page=$_&_fields=id,slug,title,excerpt,date,modified" | ConvertFrom-Json
}
$all | ConvertTo-Json -Depth 5 | Out-File "backup/posts-$(Get-Date -f yyyyMMdd).json" -Encoding utf8
$all.Count
```

`backup/` 은 gitignore. 커밋하지 않는다.

### WPCode 스니펫

DB에만 있고 API 쓰기는 Wordfence WAF 403으로 막힌다. **손으로 복사한다.**
스니펫을 고칠 때마다 `docs/wpcode-snippets-YYMMDD.md` 를 새로 만들고 이전 판은 `docs/archive/` 로 보낸다.

현재 활성 목록은 `claude/SITE_REFERENCE.md` 2장 참조.

### Cloudinary

두 벌이 있다.

- `cloudinary-export/` — 계정 전체 381개, 631.5 MB. **미니PC에만 있다.** 기기 교체 시 수동 이관
- `cloudinary-export-faircast/` — faircast 참조 237개, 418.6 MB. **스크립트로 언제든 재생성 가능**

```powershell
powershell -ExecutionPolicy Bypass -File scripts\audit-cloudinary.ps1     # 목록 갱신
powershell -ExecutionPolicy Bypass -File scripts\download-cloudinary.ps1  # 받기 (이미 있는 건 건너뜀)
```

API 키가 필요 없다. 전부 공개 배포 URL이라 참조 목록만 있으면 복구된다.
**새 글 발행 후에는 두 스크립트를 돌려 신규 이미지를 백업에 편입한다.**

**2026-08-22: 마이그레이션 완료.** faircast.kr 은 더 이상 Cloudinary 를 참조하지 않는다(본문·og:image·히어로 CSS 전수 0).
이미지는 `faircast-images` 레포 + jsDelivr 로 서빙한다. Cloudinary Plus(월 $99) 는 다운그레이드 가능.

⚠️ 다만 **해지 전 육안 확인**은 남는다. DB·REST 조회가 아니라 시크릿 창에서 실제 페이지를 연다. 8/13 사고의 교훈.

### config.local.json

gitignore라 클론에 안 따라온다. 없으면 `node build.js` 가 죽는다.

```
monitor/config.local.json
pages/hello-korea/config.local.json
pages/hello-world/config.local.json
pages/port-guide/config.local.json   ← Mapbox 토큰 포함
```

→ 기기 교체 전에 반드시 별도 보관. **레포·대화창·오더에 붙여넣지 않는다.**

## 복구 우선순위

정지·유실이 났을 때 순서.

1. **Cloudinary** — 이미지가 죽으면 전 페이지가 깨진다. 결제 복구가 가장 빠르다
2. **워드프레스 DB** — 가비아 백업 복원
3. **WPCode** — `docs/wpcode-snippets-*.md` 에서 수동 재입력. 378의 `chr(60)` / `'scr' . 'ipt'` 분할은 **합치지 말 것** (WAF 회피용)
4. **레포** — GitHub에서 클론 후 `config.local.json` · `cloudinary-export/` 별도 복원

## 미해결

- 가비아 워드프레스 DB 백업 주기 확인
- `backup/posts-*.json` 주기 실행 자동화 여부 결정
- Cloudinary 마이그레이션 (정적 호스팅 전환) — 완료되면 월 $99가 사라진다

# docs/

이 폴더의 문서는 **정책과 참조**다. 진행 상황은 `claude/` 쪽 원장이 들고 있다.

## 어디에 무엇이 있나

| 위치 | 성격 | 내용 |
|---|---|---|
| `claude/STATUS.md` | 원장 | 현재 상태·지표·막힌 것 |
| `claude/log.md` | 원장 | 시간순 추가 전용. `## [YYYY-MM-DD] 구분 \| 제목` |
| `claude/CONTENT_LEDGER.md` | 원장 | 발행글·색인·중복·시리즈 숫자 정본 |
| `claude/SITE_REFERENCE.md` | 원장 | 워드프레스·WPCode·호스팅 구성 |
| `claude/FACT_SOURCES.md` | 원장 | 수치 출처 |
| `docs/NAMING_POLICY.md` | 정책 | 표기 통일 + update ALL of 체크리스트 |
| `docs/BACKUP.md` | 정책 | 백업 대상·주기·복구 절차 |
| `docs/wpcode-snippets-*.md` | 참조 | WPCode 스니펫 전문 사본 |
| `docs/jsdelivr-cache-bypass.md` | 참조 | CDN 캐시 우회 |
| `docs/archive/` | **스냅샷** | 과거 시점 기록. **현재 사실이 아니다** |

## docs/archive/ 규칙

> archive의 모든 파일은 **과거 한 시점의 스냅샷**이지 현재 사실이 아니다.
> **재검증 없이 archive 문서의 판정을 원장이나 오더로 옮기지 않는다.**

2026-08-14에 정확히 이걸 어겨서 사고가 났다. `content-audit-260716`의 판정 두 건(E-E-A-T 80/80편 미달, 중복 8편)을 그대로 STATUS에 옮겼는데 라이브 확인 결과 둘 다 틀렸다.

- 파일명 접두 `YYYY-MM-DD_`
- 파일 최상단에 ARCHIVED 배너. 알려진 오류가 있으면 배너에 명시
- archive 파일은 **수정하지 않는다.** 새 사실은 원장에 쓴다

## SSOT — 정본이 어디인가

faircast는 **워드프레스 DB가 정본**이고 레포는 사본이다. faircall(git이 정본)과 방향이 반대다.
WPCode 스니펫은 DB에만 있고 레포에는 문서 사본만 있다.

따라서 검증은 **라이브 HTTP 조회**로 한다.

```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8   # 창마다 1회, 한글 깨짐 방지

# (1) 상태 코드
curl.exe -s -o NUL -w "%{http_code}`n" "https://faircast.kr/<slug>/?cb=1"

# (2) 헤더
curl.exe -sI "https://faircast.kr/<slug>/?cb=1" | Select-String "HTTP/|X-Robots-Tag"

# (3) 메타 설명 — 끝이 …이면 요약 미반영
$h = curl.exe -s "https://faircast.kr/<slug>/?cb=1"
[regex]::Match($h, '<meta name="description" content="([^"]*)"').Groups[1].Value

# (4) 본문 문자열 소거 확인
$h -match '지워야 할 문자열'
```

`?cb=` 캐시 버스터는 필수다. 가비아 캐시가 옛 응답을 준다.
PowerShell 5.1은 `&&`를 지원하지 않는다. 한 줄씩 실행하거나 Git Bash를 쓴다.

**신뢰도 순서:** Search Console 라이브 테스트 > view-source ≈ `web_fetch` > `site-monitor.js` > 프론트 텍스트 복사

## 작업 규칙

- **워드프레스 글 본문은 `core/freeform`(클래식) 블록 하나다.** 블록 편집기 API(`resetEditorBlocks` · `updateBlockAttributes`)로 내용을 주입하면 **`<p>` 태그가 전부 사라진다.** 코드 편집기 `textarea.editor-post-text-editor` 로만 치환한다. 블록 유형은 `getBlocks()[0].name` 으로 먼저 확인
- **코드 편집기 모드에서는 「업데이트」가 안 먹는다.** 시각 편집기(`Ctrl+Shift+Alt+M`)로 되돌린 뒤 저장하고, **저장 여부는 REST 로 확인**한다
- `pages/*.html`은 **손편집 금지.** 한 줄짜리 초장문이라 모델이 재작성하면 깨진다. 문자열 치환 스크립트(`fs.split().join()`)만
- 붙여넣기 전 `post=` 번호 확인. VLCC 시리즈 A=465 / B=401 / C=283 (A에는 「장금마리타임」 섹션이 있다)
- 레포에 키·토큰 커밋 금지. 공개 저장소다
- 원장 수정 후 대표가 `git diff`로 확인하고 커밋

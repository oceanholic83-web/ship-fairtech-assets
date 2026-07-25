# Order: 문서 내 Mapbox 토큰 제거 및 push 차단 해제

**목표**: `docs/wpcode-snippets-260725.md`에 평문으로 들어간 Mapbox 토큰을 자리표시자로 바꾸고, GitHub Secret Scanning에 막힌 push를 통과시킨다.

**배경**:
- GitHub Push Protection이 `docs/wpcode-snippets-260725.md` 448행 근처에서 Mapbox Access Token을 감지해 push를 차단했다.
- 해당 토큰은 `pk.`로 시작하는 **공개 토큰**이다. Mapbox 규약상 `pk.`는 브라우저 노출을 전제로 한 값이며, 이미 WPCode 68번 스니펫을 통해 faircast.kr 페이지 소스에 노출되어 있다. 실제 보안 위험은 낮다.
- 그럼에도 문서에 실제 토큰을 기록할 이유가 없고, 방치하면 앞으로도 계속 push가 막힌다. **Bypass 하지 말고 제거한다.**

**실행 위치**: `C:\Users\bab5s\Desktop\project\ship-fairtech-assets\`

**주의**: PowerShell에서는 `&&`가 동작하지 않는다. 명령은 한 줄씩 실행한다.

---

## Step 1: 토큰 위치 확인

```powershell
Set-Location "C:\Users\bab5s\Desktop\project\ship-fairtech-assets"
```

```powershell
Select-String -Path "docs\wpcode-snippets-260725.md" -Pattern "pk\.eyJ" | Select-Object LineNumber, Line
```

`pk.eyJ`로 시작하는 문자열이 있는 행 번호를 확인한다. 1개일 것으로 예상된다.

**추가 확인** — 다른 파일에도 있는지:

```powershell
Get-ChildItem -Recurse -Include *.md,*.txt -Path docs,orders,monitor | Select-String -Pattern "pk\.eyJ" | Select-Object Path, LineNumber
```

`config.local.json`에 있는 것은 **정상이므로 건드리지 않는다** (gitignore 대상).

---

## Step 2: 토큰을 자리표시자로 교체

`docs/wpcode-snippets-260725.md`에서 **WPCode 68 — Korea Port Atlas Map** 섹션을 찾아, 코드블록 전체를 아래로 교체한다.

**교체 전** (실제 토큰이 들어 있는 상태):
```html
<script>window.PORT_ATLAS_CONFIG={mapboxToken:'pk.eyJ1...실제토큰...'};</script>
<div id="korea-port-app"></div>
<script src="https://cdn.jsdelivr.net/gh/oceanholic83-web/ship-fairtech-assets@main/loader.js"></script>
```

**교체 후**:
````markdown
```html
<script>window.PORT_ATLAS_CONFIG={mapboxToken:'pk.YOUR_MAPBOX_PUBLIC_TOKEN'};</script>
<div id="korea-port-app"></div>
<script src="https://cdn.jsdelivr.net/gh/oceanholic83-web/ship-fairtech-assets@main/loader.js"></script>
```

> **토큰 값은 이 문서에 기록하지 않는다.**
> 실제 값 위치: WPCode 68번 스니펫 편집 화면, 또는 `pages/port-guide/config.local.json`
> `pk.`로 시작하는 Mapbox 공개 토큰이며 브라우저 노출을 전제로 한 값이지만,
> GitHub Secret Scanning이 push를 차단하므로 문서에는 자리표시자만 둔다.
````

Step 1에서 다른 파일에도 토큰이 발견됐다면 동일하게 교체한다.

---

## Step 3: 교체 검증

```powershell
Select-String -Path "docs\wpcode-snippets-260725.md" -Pattern "pk\.eyJ"
```

**결과가 비어 있어야 한다.** 무언가 출력되면 교체가 덜 된 것이므로 Step 2를 다시 확인한다.

---

## Step 4: 커밋 이력 정리

토큰이 이미 로컬 커밋에 들어가 있으므로, 파일만 고쳐서는 push가 통과하지 않는다. 커밋 이력에서 제거해야 한다.

### 4-1. 현재 상태 확인

```powershell
git log origin/main..HEAD --oneline
```

push 대기 중인 커밋 목록이 나온다. **개수를 확인한다.**

### 4-2. 커밋이 1개인 경우

```powershell
git add docs/wpcode-snippets-260725.md
```

```powershell
git commit --amend --no-edit
```

### 4-3. 커밋이 2개 이상인 경우 (권장 경로)

`--soft` reset으로 커밋만 풀고 파일은 그대로 둔 뒤, 하나로 다시 묶는다.

```powershell
git reset --soft origin/main
```

```powershell
git status
```

> 이 시점에 파일들이 staged 상태로 보여야 한다. **파일 내용은 삭제되지 않는다.**
> `monitor/config.local.json`이 목록에 없는지 반드시 확인할 것.

```powershell
git add .
```

```powershell
git commit -m "docs: v7 log, wpcode snippets handover, monitor v2"
```

---

## Step 5: 최종 검증 후 push

### 5-1. 커밋 내용에 토큰이 없는지 확인

```powershell
git diff origin/main..HEAD | Select-String -Pattern "pk\.eyJ"
```

**비어 있어야 한다.**

### 5-2. config.local.json이 포함되지 않았는지 확인

```powershell
git diff origin/main..HEAD --name-only | Select-String -Pattern "config.local.json"
```

`.example`만 나오거나 비어 있어야 한다. `config.local.json`(example 없는 것)이 나오면 **push하지 말고** .gitignore를 확인한다.

### 5-3. push

```powershell
git push
```

---

## 실패 시 대응

### push가 여전히 차단되는 경우

Secret Scanning 오류 메시지에서 **파일 경로와 행 번호**를 다시 확인한다. Step 1에서 놓친 파일이 있을 수 있다.

전체 커밋 범위를 다시 검색:

```powershell
git diff origin/main..HEAD | Select-String -Pattern "pk\.|sk\.|fcmonitor|fc_mon_"
```

`fc_mon_` (monitor API 키)도 함께 검사한다. 문서나 오더 파일에 들어갔을 수 있다.

### `git reset --soft` 후 파일이 사라진 것처럼 보이는 경우

사라지지 않았다. `--soft`는 커밋 포인터만 되돌리고 작업 디렉토리와 인덱스는 유지한다. `git status`로 확인하면 staged 상태로 남아 있다.

---

## 완료 확인

- [ ] `docs/wpcode-snippets-260725.md`에서 `pk.eyJ` 검색 결과 없음
- [ ] 다른 문서·오더 파일에도 토큰 없음
- [ ] `git diff origin/main..HEAD`에 `pk.eyJ` / `fc_mon_` 없음
- [ ] `config.local.json`이 커밋에 포함되지 않음
- [ ] `git push` 성공

---

## 참고: 앞으로의 원칙

**문서·오더·리포트에 실제 키나 토큰을 적지 않는다.**

- 실제 값은 `config.local.json` (gitignore 대상)에만
- 문서에는 자리표시자와 "실제 값 위치" 안내만
- `pk.` 공개 토큰이라도 마찬가지 — Secret Scanning이 구분하지 않으므로 push가 계속 막힌다

`monitor/config.local.json`, `pages/*/config.local.json`은 이미 gitignore 처리되어 있으므로 그대로 두면 된다.

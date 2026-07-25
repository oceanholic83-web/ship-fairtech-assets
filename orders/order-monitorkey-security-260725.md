# Order: monitorKey 공개 노출 제거 및 로컬 설정 분리

**목표**: 공개 저장소에 평문으로 노출된 `monitorKey`를 제거하고, git에 올라가지 않는 로컬 설정 파일로 분리한다.

**배경**: `oceanholic83-web/ship-fairtech-assets`는 **공개 저장소**다 (jsDelivr가 public repo만 서비스하므로 확정). 현재 아래 3개 파일에 API 키가 평문으로 커밋되어 있다.

```
pages/hello-korea/config.json   "monitorKey": "fcmonitor071820!"
pages/hello-world/config.json   "monitorKey": "fcmonitor071820!"
pages/port-guide/config.json    "monitorKey": "fcmonitor071820!"
```

**선행 조건**: fairwayeta 쪽에 새 키가 이미 등록되어 있어야 한다 (구 키와 병행 허용 상태).

**실행 위치**: `C:\Users\bab5s\Desktop\project\ship-fairtech-assets\`

---

## Step 1: .gitignore 확인·보강

`.gitignore`에 아래 항목이 있는지 확인하고, 없으면 추가한다.

```gitignore
node_modules/
config.local.json
**/config.local.json
```

`config.local.json.example`은 **커밋 대상이므로 제외하지 말 것.**

---

## Step 2: 로컬 설정 파일 생성

아래 3개 파일을 새로 만든다. `NEW_KEY_HERE`는 사용자가 지정한 새 키로 치환한다.

**`pages/hello-korea/config.local.json`**
```json
{
  "monitorKey": "NEW_KEY_HERE"
}
```

**`pages/hello-world/config.local.json`**
```json
{
  "monitorKey": "NEW_KEY_HERE"
}
```

**`pages/port-guide/config.local.json`**

port-guide는 기존에 `config.local.json.example`이 있고 mapboxToken을 쓴다. 두 값을 합친다.
```json
{
  "monitorKey": "NEW_KEY_HERE",
  "mapboxToken": "pk.기존_토큰_값"
}
```

> 기존 mapboxToken 값은 `pages/port-guide/config.local.json`이 이미 존재하면 거기서 가져오고, 없으면 `config.json` 또는 WPCode 68번 스니펫의 값을 사용한다.

---

## Step 3: example 파일 갱신

**`pages/hello-korea/config.local.json.example`** (신규)
```json
{
  "monitorKey": "YOUR_MONITOR_KEY"
}
```

**`pages/hello-world/config.local.json.example`** (신규)
```json
{
  "monitorKey": "YOUR_MONITOR_KEY"
}
```

**`pages/port-guide/config.local.json.example`** (기존 파일 수정)
```json
{
  "monitorKey": "YOUR_MONITOR_KEY",
  "mapboxToken": "pk.YOUR_MAPBOX_PUBLIC_TOKEN"
}
```

---

## Step 4: config.json에서 키 제거

3개 파일에서 `"monitorKey": "fcmonitor071820!"` **줄만** 삭제한다. 다른 값은 건드리지 않는다.

- `pages/hello-korea/config.json`
- `pages/hello-world/config.json`
- `pages/port-guide/config.json`

앞 줄의 쉼표 처리에 주의할 것 (JSON 문법 오류 방지).

---

## Step 5: build.js 3개 수정

각 build.js가 config.json을 읽는 부분을 찾아, **config.local.json을 병합**하도록 수정한다.

대상 파일:
- `pages/hello-korea/build.js`
- `pages/hello-world/build.js`
- `pages/port-guide/build.js`

기존 로딩 코드(대략 `const cfg = JSON.parse(fs.readFileSync(...config.json...))` 형태)를 아래 패턴으로 교체한다.

```js
const path = require('path');
const fs = require('fs');

function loadConfig(dir) {
  const base = JSON.parse(fs.readFileSync(path.join(dir, 'config.json'), 'utf8'));

  const localPath = path.join(dir, 'config.local.json');
  if (!fs.existsSync(localPath)) {
    console.error('\n[ERROR] config.local.json 이 없습니다.');
    console.error('  경로: ' + localPath);
    console.error('  config.local.json.example 을 복사한 뒤 실제 키를 입력하세요.\n');
    process.exit(1);
  }

  const local = JSON.parse(fs.readFileSync(localPath, 'utf8'));
  const cfg = Object.assign({}, base, local);

  if (!cfg.monitorKey) {
    console.error('\n[ERROR] monitorKey 가 설정되지 않았습니다. config.local.json 을 확인하세요.\n');
    process.exit(1);
  }

  return cfg;
}

const cfg = loadConfig(__dirname);
```

**주의**: 기존 변수명이 `cfg`가 아닐 수 있다. 각 파일의 실제 변수명에 맞춘다. 기존 `cfg.monitorApi`, `cfg.monitorKey`, `cfg.categoryId` 등의 사용부는 그대로 동작해야 한다.

---

## Step 6: 검증

3개 빌더를 순서대로 실행한다. **PowerShell에서는 `&&`가 동작하지 않으므로 두 줄로 실행한다.**

```powershell
cd "C:\Users\bab5s\Desktop\project\ship-fairtech-assets\pages\hello-korea"
node build.js
```

```powershell
cd "C:\Users\bab5s\Desktop\project\ship-fairtech-assets\pages\hello-world"
node build.js
```

```powershell
cd "C:\Users\bab5s\Desktop\project\ship-fairtech-assets\pages\port-guide"
node build.js
```

**확인 사항:**
- [ ] 3개 모두 401 없이 정상 완료
- [ ] 각 빌더가 가져온 글 개수가 이전과 동일하거나 증가
- [ ] 생성된 HTML 파일이 정상 (`hello-korea.html` 등)

**실패 시 대응:**
- 401 → fairwayeta에 새 키가 아직 등록되지 않음. Step 2(fairwayeta 작업) 확인
- `config.local.json 이 없습니다` → Step 2 파일 생성 누락
- JSON 파싱 오류 → Step 4에서 쉼표 처리 실수

---

## Step 7: 커밋 전 최종 확인 ⭐

**config.local.json이 git에 잡히지 않는지 반드시 확인한다.**

```powershell
cd "C:\Users\bab5s\Desktop\project\ship-fairtech-assets"
git status
```

`config.local.json`이 목록에 나타나면 **커밋하지 말고** .gitignore를 다시 확인한다.

추가 확인:
```powershell
git ls-files | Select-String "config.local.json"
```

결과가 비어 있어야 정상. (`.example`만 나오면 정상)

---

## Step 8: 커밋

```powershell
git add .gitignore pages/
git commit -m "security: move monitorKey to gitignored config.local.json"
git push
```

> heredoc(`$(cat <<'EOF'`) 문법은 PowerShell에서 파싱 오류를 일으킨다. `-m` 한 줄로 작성할 것.

---

## Step 9: 사용자 후속 조치 (수동)

1. **fairwayeta에서 구 키 제거**
   Vercel 환경변수 `FAIRCAST_MONITOR_KEYS`에서 `fcmonitor071820!` 삭제 → 재배포

2. **제거 후 재검증**
   빌더 3개를 다시 실행해 새 키만으로 동작하는지 확인

---

## 완료 확인

- [ ] .gitignore에 `config.local.json` 포함
- [ ] config.local.json 3개 생성 (git 미추적 확인)
- [ ] config.local.json.example 3개 생성/갱신 (git 추적)
- [ ] config.json 3개에서 monitorKey 제거
- [ ] build.js 3개 수정
- [ ] 빌더 3개 정상 실행
- [ ] `git ls-files`에 config.local.json 없음
- [ ] 커밋·푸시 완료

---

## 참고: 커밋 히스토리의 구 키

구 키 `fcmonitor071820!`는 **과거 커밋에 영구히 남는다.** `git filter-branch`나 BFG로 히스토리를 재작성할 수 있지만:

- 공개 저장소이므로 이미 노출된 것으로 간주해야 한다
- 히스토리 재작성은 jsDelivr 캐시·기존 클론과 충돌 위험이 있다

**권장: 히스토리는 손대지 않고, fairwayeta에서 구 키를 무효화하는 것으로 충분하다.** 키가 무효화되면 히스토리에 남아도 쓸모가 없다.

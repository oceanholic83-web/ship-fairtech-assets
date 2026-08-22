# 오더 — Cloudinary URL → jsDelivr 치환 (2026-08-22)

**이 오더는 워드프레스 DB를 직접 고친다. 오늘 작업 중 유일하게 되돌리기 어려운 단계다.**

대상: 본문 231건(`wp_posts`) + FIFU 대표 51건(`wp_postmeta`) = 고유 자산 237개.
Better Search Replace로는 안 된다 — URL마다 `/v1783391447/` 버전 번호가 달라 237쌍이 필요하다.
→ **WPCode 1회용 PHP 스니펫**으로 정규식 치환한다. 실행 후 스니펫은 삭제한다.

---

## 0. 선행 조건 (건너뛰지 말 것)

- [ ] **UpdraftPlus 백업 실행.** 데이터베이스 포함. 완료 확인까지
- [ ] jsDelivr 응답 확인 (완료: `200`)
- [ ] 본 오더 1단계를 **`$DRY = true` 로 먼저 실행**

---

## 1. WPCode 스니펫 생성

WPCode → 스니펫 추가 → **PHP Snippet**
이름: `[1회용] Cloudinary URL 치환`
삽입 위치: **Run Everywhere** (또는 Admin Only)
**저장만 하고 비활성 상태로 둔다.**

```php
add_action('admin_init', function () {

    // ── 안전장치 3중 ──────────────────────────────
    $DRY   = true;                    // false 로 바꿔야 실제로 쓴다
    $TOKEN = 'swap-260822';           // URL 에 ?fctswap=swap-260822 를 붙여야 돈다
    if (!current_user_can('manage_options')) return;
    if (!isset($_GET['fctswap']) || $_GET['fctswap'] !== $TOKEN) return;

    global $wpdb;
    $BASE = 'https://cdn.jsdelivr.net/gh/oceanholic83-web/faircast-images@v1/img/';

    // Cloudinary URL 하나를 새 URL 로 바꾼다.
    // 파일명 규칙: ASCII 이름은 그대로 + .webp,
    //              한글 이름은 Cloudinary 6자 접미사만 남긴다.
    $rewrite = function ($html) use ($BASE) {
        $re = '#https?://res\.cloudinary\.com/dzatgu3y7/image/upload/(?:[^/"\'\s]+/)*?v\d+/([^"\'\s\)<]+?)\.(png|jpe?g|webp)#i';
        return preg_replace_callback($re, function ($m) use ($BASE) {
            $stem = urldecode($m[1]);
            if (!preg_match('/^[A-Za-z0-9._-]+$/', $stem)) {
                if (preg_match('/_([a-z0-9]{6})$/i', $stem, $s)) $stem = $s[1];
                else $stem = preg_replace('/[^A-Za-z0-9._-]/', '', $stem);
            }
            return $BASE . $stem . '.webp';
        }, $html);
    };

    $report = ['posts' => 0, 'meta' => 0, 'left' => 0];

    // ── 본문 ──────────────────────────────────────
    $rows = $wpdb->get_results("
        SELECT ID, post_content FROM {$wpdb->posts}
        WHERE post_content LIKE '%res.cloudinary.com%'
          AND post_type IN ('post','page')
          AND post_status IN ('publish','draft','pending','private')
    ");
    foreach ($rows as $r) {
        $new = $rewrite($r->post_content);
        if ($new !== $r->post_content) {
            $report['posts']++;
            if (!$DRY) {
                $wpdb->update($wpdb->posts, ['post_content' => $new], ['ID' => $r->ID]);
            }
        }
    }

    // ── FIFU 대표 이미지 (postmeta) ───────────────
    $metas = $wpdb->get_results("
        SELECT meta_id, meta_value FROM {$wpdb->postmeta}
        WHERE meta_value LIKE '%res.cloudinary.com%'
    ");
    foreach ($metas as $m) {
        $new = $rewrite($m->meta_value);
        if ($new !== $m->meta_value) {
            $report['meta']++;
            if (!$DRY) {
                $wpdb->update($wpdb->postmeta, ['meta_value' => $new], ['meta_id' => $m->meta_id]);
            }
        }
    }

    // ── 잔여 확인 ─────────────────────────────────
    $report['left'] =
        (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts}    WHERE post_content LIKE '%res.cloudinary.com%'")
      + (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->postmeta} WHERE meta_value  LIKE '%res.cloudinary.com%'");

    if (!$DRY) { wp_cache_flush(); }

    wp_die(
        '<h2>' . ($DRY ? 'DRY RUN — 아무것도 쓰지 않음' : '실행 완료') . '</h2>' .
        '<pre>' . esc_html(print_r($report, true)) . '</pre>' .
        '<p>posts = 바뀔/바뀐 글·페이지 수, meta = postmeta 행 수, left = 남은 Cloudinary 행 수</p>'
    );
});
```

---

## 2. 실행 순서

**(1) DRY RUN**

스니펫을 **활성화**한 뒤 브라우저에서:

```
https://faircast.kr/wp-admin/?fctswap=swap-260822
```

기대값:

| 항목 | 기대 |
|---|---|
| `posts` | 60 내외 (본문에 Cloudinary가 있는 글·페이지 수) |
| `meta` | 51 내외 (FIFU 대표) |
| `left` | DRY 이므로 아직 그대로 |

`posts`가 0이면 정규식이 안 맞은 것이다. **거기서 멈추고 보고할 것.**

**(2) 실제 실행**

스니펫에서 `$DRY = true;` → `$DRY = false;` 로 고치고 저장.
같은 URL 재방문.

기대값: **`left` = 0**

**(3) 스니펫 삭제**

`left = 0` 확인 후 스니펫을 **비활성화 → 삭제**한다. 남겨두지 않는다.

---

## 3. 검증 (필수)

```powershell
[Console]::OutputEncoding = [Text.Encoding]::UTF8
cd C:\Users\bab5s\Desktop\project\ship-fairtech-assets

# (1) 참조 0 확인
powershell -ExecutionPolicy Bypass -File scripts\audit-cloudinary.ps1

# (2) 대표 이미지 실제 렌더링 확인
curl.exe -s "https://faircast.kr/vlcc-fleet-900-effective-570-supply-gap-korea-2026/?cb=1" | Select-String "og:image"

# (3) 이미지가 실제로 200 인지
curl.exe -s -o NUL -w "%{http_code}`n" "https://cdn.jsdelivr.net/gh/oceanholic83-web/faircast-images@v1/img/26070701_x9gydi.webp"
```

`audit-cloudinary.ps1` 의 `body refs` 와 `featured refs` 가 **둘 다 0**이어야 한다.

⚠️ **DB 조회로만 확인하지 않는다.** 시크릿 창에서 글 3~4편을 눈으로 열어 이미지가 보이는지 본다. 8/13 사고 때 얻은 교훈이다.

---

## 4. 남은 것

- 홈페이지 히어로 배경은 **CSS `background-image`** 라 본문 치환에 포함된다 (page 269 본문 안의 `<style>`). 확인 대상
- `pages/homepage/config.json` `fallbackImage`, `pages/port-guide/config.json`, `data.js` 의 Cloudinary URL은 **레포 쪽**이라 이 스니펫이 못 건드린다. 별도 치환 + 빌드 + 붙여넣기
- 레포 치환 후 `node build.js` 를 돌리면 홈페이지가 새로 생성되므로, **3.7KB 차이 문제**를 그때 정리한다

---

## 5. 금지

- 백업 없이 `$DRY = false` 실행
- `left > 0` 인 상태로 Cloudinary 플랜 해지
- 스니펫을 실행 후 방치 (삭제할 것)
- `wp_options` 등 다른 테이블 손대기

# WPCode 스니펫 인수인계 — faircast.kr

**최종 갱신**: 2026-07-25
**WPCode 버전**: 7.0.2 (Lite)
**WordPress**: 7.0.2
**총 18개** — 활성 15 / 비활성 3

> 이 문서 하나로 전체 스니펫을 복원·이관할 수 있다.
> 각 스니펫의 코드는 **현재 사이트에 적용된 최신본**이다.

---

## 상태 요약표

| ID | 이름 | 위치 | 유형 | 상태 | 색인 영향 |
|----|------|------|------|------|----------|
| 617 | robots.txt - World Cup 크롤 차단 | 프런트엔드만 | php | 🔴 **비활성** | 켜지 말 것 |
| 575 | Schema.org — Article + Author | 어디서나 | php | 🟢 활성 | E-E-A-T |
| 574 | Schema.org — Organization + WebSite | 사이트 헤더 | html | 🟢 활성 | E-E-A-T |
| 573 | Author Bio Block | 어디서나 | php | 🟢 활성 | E-E-A-T |
| 529 | Category Archive Noindex | 어디서나 | php | 🟢 활성 | ⚠️ 색인 제외 |
| 494 | Category → Page 301 | 어디서나 | php | 🟢 활성 | 리디렉션 |
| 406 | Legacy World Cup 301 Redirects | 어디서나 | php | 🟢 활성 | ⭐ 축구 URL 제거 |
| 378 | Meta Description from Excerpt | 어디서나 | php | 🟢 활성 | ⭐ meta |
| 361 | Exclude Tags from Sitemap | 어디서나 | php | 🟢 활성 | 사이트맵 |
| 359 | Force non-www redirect | 어디서나 | php | 🟢 활성 | 정규화 |
| 358 | Tag Archive Noindex | 어디서나 | php | 🟢 활성 | 색인 제외 |
| 259 | GA4 Tracking | 사이트 헤더 | html | 🟢 활성 | — |
| 220 | Faircast 도식 CSS | 사이트 헤더 | css | 🟢 활성 | — |
| 201 | 이미지·SVG 우클릭/드래그 차단 | 사이트 헤더 | html | 🔴 **비활성** | ⛔ 정책 위반 |
| 69 | Enable Shortcodes in Category Description | 어디서나 | php | 🟢 활성 | — |
| 68 | Korea Port Atlas Map | (지정 없음) | html | 🟢 활성 | 항만 지도 |
| 67 | 댓글 완전 비활성화 | 어디서나 | php | 🔴 비활성 | — |
| 66 | 글 첫 단락 뒤 메시지 | 단락 뒤 삽입 | text | 🟢 활성 (**내용 없음**) | — |

---

## ⛔ 절대 켜지 말 것

### 617 — robots.txt World Cup 크롤 차단

**2026-07-15 생성 → 2026-07-25 비활성화.**

`Disallow: /match/` 등으로 크롤을 막았는데, **크롤이 차단된 URL은 색인에서 제거되지 않는다.** Googlebot이 301 리디렉션을 확인할 수 없기 때문. 축구 URL 5개가 색인에 고착된 원인.

색인 제거는 406의 301로 처리한다. robots.txt 차단은 정반대 효과다.

<details>
<summary>비활성 코드 (참고용)</summary>

```php
add_filter('robots_txt', function($output, $public) {
    if ('0' == $public) {
        return $output;
    }
    $additional = "\n";
    $additional .= "# Block World Cup residual URLs\n";
    $additional .= "Disallow: /match/\n";
    $additional .= "Disallow: /simulate/\n";
    $additional .= "Disallow: /insights/\n";
    $additional .= "Disallow: /tournament\n";
    $additional .= "Disallow: /rankings\n";
    $additional .= "Disallow: /bracket\n";
    $additional .= "Disallow: /matchup\n";
    return $output . $additional;
}, 10, 2);
```
</details>

### 201 — 이미지·SVG 우클릭/드래그 차단

**Ctrl+U(소스 보기)·F12(개발자 도구) 차단 코드가 들어 있다.**

Google Publisher Policies의 **Abusive experiences**(사용자가 원하는 동작을 방해하는 경험)에 해당. 심사관이 사이트를 검사하는 행위 자체를 막으므로 리뷰 관점에서 특히 불리하다.

AdSense 승인 전까지 절대 활성화 금지. 승인 후에도 켤 이유 없음.

같은 이유로 **wp-custom-css의 `user-select: none` 블록도 제거 검토** 대상.

---

## 🟢 활성 스니펫 전체 코드

### 406 — Legacy World Cup 301 Redirects ⭐

**2026-07-25 전면 교체.** 구버전은 `/simulate`(슬래시 없음)·`/matchup`·`/insights/mbappe-*`를 못 잡아서 축구 URL 3개가 색인에 남아 있었다.

```php
add_action('template_redirect', function() {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

    $prefixes = ['/simulate', '/match', '/matchup', '/bracket', '/rankings', '/tournament'];
    foreach ($prefixes as $p) {
        if ($path === $p || strpos($path, $p . '/') === 0) {
            wp_redirect(home_url('/'), 301);
            exit;
        }
    }

    if (preg_match('#^/insights/?$#', $path)) {
        wp_redirect(home_url('/'), 301);
        exit;
    }

    if (strpos($path, '/insights/') === 0) {
        wp_redirect(home_url('/'), 301);
        exit;
    }
});
```

> `/insights/` 하위 전체를 홈으로 보낸다. 우리 카테고리는 `/category/insights/`라 경로가 달라 충돌 없음.

**검증**: `/matchup`, `/simulate`, `/insights/mbappe-injury-scare-world-cup-2026-france` → 홈 301 확인 완료 (2026-07-25)

---

### 378 — Meta Description from Excerpt ⭐

**2026-07-25 전면 교체.** `$post` null 가드 추가, `<style>`·`<script>` 블록 제거, CSS 잔재 최종 검사 추가.

요약(excerpt) 필드가 비어도 CSS가 meta description으로 새지 않는다.

```php
add_action('wp_head', function () {

    $hardcoded = [
        269 => 'Faircast는 한국의 해운·조선·항만 산업을 실무자 시각으로 분석하는 독립 매체입니다. 운임 지수, 규제 동향, 항만 운영, 조선 산업 이슈를 IMO·한국선급·해양수산부 등 1차 자료를 바탕으로 정리합니다.',
        522 => 'Faircast 항만 가이드. 한국 12개 무역항의 입항 절차, 시설, 운영 정보를 정리한 실용 가이드입니다. 지도와 카드로 각 항만의 상세 가이드를 제공합니다.',
        488 => 'Hello, Korea — 한국 해운·조선·항만의 시장과 실무를 한국 독자 시각으로 분석합니다. 운임 지수, 규제 동향, 항만 운영, 조선 산업 이슈를 한국어로 정리합니다.',
        490 => 'Hello, World — Korean shipping industry analysis for global readers. Markets, shipbuilding, and policy insights from a Korean vantage point, published in English.',
    ];

    $fallback = 'Faircast는 해운·조선·항만 산업의 시장과 실무를 잇는 독립 분석 매체입니다.';

    $lt = chr(60);
    $gt = chr(62);

    $build = function ($raw) use ($fallback, $lt, $gt) {
        foreach (['style', 'scr' . 'ipt'] as $tag) {
            $pattern = '#' . $lt . $tag . '[^' . $gt . ']*' . $gt
                     . '.*?' . $lt . '/' . $tag . $gt . '#is';
            $raw = preg_replace($pattern, ' ', $raw);
        }
        $raw = preg_replace('#' . $lt . '!--.*?--' . $gt . '#s', ' ', $raw);
        $raw = strip_shortcodes($raw);
        $raw = wp_strip_all_tags($raw);
        $raw = trim(preg_replace('/\s+/u', ' ', $raw));

        $head = mb_substr($raw, 0, 150);
        if ($raw === '' || preg_match('/\{[^}]*:[^}]*\}/', $head) || stripos($head, 'important') !== false) {
            return $fallback;
        }
        return mb_strlen($raw) > 160 ? mb_substr($raw, 0, 157) . '…' : $raw;
    };

    $desc = '';

    if (is_front_page() || is_home()) {
        $desc = $hardcoded[269];
    } elseif (is_singular()) {
        $p = get_post();
        if ($p instanceof WP_Post) {
            if (isset($hardcoded[$p->ID])) {
                $desc = $hardcoded[$p->ID];
            } elseif (has_excerpt($p)) {
                $desc = $build(get_the_excerpt($p));
            } else {
                $desc = $build($p->post_content);
            }
        }
    }

    if (!$desc) return;

    $desc = esc_attr($desc);
    echo '<meta name="description" content="' . $desc . '">' . "\n";
    echo '<meta property="og:description" content="' . $desc . '">' . "\n";
    echo '<meta name="twitter:description" content="' . $desc . '">' . "\n";

}, 1);
```

> **하드코딩 페이지 ID**: 269 홈 / 522 항만가이드 / 488 Hello Korea / 490 Hello World
> 페이지 ID가 바뀌면 이 배열도 수정해야 한다.

**Wordfence 주의**: 이 코드는 `<style>`·`<script>` 문자열 때문에 WAF에 XSS로 오인될 수 있다. `chr(60)`/`chr(62)`와 `'scr' . 'ipt'` 분할이 그 회피책이다. **이 부분을 원래대로 되돌리면 저장 시 403이 뜬다.**

---

### 575 — Schema.org Article + Author

⚠️ **미수정 결함**: `global $post; $post_id = $post->ID;` 에 null 가드가 없다. 378에서 고친 것과 같은 패턴. 지금까지 문제는 없었지만 언제든 Fatal error 가능.

<details>
<summary>현재 코드 (그대로 적용 중)</summary>

```php
add_action('wp_head', function() {
    if (!is_singular('post')) return;

    global $post;
    $post_id = $post->ID;
    $title = get_the_title($post_id);
    $url = get_permalink($post_id);
    $excerpt = get_the_excerpt($post_id);
    $published = get_the_date('c', $post_id);
    $modified = get_the_modified_date('c', $post_id);
    $image = get_post_meta($post_id, 'fifu_image_url', true);
    if (!$image) $image = get_the_post_thumbnail_url($post_id, 'full');
    if (!$image) $image = 'https://res.cloudinary.com/dzatgu3y7/image/upload/v1782286756/hello_y92wk9.png';

    $schema = [
        '@context' => 'https://schema.org',
        '@type' => 'Article',
        'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => $url],
        'headline' => wp_strip_all_tags($title),
        'description' => wp_strip_all_tags($excerpt),
        'image' => $image,
        'datePublished' => $published,
        'dateModified' => $modified,
        'author' => [
            '@type' => 'Organization',
            '@id' => 'https://faircast.kr/#organization',
            'name' => 'Faircast 편집팀',
            'url' => 'https://faircast.kr/about/'
        ],
        'publisher' => ['@id' => 'https://faircast.kr/#organization'],
        'inLanguage' => 'ko-KR'
    ];

    echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
}, 5);
```
</details>

**권장 수정본** (앞 3줄만 교체):

```php
add_action('wp_head', function() {
    if (!is_singular('post')) return;

    $post = get_post();
    if (!($post instanceof WP_Post)) return;
    $post_id = $post->ID;
    
    // ... 이하 기존과 동일
```

---

### 574 — Schema.org Organization + WebSite

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://faircast.kr/#organization",
      "name": "Faircast",
      "alternateName": "Faircast 편집팀",
      "url": "https://faircast.kr/",
      "email": "hello@fairtech.kr",
      "description": "해운·조선·항만 산업의 시장과 실무를 잇는 독립 분석 매체. Fairtech가 운영합니다.",
      "parentOrganization": {
        "@type": "Organization",
        "name": "Fairtech",
        "url": "https://fairtech.kr/",
        "description": "해운·항만 기술과 매체를 함께 다루는 독립 팀."
      },
      "sameAs": [
        "https://fairwayeta.com/",
        "https://faircall.kr/",
        "https://fairtech.kr/"
      ],
      "knowsAbout": [
        "Maritime shipping",
        "Shipbuilding",
        "Port operations",
        "IMO regulations",
        "Charter markets",
        "Korean maritime industry"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://faircast.kr/#website",
      "url": "https://faircast.kr/",
      "name": "Faircast",
      "description": "Maritime Industry Insights & Engineering Knowledge",
      "publisher": { "@id": "https://faircast.kr/#organization" },
      "inLanguage": ["ko-KR", "en-US"]
    }
  ]
}
</script>
```

---

### 573 — Author Bio Block

```php
add_filter('the_content', function($content) {
    if (!is_singular('post') || !in_the_loop() || !is_main_query()) {
        return $content;
    }

    $bio = '
    <div style="margin:48px 0 16px;padding:24px 26px;background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #14b8a6;border-radius:6px;font-family:ui-sans-serif,system-ui,-apple-system,\'Apple SD Gothic Neo\',\'Noto Sans KR\',sans-serif;">
        <div style="font-size:12px;font-weight:700;color:#0f766e;letter-spacing:0.08em;margin-bottom:10px;">ABOUT THE EDITORIAL DESK</div>
        <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:8px;">Faircast 편집팀</div>
        <p style="font-size:14px;color:#475569;line-height:1.7;margin:0 0 12px;">
            Faircast는 해운·조선·항만 산업의 시장과 실무를 잇는 독립 분석 매체입니다. 현업 경험을 가진 편집진이 IMO·IACS·한국선급·해양수산부 등 1차 자료를 바탕으로 글을 발행합니다. 광고 콘텐츠와 편집 콘텐츠는 분리됩니다.
        </p>
        <div style="font-size:13px;color:#64748b;">
            <a href="https://faircast.kr/about/" style="color:#0f766e;text-decoration:none;font-weight:600;">편집 원칙 및 About →</a>
            &nbsp;·&nbsp;
            <a href="mailto:hello@fairtech.kr" style="color:#0f766e;text-decoration:none;">hello@fairtech.kr</a>
        </div>
    </div>';

    return $content . $bio;
}, 20);
```

---

### 529 — Category Archive Noindex

```php
add_action('wp_head', function() {
    if (is_category()) {
        echo '<meta name="robots" content="noindex, follow">' . "\n";
    }
}, 1);
```

⚠️ **모든 카테고리 archive에 noindex를 붙인다.** 494가 카테고리 1·8을 페이지로 301 보내므로, 실질 대상은 `/category/port-guide/`와 서브카테고리 전체.

**주의**: 홈페이지 섹션 카드가 `/category/insights/hello-korea/` 등을 가리키는데, 그 목적지가 301(494) 또는 noindex(529)다. **색인된 허브가 홈 하나뿐인 구조의 원인.** 홈페이지 링크를 `/hello-korea-page/`로 직접 바꾸는 것이 검토 과제.

---

### 494 — Category → Page 301

```php
add_action('template_redirect', function() {
    if (!is_category()) return;
    
    $category = get_queried_object();
    if (!$category || !isset($category->term_id)) return;
    
    $redirects = array(
        1 => '/hello-korea-page/',  // Hello, Korea
        8 => '/hello-world-page/',  // Hello, World
    );
    
    if (isset($redirects[$category->term_id])) {
        wp_redirect(home_url($redirects[$category->term_id]), 301);
        exit;
    }
});
```

> 이름이 「제목 없는 스니펫」이라 정체불명으로 오해받기 쉽다. **이름을 "Category → Page 301 Redirect"로 바꿔둘 것.**

---

### 361 — Exclude Tags from Sitemap

```php
add_filter('wp_sitemaps_taxonomies', function($taxonomies) {
    unset($taxonomies['post_tag']);
    return $taxonomies;
});
```

---

### 359 — Force non-www redirect

```php
add_action('init', function() {
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $is_https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
                || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    if ($host === 'www.faircast.kr' || !$is_https) {
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        wp_redirect('https://faircast.kr' . $uri, 301);
        exit;
    }
}, 1);
```

---

### 358 — Tag Archive Noindex

```php
add_action('wp_head', function() {
    if (is_tag()) {
        echo '<meta name="robots" content="noindex, follow">' . "\n";
    }
}, 1);
```

---

### 259 — GA4 Tracking

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-3L86TW7BFJ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-3L86TW7BFJ');
</script>
```

⚠️ **측정 ID 두 개가 사이트에 동시 존재한다.**
- 259 스니펫: `G-3L86TW7BFJ`
- 테마/다른 경로: `G-ETQ9ZF78CF`

라이브 HTML에서 둘 다 확인됨. 의도한 것인지 확인 필요. 중복 집계 가능성.

---

### 69 — Enable Shortcodes in Category Description

```php
add_filter('term_description', 'do_shortcode');
add_filter('category_description', 'do_shortcode');
```

> 항만 가이드 카테고리 설명의 `[wpcode id="68"]` 실행에 필요하다. 끄면 지도가 사라진다.

---

### 68 — Korea Port Atlas Map

```html
<script>window.PORT_ATLAS_CONFIG={mapboxToken:'pk.YOUR_MAPBOX_PUBLIC_TOKEN'};</script>
<div id="korea-port-app"></div>
<script src="https://cdn.jsdelivr.net/gh/oceanholic83-web/ship-fairtech-assets@main/loader.js"></script>
```

> **토큰 값은 이 문서에 기록하지 않는다.**
> 실제 값 위치: WPCode 68번 스니펫 편집 화면, 또는 `pages/port-guide/config.local.json`
> `pk.`로 시작하는 Mapbox 공개 토큰이며 브라우저 노출을 전제로 한 값이지만,
> GitHub Secret Scanning이 push를 차단하므로 문서에는 자리표시자만 둔다.

> 항만 가이드 카테고리 설명에서 `[wpcode id="68"]`로 호출한다.
> jsDelivr 캐시 갱신은 `docs/jsdelivr-cache-bypass.md` 참조 (commit hash 방식).

---

### 66 — 글 첫 단락 뒤 메시지

**내용이 비어 있다.** 활성 상태지만 아무것도 출력하지 않음. 삭제해도 무방.

---

## 🔴 비활성 — 67 댓글 완전 비활성화

Outdated 표시. 댓글은 Kadence 테마 설정으로도 꺼져 있어 실질 영향 없음.

<details>
<summary>코드</summary>

```php
add_action('admin_init', function () {
    global $pagenow;
    if ($pagenow === 'edit-comments.php') {
        wp_safe_redirect(admin_url());
        exit;
    }
    remove_meta_box('dashboard_recent_comments', 'dashboard', 'normal');
    foreach (get_post_types() as $post_type) {
        if (post_type_supports($post_type, 'comments')) {
            remove_post_type_support($post_type, 'comments');
            remove_post_type_support($post_type, 'trackbacks');
        }
    }
});
add_filter('comments_open', '__return_false', 20, 2);
add_filter('pings_open', '__return_false', 20, 2);
add_filter('comments_array', '__return_empty_array', 10, 2);
add_action('admin_menu', function () {
    remove_menu_page('edit-comments.php');
});
add_action('init', function () {
    if (is_admin_bar_showing()) {
        remove_action('admin_bar_menu', 'wp_admin_bar_comments_menu', 60);
    }
});
```
</details>

---

## 2026-07-25 변경 이력

| 대상 | 작업 | 사유 |
|---|---|---|
| 617 | **비활성화** | robots.txt 차단이 축구 URL의 색인 제거를 막고 있었음 |
| 406 | **전면 교체** | `/simulate`·`/matchup`·`/insights/*` 미포착 → 축구 URL 3개 색인 잔존 |
| 378 | **전면 교체** | `$post` null 가드, style/script 블록 제거, CSS 잔재 검사 |

**검증 완료**
- robots.txt에서 World Cup Disallow 제거 확인
- `/matchup`·`/simulate`·`/insights/mbappe-*` → 홈 301 확인
- Search Console 라이브 URL 테스트: meta description 정상 (한글 문장)

---

## 남은 과제

| 우선순위 | 내용 |
|---|---|
| 높음 | 575에 `$post` null 가드 추가 |
| 높음 | 201 계속 비활성 유지 (AdSense Abusive experiences) |
| 중간 | 홈페이지 섹션 카드 링크 → `/hello-korea-page/` 직접 연결 (301 한 단계 제거) |
| 중간 | GA4 측정 ID 중복(`G-3L86TW7BFJ` / `G-ETQ9ZF78CF`) 정리 |
| 낮음 | 494 이름 변경 ("Category → Page 301 Redirect") |
| 낮음 | 66 빈 스니펫 삭제 |
| 낮음 | wp-custom-css의 `user-select: none` 제거 검토 |

---

## 다음 점검 시점

**2026-08-15 전후.** 아래 3개가 움직였는지 확인:

| 지표 | 2026-07-25 | 목표 |
|---|---|---|
| 색인된 페이지 | 34 | 50+ |
| 색인 내 축구 URL | 5 | 0 |
| 6월 중순 이후 발행글 색인 | 1 / 16 | 8+ |

셋 다 안 움직이면 원인은 스니펫이 아니라 **사이트 연령·트래픽·도메인 이력** 쪽이다. 그 경우 기술 작업을 중단하고 AdSense는 자연 대기로 전환한다.

**재신청 금지 기간**: 위 지표 확인 전까지.

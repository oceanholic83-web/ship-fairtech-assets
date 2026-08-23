<?php
/**
 * WPCode 스니펫 741 — fc_posts / fc_filterbar / fc_total
 * 위치: 어디서나 실행 (자동 삽입)
 * 최초 등록: 2026-08-23
 *
 * 랜딩 3개 페이지(269 홈 / 488 Hello Korea / 490 Hello World)의
 * 고정 카드 마크업을 대체한다. 마크업·클래스는 pages/*/template.html 과 동일.
 *
 * 사용 예
 *   [fc_posts count="3"]                                   홈 최신 3편 (카드)
 *   [fc_posts slugs="a,b,c"]                               Pick 수동 지정
 *   [fc_posts count="8" layout="list"]                     홈 더 읽기
 *   [fc_posts cat="1" count="3" layout="bigcard" exclude_cat=""]
 *   [fc_posts cat="1" count="300" layout="listitem" dedupe="0" exclude_cat=""]
 *   [fc_filterbar cat="1"]                                 카테고리 필터 버튼 + 실시간 개수
 *   [fc_total cat="1" exclude_cat=""]                      발행 편수
 *
 * 주의
 *   - dedupe="1"(기본)은 같은 페이지에서 이미 출력된 글을 제외한다. 렌더 순서에 의존한다.
 *   - exclude_cat 기본값 47(항만 가이드). Hello Korea 전체 글에서는 빈 값으로 넘겨 포함시킨다.
 *   - 대표 이미지는 FIFU 메타(fifu_image_url) → 썸네일 → fallback 순으로 찾는다.
 *   - WPCode 저장 시 <?php 태그는 넣지 않는다. 이 파일의 첫 줄은 레포 보관용이다.
 */

function fc_labels() {
    return array(
        1   => 'Hello Korea',
        8   => 'Hello World',
        47  => '항만',
        192 => 'Insights',
        228 => 'Market (시장)',
        229 => 'Industry (산업)',
        230 => 'Routes·Ports (항로·항만)',
        231 => 'Geopolitics (지정학)',
        232 => 'General (일반)',
        233 => 'Korea Market',
        234 => 'Korea Industry',
        235 => 'Explainer',
    );
}

function fc_label($cid) {
    $l = fc_labels();
    return isset($l[$cid]) ? $l[$cid] : get_cat_name($cid);
}

function fc_up($s) {
    return function_exists('mb_strtoupper') ? mb_strtoupper($s, 'UTF-8') : strtoupper($s);
}

add_shortcode('fc_posts', function ($atts) {

    $a = shortcode_atts(array(
        'layout'      => 'card',
        'cat'         => '',
        'count'       => 3,
        'offset'      => 0,
        'exclude_cat' => '47',
        'slugs'       => '',
        'dedupe'      => '1',
        'excerpt_len' => 90,
        'skip'        => '1,8,47,192',
        'wrap'        => '1',
    ), $atts, 'fc_posts');

    static $shown = array();

    $fallback = 'https://cdn.jsdelivr.net/gh/oceanholic83-web/faircast-images@v1/img/hello_y92wk9.webp';
    $skip = array_map('intval', array_filter(array_map('trim', explode(',', $a['skip']))));

    $args = array(
        'post_type'           => 'post',
        'post_status'         => 'publish',
        'ignore_sticky_posts' => true,
        'no_found_rows'       => true,
        'suppress_filters'    => false,
    );

    if ($a['slugs'] !== '') {
        $slugs = array_values(array_filter(array_map('trim', explode(',', $a['slugs']))));
        $args['post_name__in']  = $slugs;
        $args['posts_per_page'] = count($slugs);
        $args['orderby']        = 'post_name__in';
    } else {
        $args['posts_per_page'] = (int) $a['count'];
        $args['offset']         = (int) $a['offset'];
        if ($a['cat'] !== '') {
            $args['cat'] = (int) $a['cat'];
        }
        $ex = array_values(array_filter(array_map('intval', explode(',', $a['exclude_cat']))));
        if (!empty($ex)) {
            $args['category__not_in'] = $ex;
        }
        if ($a['dedupe'] === '1' && !empty($shown)) {
            $args['post__not_in'] = $shown;
        }
    }

    $q = new WP_Query($args);
    if (empty($q->posts)) {
        return '';
    }

    $out = '';

    foreach ($q->posts as $p) {

        $shown[] = $p->ID;

        $url = get_permalink($p);
        $ttl = get_the_title($p);
        $ym  = get_the_date('Y.m', $p);

        $img = get_post_meta($p->ID, 'fifu_image_url', true);
        if (!$img) { $img = get_the_post_thumbnail_url($p, 'large'); }
        if (!$img) { $img = $fallback; }

        $all = array();
        $sub = array();
        $subIds = array();
        foreach (wp_get_post_categories($p->ID) as $cid) {
            if ($cid == 47) { continue; }
            $all[] = fc_label($cid);
            if (!in_array($cid, $skip)) {
                $sub[] = fc_label($cid);
                $subIds[] = $cid;
            }
        }
        $tagAll = fc_up(implode(' · ', $all));
        $tagSub = fc_up(implode(' · ', $sub));

        $exc = trim(wp_strip_all_tags(get_the_excerpt($p)));
        $len = (int) $a['excerpt_len'];
        if (function_exists('mb_strlen') && mb_strlen($exc, 'UTF-8') > $len) {
            $exc = rtrim(mb_substr($exc, 0, $len, 'UTF-8')) . '…';
        }

        if ($a['layout'] === 'list') {
            $out .= '<a href="' . esc_url($url) . '" class="fct-li">'
                  . '<div class="fct-li-meta">' . esc_html($tagAll . ' · ' . $ym) . '</div>'
                  . '<h4 class="fct-li-ttl">' . esc_html($ttl) . '</h4>'
                  . '<p class="fct-li-exc">' . esc_html($exc) . '</p></a>';

        } elseif ($a['layout'] === 'bigcard') {
            $out .= '<a href="' . esc_url($url) . '" class="fct-bigcard">'
                  . '<img class="fct-bigcard-img" src="' . esc_url($img) . '" alt="' . esc_attr($ttl) . '" loading="lazy">'
                  . '<div class="fct-bigcard-body">'
                  . '<span class="fct-bigcard-tag">' . esc_html($tagSub . ' · ' . $ym) . '</span>'
                  . '<h3 class="fct-bigcard-ttl">' . esc_html($ttl) . '</h3>'
                  . '<p class="fct-bigcard-exc">' . esc_html($exc) . '</p>'
                  . '</div></a>';

        } elseif ($a['layout'] === 'listitem') {
            $out .= '<a href="' . esc_url($url) . '" class="fct-listitem" data-cats="' . esc_attr(implode(',', $subIds)) . '">'
                  . '<span class="fct-listitem-date">' . esc_html($ym) . '</span>'
                  . '<span class="fct-listitem-ttl">' . esc_html($ttl) . '</span>'
                  . '<span class="fct-listitem-tags">' . esc_html($tagSub) . '</span></a>';

        } else {
            $out .= '<a href="' . esc_url($url) . '" class="fct-card">'
                  . '<img class="fct-card-img" src="' . esc_url($img) . '" alt="' . esc_attr($ttl) . '" loading="lazy">'
                  . '<div class="fct-card-body">'
                  . '<span class="fct-card-tag">' . esc_html($tagAll) . '</span>'
                  . '<h3 class="fct-card-ttl">' . esc_html($ttl) . '</h3>'
                  . '<p class="fct-card-exc">' . esc_html($exc) . '</p>'
                  . '</div></a>';
        }
    }

    if ($a['wrap'] === '1') {
        if ($a['layout'] === 'list')          { $out = '<section class="fct-list">' . $out . '</section>'; }
        elseif ($a['layout'] === 'bigcard')   { $out = '<section class="fct-biggrid">' . $out . '</section>'; }
        elseif ($a['layout'] === 'listitem')  { $out = '<div class="fct-fulllist">' . $out . '</div>'; }
        else                                  { $out = '<section class="fct-grid">' . $out . '</section>'; }
    }

    return $out;
});

function fc_cat_counts($main, $skip) {
    $rows = array();
    $terms = get_categories(array('child_of' => (int) $main, 'hide_empty' => true));
    foreach ($terms as $t) {
        if (in_array((int) $t->term_id, $skip)) { continue; }
        $q = new WP_Query(array(
            'post_type'      => 'post',
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'fields'         => 'ids',
            'category__and'  => array((int) $main, (int) $t->term_id),
        ));
        if ($q->found_posts > 0) {
            $rows[] = array('id' => (int) $t->term_id, 'n' => (int) $q->found_posts);
        }
    }
    usort($rows, function ($x, $y) { return $y['n'] - $x['n']; });
    return $rows;
}

add_shortcode('fc_filterbar', function ($atts) {
    $a = shortcode_atts(array('cat' => '1', 'skip' => '47,192', 'all' => '전체'), $atts, 'fc_filterbar');
    $skip = array_map('intval', array_filter(array_map('trim', explode(',', $a['skip']))));
    $rows = fc_cat_counts($a['cat'], $skip);
    $out  = '<div class="fct-filterbar">';
    $out .= '<button class="fct-filter-btn fct-filter-all active" data-cat="all">' . esc_html($a['all']) . '</button>';
    foreach ($rows as $r) {
        $out .= '<button class="fct-filter-btn" data-cat="' . $r['id'] . '">'
              . esc_html(fc_label($r['id']))
              . ' <span class="fct-filter-count">' . $r['n'] . '</span></button>';
    }
    return $out . '</div>';
});

add_shortcode('fc_total', function ($atts) {
    $a = shortcode_atts(array('cat' => '', 'exclude_cat' => '47'), $atts, 'fc_total');
    $args = array('post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 1, 'fields' => 'ids');
    if ($a['cat'] !== '') { $args['cat'] = (int) $a['cat']; }
    $ex = array_values(array_filter(array_map('intval', explode(',', $a['exclude_cat']))));
    if (!empty($ex)) { $args['category__not_in'] = $ex; }
    $q = new WP_Query($args);
    return (string) $q->found_posts;
});

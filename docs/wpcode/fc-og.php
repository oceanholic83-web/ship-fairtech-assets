<?php
/**
 * fc-og — OpenGraph / Twitter 메타 보강
 *
 * 배경: Kadence 는 og:description 만, FIFU 는 og:image + twitter:* 만 출력한다.
 *       og:title / og:url / og:type / og:site_name / og:locale 이 전부 빠져 있어
 *       링크 공유 시 제목 없는 회색 박스로 뜬다.
 *
 * 원칙: 글마다 사람이 채우는 칸을 만들지 않는다.
 *       제목·URL·요약·이미지는 이미 워드프레스 안에 있다. 거기서 파생시킨다.
 *
 * 중복 방지: og:description(Kadence) 과 og:image·twitter:*(FIFU) 는 건드리지 않는다.
 *            FIFU 가 이미지를 낼 수 없는 경우에만 기본 이미지를 대신 낸다.
 *
 * WPCode: PHP 스니펫 / 어디서나 실행
 * 사본: docs/wpcode/fc-og.php
 */

if ( ! defined( 'ABSPATH' ) ) { return; }

if ( ! defined( 'FC_OG_DEFAULT_IMAGE' ) ) { define( 'FC_OG_DEFAULT_IMAGE', 'https://cdn.jsdelivr.net/gh/oceanholic83-web/faircast-images@v4/img/hello_y92wk9.webp' ); }

/**
 * FIFU 는 fifu_image_url / fifu_image_alt 를 post 타입에만 REST 등록한다.
 * 그래서 page 에 REST 로 쓰면 200 이 돌아오지만 값은 조용히 버려진다.
 * (2026-08-24 실측 — 랜딩 4개 페이지에 써도 저장되지 않았다.)
 * 페이지에도 등록해 두면 글과 같은 방식으로 자동 설정할 수 있다.
 */
add_action( 'init', function () {
	foreach ( array( 'fifu_image_url', 'fifu_image_alt' ) as $key ) {
		register_post_meta( 'page', $key, array(
			'type'          => 'string',
			'single'        => true,
			'show_in_rest'  => true,
			'auth_callback' => function () { return current_user_can( 'edit_pages' ); },
		) );
	}
}, 20 );

/**
 * FIFU 가 이 화면에서 og:image 를 낼 것인가.
 * FIFU 는 단일 글/페이지에 fifu_image_url 메타가 있을 때만 출력한다.
 */
if ( ! function_exists( 'fc_og_fifu_url' ) ) {
function fc_og_fifu_url() {
	if ( ! is_singular() ) { return ''; }
	return (string) get_post_meta( get_queried_object_id(), 'fifu_image_url', true );
}
}

if ( ! function_exists( 'fc_og_fifu_will_output' ) ) {
function fc_og_fifu_will_output() {
	// 정적 대문에서는 FIFU 가 출력하지 않는다 (2026-08-24 실측). 직접 낸다.
	if ( ! is_singular() || is_front_page() ) { return false; }
	return ! empty( fc_og_fifu_url() );
}

}

if ( ! function_exists( 'fc_og_tag' ) ) {
function fc_og_tag( $prop, $val, $attr = 'property' ) {
	if ( $val === '' || $val === null ) { return; }
	printf(
		'<meta %s="%s" content="%s" />' . "\n",
		esc_attr( $attr ),
		esc_attr( $prop ),
		esc_attr( $val )
	);
}

}

if ( ! function_exists( 'fc_og_head' ) ) {
function fc_og_head() {
	if ( is_404() ) { return; }

	// --- URL: canonical 과 반드시 같은 값을 쓴다 -----------------------------
	if ( is_front_page() || is_home() ) {
		$url  = home_url( '/' );
		$type = 'website';
	} elseif ( is_singular() ) {
		$url  = get_permalink();
		$type = is_page() ? 'website' : 'article';
	} else {
		// 아카이브: 워드프레스 canonical 과 같게 뒤 슬래시를 붙인다
		$req  = isset( $GLOBALS['wp']->request ) ? $GLOBALS['wp']->request : '';
		$url  = $req ? home_url( user_trailingslashit( $req ) ) : home_url( '/' );
		$type = 'website';
	}

	// --- 제목: 사이트명 꼬리표를 뗀 순수 제목 --------------------------------
	if ( is_front_page() || is_home() ) {
		$title = get_bloginfo( 'name' );
	} elseif ( is_singular() ) {
		$title = get_the_title();
	} elseif ( is_category() || is_tag() || is_tax() ) {
		$title = single_term_title( '', false );
	} else {
		$title = wp_get_document_title();
	}

	echo "\n<!-- fc-og -->\n";

	fc_og_tag( 'og:type', $type );
	fc_og_tag( 'og:title', $title );
	fc_og_tag( 'og:url', $url );
	fc_og_tag( 'og:site_name', get_bloginfo( 'name' ) );
	fc_og_tag( 'og:locale', 'ko_KR' );

	// --- 이미지: FIFU 가 못 낼 때만 대신 낸다 -------------------------------
	if ( ! fc_og_fifu_will_output() ) {
		$img = fc_og_fifu_url();
		if ( ! $img && is_singular() && has_post_thumbnail() ) {
			$img = get_the_post_thumbnail_url( null, 'full' );
		}
		if ( ! $img ) { $img = FC_OG_DEFAULT_IMAGE; }

		fc_og_tag( 'og:image', $img );
		fc_og_tag( 'twitter:card', 'summary_large_image', 'name' );
		fc_og_tag( 'twitter:title', $title, 'name' );
		fc_og_tag( 'twitter:image', $img, 'name' );
	}

	echo "<!-- /fc-og -->\n";
}
}

add_action( 'wp_head', 'fc_og_head', 4 );

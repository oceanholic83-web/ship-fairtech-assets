# Order: robots.txt에 World Cup URL 크롤 차단 추가

**목표:** faircast.kr의 robots.txt에 World Cup 잔재 URL 경로를 크롤 차단으로 추가한다.

**배경:** 
- faircast.kr Google Search Console에서 크롤링됨-색인안됨 상태의 URL 중 40개 이상이 World Cup 잔재 URL (match/, simulate/, insights/, tournament, rankings, bracket)
- Google이 이 URL들을 계속 크롤하면서 사이트 정체성 신호 훼손
- robots.txt로 크롤 자체를 차단하여 잔재 URL을 완전 제거

## Step 1: 현재 robots.txt 확인

WordPress admin에서 robots.txt 확인:
1. faircast.kr/wp-admin 접속
2. https://faircast.kr/robots.txt 직접 브라우저 접속
3. 현재 내용 캡처

## Step 2: WPCode 스니펫으로 robots.txt 확장

**WPCode 새 스니펫 추가:**

- 제목: "robots.txt - World Cup 크롤 차단"
- 코드 유형: PHP Snippet
- 위치: Frontend Only
- 활성화

**코드:**

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

## Step 3: 검증

1. https://faircast.kr/robots.txt 브라우저 접속
2. 위 Disallow 규칙 7개가 표시되는지 확인
3. 캡처

## 완료 확인

- [ ] WPCode 스니펫 활성화
- [ ] /robots.txt에 새 Disallow 규칙 7개 확인
- [ ] 홈페이지·발행글 정상 접근 확인 (다른 크롤 문제 없음)

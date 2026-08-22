# audit-links.ps1 - internal link + Cloudinary reference audit (read-only)
# ASCII only. PowerShell 5.1 reads .ps1 as ANSI; non-ASCII here breaks parsing.
# Run: powershell -ExecutionPolicy Bypass -File scripts\audit-links.ps1

[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
$base = 'https://faircast.kr'
$out  = Join-Path $PSScriptRoot '..\audit'
New-Item -ItemType Directory -Force -Path $out | Out-Null

function Get-All($type) {
  $acc = @(); $page = 1
  while ($true) {
    $url = "$base/wp-json/wp/v2/$type" + "?per_page=100&page=$page&_fields=id,slug,link,title,content,status"
    $raw = curl.exe -s $url
    if (-not $raw) { break }
    if ($raw -match 'rest_post_invalid_page_number') { break }
    $j = $raw | ConvertFrom-Json
    if ($null -eq $j -or $j.Count -eq 0) { break }
    $acc += $j; $page++
    if ($j.Count -lt 100) { break }
  }
  return $acc
}

Write-Host "[1/4] Fetching REST..." -ForegroundColor Cyan
$posts = Get-All 'posts'
$pages = Get-All 'pages'
Write-Host ("  posts={0}  pages={1}" -f $posts.Count, $pages.Count)

$valid = New-Object 'System.Collections.Generic.HashSet[string]'
foreach ($p in ($posts + $pages)) {
  [void]$valid.Add(($p.link -replace '^https?://[^/]+','').TrimEnd('/'))
}
Write-Host ("  valid paths={0}" -f $valid.Count)

Write-Host "[2/4] Extracting internal links..." -ForegroundColor Cyan
$links = @()
foreach ($p in ($posts + $pages)) {
  $html = $p.content.rendered
  if (-not $html) { continue }
  foreach ($m in [regex]::Matches($html, 'href="([^"]+)"')) {
    $href = $m.Groups[1].Value
    if ($href -match '^(#|mailto:|tel:|javascript:)') { continue }
    if (-not ($href -match '^/' -or $href -match '^https?://(www\.)?faircast\.kr')) { continue }
    $path = ($href -replace '^https?://[^/]+','') -replace '[?#].*$',''
    $path = $path.TrimEnd('/')
    if ($path -eq '') { continue }
    if ($href -match '^http://') { $proto = 'insecure' }
    elseif ($href -match '^/')   { $proto = 'relative' }
    else                         { $proto = 'https' }
    $links += [pscustomobject]@{
      src_id   = $p.id
      src_slug = $p.slug
      href     = $href
      path     = $path
      exists   = $valid.Contains($path)
      is_cat   = [bool]($path -match '^/category/')
      protocol = $proto
    }
  }
}
$dead = @($links | Where-Object { -not $_.exists })
Write-Host ("  internal links={0}  dead={1}" -f $links.Count, $dead.Count) -ForegroundColor $(if ($dead.Count) {'Yellow'} else {'Green'})

Write-Host "[3/4] Checking HTTP status of dead targets..." -ForegroundColor Cyan
$targets = @($dead | Select-Object -Expand path -Unique | Sort-Object)
$status = @()
foreach ($t in $targets) {
  $code = curl.exe -s -o NUL -w "%{http_code}" "$base$t/?cb=$(Get-Random)"
  $refs = @($dead | Where-Object { $_.path -eq $t })
  $status += [pscustomobject]@{
    path      = $t
    http      = $code
    ref_count = $refs.Count
    referrers = (($refs | Select-Object -Expand src_slug -Unique) -join ', ')
  }
  Write-Host ("  {0}  {1}" -f $code, $t) -ForegroundColor $(if ($code -eq '200') {'DarkGray'} else {'Red'})
}

Write-Host "[4/4] Counting Cloudinary references..." -ForegroundColor Cyan
$cld = @()
foreach ($p in ($posts + $pages)) {
  foreach ($m in [regex]::Matches($p.content.rendered, 'https?://res\.cloudinary\.com/[^"''\s\)<]+')) {
    $cld += [pscustomobject]@{ src_id = $p.id; src_slug = $p.slug; url = $m.Value }
  }
}
$cldUnique = @($cld | Select-Object -Expand url -Unique)
Write-Host ("  cloudinary refs={0}  unique={1}" -f $cld.Count, $cldUnique.Count)

$catLinks  = @($links | Where-Object { $_.is_cat })
$httpLinks = @($links | Where-Object { $_.protocol -eq 'insecure' })

$report = [ordered]@{
  generated_at      = (Get-Date -Format 'yyyy-MM-dd HH:mm')
  posts             = $posts.Count
  pages             = $pages.Count
  internal_links    = $links.Count
  dead_links        = $dead.Count
  dead_targets      = $status
  category_links    = ($catLinks  | Select-Object src_slug, path)
  insecure_links    = ($httpLinks | Select-Object src_slug, href)
  cloudinary_refs   = $cld.Count
  cloudinary_unique = $cldUnique.Count
  slugs             = ($posts | Select-Object id, slug)
}
$report | ConvertTo-Json -Depth 6 | Out-File "$out\link-audit.json" -Encoding utf8
$cld    | ConvertTo-Json -Depth 3 | Out-File "$out\cloudinary-refs.json" -Encoding utf8
$dead   | Export-Csv "$out\dead-links.csv" -NoTypeInformation -Encoding UTF8

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Green
Write-Host ("posts {0} / pages {1} / internal links {2}" -f $posts.Count, $pages.Count, $links.Count)
Write-Host ("dead links {0} (unique targets {1})" -f $dead.Count, $targets.Count)
Write-Host ("category/ links {0}  <- 301 via snippet 494" -f $catLinks.Count)
Write-Host ("insecure http:// links {0}" -f $httpLinks.Count)
Write-Host ("cloudinary refs {0} / unique {1}" -f $cld.Count, $cldUnique.Count)
Write-Host ""
Write-Host "Output: audit\link-audit.json, dead-links.csv, cloudinary-refs.json"

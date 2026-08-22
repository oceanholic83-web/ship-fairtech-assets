# audit-cloudinary.ps1 - full Cloudinary asset inventory (read-only)
# ASCII only. PowerShell 5.1 reads .ps1 as ANSI; non-ASCII breaks parsing.
# Body images come from REST content. Featured images (FIFU) live in postmeta,
# so they are scraped from each live page's og:image.
# Run: powershell -ExecutionPolicy Bypass -File scripts\audit-cloudinary.ps1
# Takes ~2-4 minutes (one HTTP request per post/page).

[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
$base = 'https://faircast.kr'
$out  = Join-Path $PSScriptRoot '..\audit'
New-Item -ItemType Directory -Force -Path $out | Out-Null

function Get-All($type) {
  $acc = @(); $page = 1
  while ($true) {
    $url = "$base/wp-json/wp/v2/$type" + "?per_page=100&page=$page&_fields=id,slug,link,content,status"
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

function Get-PublicId($url) {
  # strip query, take last path segment, drop extension and Cloudinary version prefix
  $u = ($url -replace '[?#].*$','')
  $leaf = ($u -split '/')[-1]
  return ($leaf -replace '\.(png|jpe?g|webp|gif|svg|avif)$','')
}

Write-Host "[1/4] Fetching REST..." -ForegroundColor Cyan
$posts = Get-All 'posts'
$pages = Get-All 'pages'
$all   = @($posts + $pages)
Write-Host ("  posts={0}  pages={1}" -f $posts.Count, $pages.Count)

Write-Host "[2/4] Body images from REST content..." -ForegroundColor Cyan
$body = @()
foreach ($p in $all) {
  foreach ($m in [regex]::Matches($p.content.rendered, 'https?://res\.cloudinary\.com/[^"''\s\)<]+')) {
    $body += [pscustomobject]@{ kind='body'; id=$p.id; slug=$p.slug; url=$m.Value; public_id=(Get-PublicId $m.Value) }
  }
}
Write-Host ("  body refs={0}  unique={1}" -f $body.Count, (@($body | Select-Object -Expand public_id -Unique)).Count)

Write-Host "[3/4] Featured images (FIFU) from live og:image..." -ForegroundColor Cyan
$feat = @(); $missing = @(); $migrated = @(); $i = 0
foreach ($p in $all) {
  $i++
  if ($i % 10 -eq 0) { Write-Host ("  ...{0}/{1}" -f $i, $all.Count) -ForegroundColor DarkGray }
  $html = curl.exe -s "$($p.link)?cb=$(Get-Random)"
  $m = [regex]::Match($html, '<meta[^>]+property="og:image"[^>]+content="([^"]+)"')
  if (-not $m.Success) { $m = [regex]::Match($html, '<meta[^>]+content="([^"]+)"[^>]+property="og:image"') }
  if ($m.Success) {
    $u = $m.Groups[1].Value
    if ($u -match 'res\.cloudinary\.com') {
      $feat += [pscustomobject]@{ kind='featured'; id=$p.id; slug=$p.slug; url=$u; public_id=(Get-PublicId $u) }
    } else {
      $migrated += [pscustomobject]@{ id=$p.id; slug=$p.slug; og=$u }
    }
  } else {
    $missing += [pscustomobject]@{ id=$p.id; slug=$p.slug; og='(none)' }
  }
}
Write-Host ("  featured on Cloudinary={0}  already migrated={1}  no featured image={2}" -f $feat.Count, $migrated.Count, $missing.Count) -ForegroundColor $(if ($missing.Count) {'Yellow'} else {'Green'})

Write-Host "[4/4] Checking each unique asset is alive..." -ForegroundColor Cyan
$refs = @($body + $feat)
$uniq = @($refs | Group-Object public_id | ForEach-Object {
  [pscustomobject]@{ public_id=$_.Name; ref_count=$_.Count; url=$_.Group[0].url; kinds=(($_.Group | Select-Object -Expand kind -Unique) -join '+') }
})
$dead = @()
foreach ($a in $uniq) {
  $code = curl.exe -s -o NUL -w "%{http_code}" $a.url
  if ($code -ne '200') {
    $dead += [pscustomobject]@{ public_id=$a.public_id; http=$code; ref_count=$a.ref_count; url=$a.url }
    Write-Host ("  {0}  {1}" -f $code, $a.public_id) -ForegroundColor Red
  }
}
Write-Host ("  unique assets={0}  dead={1}" -f $uniq.Count, $dead.Count)

$report = [ordered]@{
  generated_at      = (Get-Date -Format 'yyyy-MM-dd HH:mm')
  posts             = $posts.Count
  pages             = $pages.Count
  body_refs         = $body.Count
  featured_refs     = $feat.Count
  total_refs        = $refs.Count
  unique_assets     = $uniq.Count
  dead_assets       = $dead
  migrated_featured = $migrated
  missing_featured  = $missing
  assets            = $uniq
}
$report | ConvertTo-Json -Depth 6 | Out-File "$out\cloudinary-inventory.json" -Encoding utf8
$uniq   | Export-Csv "$out\cloudinary-assets.csv" -NoTypeInformation -Encoding UTF8

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Green
Write-Host ("body refs      {0}" -f $body.Count)
Write-Host ("featured refs  {0}" -f $feat.Count)
Write-Host ("featured image already migrated (non-Cloudinary)  {0}" -f $migrated.Count)
Write-Host ("no featured image at all                       {0}" -f $missing.Count)
Write-Host ("UNIQUE ASSETS REFERENCED BY faircast.kr          {0}" -f $uniq.Count)
Write-Host ("dead assets (non-200)                            {0}" -f $dead.Count)
Write-Host ""
Write-Host "Output: audit\cloudinary-inventory.json, cloudinary-assets.csv"

# download-cloudinary.ps1 - download every Cloudinary asset faircast.kr references
# ASCII only. Reads audit\cloudinary-inventory.json (run audit-cloudinary.ps1 first).
# Downloads ORIGINALS (transformation params stripped), skips files already present.
# No API key needed - these are public delivery URLs.
# Run: powershell -ExecutionPolicy Bypass -File scripts\download-cloudinary.ps1

[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'
$root = Join-Path $PSScriptRoot '..'
$inv  = Join-Path $root 'audit\cloudinary-inventory.json'
$dest = Join-Path $root 'cloudinary-export-faircast'

if (-not (Test-Path $inv)) { Write-Host "Run audit-cloudinary.ps1 first." -ForegroundColor Red; exit 1 }
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$data   = Get-Content $inv -Raw -Encoding UTF8 | ConvertFrom-Json
$assets = $data.assets
Write-Host ("Assets to fetch: {0}" -f $assets.Count) -ForegroundColor Cyan

function Get-OriginalUrl($url) {
  # https://res.cloudinary.com/<cloud>/image/upload/<transforms...>/v123456/name.png
  # -> drop everything between /upload/ and /v<digits>/
  return ($url -replace '(/image/upload/).*?(/v\d+/)', '$1$2')
}

$manifest = @(); $ok = 0; $fail = 0; $skip = 0; $i = 0
foreach ($a in $assets) {
  $i++
  $src  = Get-OriginalUrl $a.url
  $leaf = ($src -split '/')[-1]
  # decode percent-encoded (Korean) filenames so the local file is readable
  $name = [System.Uri]::UnescapeDataString($leaf)
  $name = ($name -replace '[\\/:*?"<>|]', '_')
  $path = Join-Path $dest $name

  if (Test-Path $path) {
    $skip++
    $manifest += [pscustomobject]@{ public_id=$a.public_id; file=$name; url=$src; bytes=(Get-Item $path).Length; refs=$a.ref_count; kinds=$a.kinds; status='skip' }
    continue
  }
  try {
    curl.exe -s -f -o $path $src
    if ((Test-Path $path) -and (Get-Item $path).Length -gt 0) {
      $ok++
      $manifest += [pscustomobject]@{ public_id=$a.public_id; file=$name; url=$src; bytes=(Get-Item $path).Length; refs=$a.ref_count; kinds=$a.kinds; status='ok' }
    } else {
      $fail++
      if (Test-Path $path) { Remove-Item $path -Force }
      $manifest += [pscustomobject]@{ public_id=$a.public_id; file=$name; url=$src; bytes=0; refs=$a.ref_count; kinds=$a.kinds; status='FAIL' }
      Write-Host ("  FAIL {0}" -f $a.public_id) -ForegroundColor Red
    }
  } catch {
    $fail++
    $manifest += [pscustomobject]@{ public_id=$a.public_id; file=$name; url=$src; bytes=0; refs=$a.ref_count; kinds=$a.kinds; status='FAIL' }
    Write-Host ("  FAIL {0}" -f $a.public_id) -ForegroundColor Red
  }
  if ($i % 20 -eq 0) { Write-Host ("  ...{0}/{1}" -f $i, $assets.Count) -ForegroundColor DarkGray }
}

$total = ($manifest | Measure-Object bytes -Sum).Sum
$out = [ordered]@{
  generated_at = (Get-Date -Format 'yyyy-MM-dd HH:mm')
  source       = 'faircast.kr referenced assets only (not the full Cloudinary account)'
  count        = $manifest.Count
  downloaded   = $ok
  skipped      = $skip
  failed       = $fail
  total_bytes  = $total
  files        = $manifest
}
$out | ConvertTo-Json -Depth 5 | Out-File (Join-Path $dest '_manifest-faircast.json') -Encoding utf8

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Green
Write-Host ("downloaded {0} / skipped {1} / failed {2}" -f $ok, $skip, $fail)
Write-Host ("total size  {0:N1} MB" -f ($total/1MB))
Write-Host ("folder      cloudinary-export-faircast\")
Write-Host ""
Write-Host "NOTE: this covers only what faircast.kr references." -ForegroundColor Yellow
Write-Host "The full Cloudinary account holds more (fairwayeta + unused). For a complete" -ForegroundColor Yellow
Write-Host "account backup use the old PC's cloudinary-export\ folder or the Cloudinary console." -ForegroundColor Yellow

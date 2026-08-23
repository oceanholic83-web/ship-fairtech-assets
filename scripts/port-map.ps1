# port-map.ps1 - fairwayeta -> faircast porting ledger
# ASCII only (PowerShell 5.1 reads .ps1 as ANSI).
#
# WHAT IT DOES
#   1. Reads fairwayeta article slugs from the sibling repo's _articles/*.tsx
#   2. Reads faircast published slugs from the live REST API
#   3. Reads claude\PORT_MAP.tsv if it exists (this file is the SOURCE OF TRUTH)
#   4. Appends any NEW fairwayeta slug as status=WAIT
#   5. Verifies every DONE row points at a faircast slug that actually exists
#   6. Prints the WAIT list, newest first
#
# IT NEVER GUESSES. The "hint" column is a keyword-overlap suggestion only,
# written once for a new row so a human can fill the ledger faster.
# Nothing is ever auto-marked DONE.
#
# Run:  powershell -ExecutionPolicy Bypass -File scripts\port-map.ps1
# Override the fairwayeta path:
#       powershell -ExecutionPolicy Bypass -File scripts\port-map.ps1 -FwRepo "D:\path\to\ship-eta-calculator"

param(
  [string]$FwRepo = "$PSScriptRoot\..\..\ship-eta-calculator"
)

[Console]::OutputEncoding = [Text.Encoding]::UTF8
$ErrorActionPreference = 'Stop'

$root    = Join-Path $PSScriptRoot '..'
$mapFile = Join-Path $root 'claude\PORT_MAP.tsv'
$fwDir   = Join-Path $FwRepo 'src\app\insights\[slug]\_articles'
$fwMeta  = Join-Path $FwRepo 'src\app\insights\_lib\articles.ts'

if (-not (Test-Path -LiteralPath $fwDir)) {
  Write-Host "fairwayeta _articles not found:" -ForegroundColor Red
  Write-Host "  $fwDir"
  Write-Host "Pass -FwRepo with the correct path."
  exit 1
}

# ---- 1. fairwayeta slugs (+ date/category from articles.ts when available) ----
$fw = @{}
Get-ChildItem -LiteralPath $fwDir -Filter *.tsx | ForEach-Object {
  $fw[$_.BaseName] = [pscustomobject]@{ slug = $_.BaseName; date = ''; cat = '' }
}
if (Test-Path -LiteralPath $fwMeta) {
  $meta = Get-Content -LiteralPath $fwMeta -Raw -Encoding UTF8
  foreach ($m in [regex]::Matches($meta, "slug:\s*['`"]([^'`"]+)['`"]")) {
    $s = $m.Groups[1].Value
    if (-not $fw.ContainsKey($s)) { continue }
    $seg = $meta.Substring($m.Index, [Math]::Min(900, $meta.Length - $m.Index))
    $d = [regex]::Match($seg, "date:\s*['`"]([\d-]+)['`"]")
    $c = [regex]::Match($seg, "category:\s*['`"]([^'`"]+)['`"]")
    if ($d.Success) { $fw[$s].date = $d.Groups[1].Value }
    if ($c.Success) { $fw[$s].cat  = $c.Groups[1].Value }
  }
}
Write-Host ("fairwayeta articles : {0}" -f $fw.Count) -ForegroundColor Cyan

# ---- 2. faircast published slugs ----
$fcSlugs = @()
$page = 1
while ($true) {
  $raw = curl.exe -s "https://faircast.kr/wp-json/wp/v2/posts?per_page=100&page=$page&_fields=slug"
  if (-not $raw -or $raw -match 'rest_post_invalid_page_number') { break }
  $j = $raw | ConvertFrom-Json
  if ($null -eq $j -or $j.Count -eq 0) { break }
  $fcSlugs += ($j | Select-Object -Expand slug)
  if ($j.Count -lt 100) { break }
  $page++
}
$fcSet = New-Object 'System.Collections.Generic.HashSet[string]'
foreach ($s in $fcSlugs) { [void]$fcSet.Add($s) }
Write-Host ("faircast published  : {0}" -f $fcSlugs.Count) -ForegroundColor Cyan

# ---- 3. existing ledger ----
$rows = @()
$known = New-Object 'System.Collections.Generic.HashSet[string]'
if (Test-Path -LiteralPath $mapFile) {
  Get-Content -LiteralPath $mapFile -Encoding UTF8 | Select-Object -Skip 1 | ForEach-Object {
    if ($_.Trim() -eq '') { return }
    $p = $_ -split "`t"
    while ($p.Count -lt 6) { $p += '' }
    $rows += [pscustomobject]@{
      fw_slug = $p[0]; fw_date = $p[1]; status = $p[2]
      fc_slug = $p[3]; hint = $p[4]; note = $p[5]
    }
    [void]$known.Add($p[0])
  }
}

# ---- 4. suggestion for new rows only (labelled, never applied) ----
$stop = @('the','and','for','korea','explained','explainer','what','why','how','you','not','its',
          'with','shipping','ship','ships','that','dont','doesnt','isnt','until','your','from',
          'into','may','july','june','2026','2025','guide','deep','dive','are','was','all','new')
function Tokens($s) {
  ($s.ToLower() -split '-') | Where-Object { $_.Length -gt 2 -and $stop -notcontains $_ }
}
$fcTok = @{}
foreach ($s in $fcSlugs) { $fcTok[$s] = @(Tokens $s) }

function Suggest($fwSlug) {
  $a = @(Tokens $fwSlug)
  if ($a.Count -eq 0) { return '' }
  $best = 0.0; $bestSlug = ''
  foreach ($s in $fcSlugs) {
    $b = $fcTok[$s]
    if ($b.Count -eq 0) { continue }
    $n = 0
    foreach ($w in $a) { if ($b -contains $w) { $n++ } }
    $den = [Math]::Min($a.Count, $b.Count)
    if ($den -eq 0) { continue }
    $sc = $n / $den
    if ($sc -gt $best) { $best = $sc; $bestSlug = $s }
  }
  if ($best -lt 0.34) { return '' }
  return ("{0}({1:N2})" -f $bestSlug, $best)
}

$added = 0
foreach ($k in ($fw.Keys | Sort-Object)) {
  if ($known.Contains($k)) { continue }
  $rows += [pscustomobject]@{
    fw_slug = $k
    fw_date = $fw[$k].date
    status  = 'WAIT'
    fc_slug = ''
    hint    = (Suggest $k)
    note    = $fw[$k].cat
  }
  $added++
}

# ---- 5. integrity check ----
$bad = @()
foreach ($r in $rows) {
  if ($r.status -eq 'DONE') {
    if ($r.fc_slug -eq '' -or -not $fcSet.Contains($r.fc_slug)) {
      $bad += $r
    }
  }
}

# ---- write ledger back ----
$out = @("fw_slug`tfw_date`tstatus`tfc_slug`thint`tnote")
$rows | Sort-Object @{e={$_.fw_date}; Descending=$true}, fw_slug | ForEach-Object {
  $out += ($_.fw_slug + "`t" + $_.fw_date + "`t" + $_.status + "`t" + $_.fc_slug + "`t" + $_.hint + "`t" + $_.note)
}
New-Item -ItemType Directory -Force -Path (Split-Path $mapFile) | Out-Null
$out | Out-File -LiteralPath $mapFile -Encoding utf8

# ---- report ----
$byStatus = $rows | Group-Object status | ForEach-Object { "{0}={1}" -f $_.Name, $_.Count }
Write-Host ""
Write-Host "=== LEDGER ===" -ForegroundColor Green
Write-Host ("rows {0}   new {1}   [{2}]" -f $rows.Count, $added, ($byStatus -join '  '))

if ($bad.Count) {
  Write-Host ""
  Write-Host ("DONE rows pointing at a missing faircast slug: {0}" -f $bad.Count) -ForegroundColor Red
  $bad | ForEach-Object { Write-Host ("  {0}  ->  {1}" -f $_.fw_slug, $_.fc_slug) -ForegroundColor Red }
}

$wait = $rows | Where-Object { $_.status -eq 'WAIT' } | Sort-Object @{e={$_.fw_date}; Descending=$true}
Write-Host ""
Write-Host ("=== WAIT ({0}) - newest first ===" -f $wait.Count) -ForegroundColor Yellow
$wait | ForEach-Object {
  $d = if ($_.fw_date) { $_.fw_date } else { '          ' }
  Write-Host ("  {0}  {1}" -f $d, $_.fw_slug)
  if ($_.hint) { Write-Host ("              hint: {0}" -f $_.hint) -ForegroundColor DarkGray }
}

Write-Host ""
Write-Host "Ledger: claude\PORT_MAP.tsv"
Write-Host "Status values: DONE / WAIT / SKIP / HOLD"
Write-Host "  DONE = ported and published (fc_slug required)"
Write-Host "  SKIP = not for Korean readers - decide once, it leaves the WAIT list for good"
Write-Host "The hint column is a SUGGESTION ONLY. Nothing is auto-marked DONE."

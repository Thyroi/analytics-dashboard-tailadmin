Write-Host "🔧 Corrigiendo imports restantes..." -ForegroundColor Yellow

$importMappings = @{
    '@/lib/utils/datetime'           = '@/lib/utils/time/datetime'
    '@/lib/utils/ga'                 = '@/lib/utils/analytics/ga'
    '@/lib/utils/ga4Requests'        = '@/lib/utils/analytics/ga4Requests'
    '@/lib/utils/granularityMapping' = '@/lib/utils/data/granularityMapping'
    '@/lib/utils/granularityRanges'  = '@/lib/utils/time/granularityRanges'
    '@/lib/utils/pathMatching'       = '@/lib/utils/routing/pathMatching'
    '@/lib/utils/seriesAndDonuts'    = '@/lib/utils/data/seriesAndDonuts'
    '@/lib/utils/timeWindows'        = '@/lib/utils/time/timeWindows'
    '@/lib/utils/url'                = '@/lib/utils/routing/url'
}

$allFiles = Get-ChildItem -Path "." -Recurse -Include "*.ts", "*.tsx" | Where-Object { $_.FullName -notmatch "node_modules" }

$totalReplacements = 0

foreach ($file in $allFiles) {
    $content = Get-Content -Path $file.FullName -Raw
    if (-not $content) { continue }

    $modified = $false
    foreach ($oldPath in $importMappings.Keys) {
        $newPath = $importMappings[$oldPath]
        if ($content -match [regex]::Escape($oldPath)) {
            $content = $content -replace [regex]::Escape($oldPath), $newPath
            $modified = $true
            Write-Host "    📝 $($file.Name): $oldPath -> $newPath" -ForegroundColor Green
            $totalReplacements++
        }
    }

    if ($modified) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
    }
}

Write-Host "✅ Reemplazos totales: $totalReplacements" -ForegroundColor Green

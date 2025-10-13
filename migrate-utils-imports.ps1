# Script de migración automática de imports
# Actualiza todas las importaciones de la reorganización de utils

# Mapeo de archivos antiguos a nuevos paths
$importMappings = @{
    "@/lib/utils/datetime" = "@/lib/utils/time/datetime"
    "@/lib/utils/timeWindows" = "@/lib/utils/time/timeWindows"
    "@/lib/utils/timeAxis" = "@/lib/utils/time/timeAxis"
    "@/lib/utils/timeAxisChatbot" = "@/lib/utils/time/timeAxisChatbot"
    "@/lib/utils/granularityRanges" = "@/lib/utils/time/granularityRanges"
    "@/lib/utils/dateRangeWindow" = "@/lib/utils/time/dateRangeWindow"

    "@/lib/utils/ga" = "@/lib/utils/analytics/ga"
    "@/lib/utils/ga4" = "@/lib/utils/analytics/ga4"
    "@/lib/utils/ga4Requests" = "@/lib/utils/analytics/ga4Requests"
    "@/lib/utils/ga4-error-handler" = "@/lib/utils/analytics/error-handler"
    "@/lib/utils/analytics-queries" = "@/lib/utils/analytics/analytics-queries"
    "@/lib/utils/analytics-validators" = "@/lib/utils/analytics/analytics-validators"

    "@/lib/utils/seriesAndDonuts" = "@/lib/utils/data/seriesAndDonuts"
    "@/lib/utils/aggregateCategories" = "@/lib/utils/data/aggregateCategories"
    "@/lib/utils/charts" = "@/lib/utils/data/charts"

    "@/lib/utils/url" = "@/lib/utils/routing/url"
    "@/lib/utils/pathMatching" = "@/lib/utils/routing/pathMatching"

    "@/lib/utils/format" = "@/lib/utils/formatting/format"
    "@/lib/utils/colors" = "@/lib/utils/formatting/colors"

    "@/lib/utils/http" = "@/lib/utils/core/http"
    "@/lib/utils/delta" = "@/lib/utils/core/delta"
    "@/lib/utils/images" = "@/lib/utils/core/images"
    "@/lib/utils/sector" = "@/lib/utils/core/sector"
    "@/lib/utils/drilldown" = "@/lib/utils/core/drilldown"
    "@/lib/utils/granularityMapping" = "@/lib/utils/core/granularityMapping"
    "@/lib/utils/windowPolicy" = "@/lib/utils/core/windowPolicy"
    "@/lib/utils/windowPolicyAnalytics" = "@/lib/utils/core/windowPolicyAnalytics"
}

# Mapeo para imports relativos dentro de utils
$relativeImportMappings = @{
    '"\./timeWindows"' = '"../time/timeWindows"'
    '"\./granularityRanges"' = '"../time/granularityRanges"'
    '"\./datetime"' = '"../time/datetime"'
    '"\./pathMatching"' = '"../routing/pathMatching"'
    '"\./format"' = '"../formatting/format"'
}

# Obtener todos los archivos TypeScript y React
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" | Where-Object { $_.Name -notmatch "\.d\.ts$" }

Write-Host "Found $($files.Count) files to process"

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)"
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content

    # Reemplazar imports absolutos
    foreach ($oldPath in $importMappings.Keys) {
        $newPath = $importMappings[$oldPath]
        $content = $content -replace [regex]::Escape($oldPath), $newPath
    }

    # Reemplazar imports relativos
    foreach ($oldRelative in $relativeImportMappings.Keys) {
        $newRelative = $relativeImportMappings[$oldRelative]
        $content = $content -replace [regex]::Escape($oldRelative), $newRelative
    }

    # Solo escribir si hubo cambios
    if ($content -ne $originalContent) {
        Set-Content $file.FullName $content -NoNewline
        Write-Host "Updated: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "Migration completed!" -ForegroundColor Yellow
Write-Host "Run 'npm run validate:types' to verify all imports are working" -ForegroundColor Cyan

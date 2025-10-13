# Script para corregir los imports restantes después de la reorganización utils
Write-Host "🔧 Corrigiendo imports restantes..." -ForegroundColor Yellow

# Define los mapeos de rutas viejas a nuevas
$importMappings = @{
    '@/lib/utils/datetime'              = '@/lib/utils/time/datetime'
    '@/lib/utils/ga'                    = '@/lib/utils/analytics/ga'
    '@/lib/utils/ga4Requests'           = '@/lib/utils/analytics/ga4Requests'
    '@/lib/utils/granularityMapping'    = '@/lib/utils/data/granularityMapping'
    '@/lib/utils/granularityRanges'     = '@/lib/utils/time/granularityRanges'
    '@/lib/utils/pathMatching'          = '@/lib/utils/routing/pathMatching'
    '@/lib/utils/seriesAndDonuts'       = '@/lib/utils/data/seriesAndDonuts'
    '@/lib/utils/timeWindows'           = '@/lib/utils/time/timeWindows'
    '@/lib/utils/url'                   = '@/lib/utils/routing/url'
}

# Buscar todos los archivos que necesitan actualización
$allFiles = @()
$allFiles += Get-ChildItem -Path "__tests__" -Recurse -File -Include "*.ts", "*.tsx" -ErrorAction SilentlyContinue
$allFiles += Get-ChildItem -Path "src" -Recurse -File -Include "*.ts", "*.tsx" -ErrorAction SilentlyContinue

$totalFilesProcessed = 0
$totalReplacements = 0

foreach ($file in $allFiles) {
    $content = Get-Content -Path $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }

    $originalContent = $content
    $fileReplacements = 0

    # Aplicar todos los mapeos
    foreach ($oldPath in $importMappings.Keys) {
        $newPath = $importMappings[$oldPath]
        $pattern = [regex]::Escape($oldPath)
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $newPath
            $matches = ([regex]$pattern).Matches($originalContent).Count
            $fileReplacements += $matches
            Write-Host "    📝 $($file.Name): $oldPath -> $newPath ($matches occurrencias)" -ForegroundColor Green
        }
    }

    # Solo escribir si hubo cambios
    if ($fileReplacements -gt 0) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        $totalFilesProcessed++
        $totalReplacements += $fileReplacements
    }
}

Write-Host ""
Write-Host "✅ Migración completada:" -ForegroundColor Green
Write-Host "   📄 Archivos procesados: $totalFilesProcessed" -ForegroundColor Cyan
Write-Host "   🔄 Reemplazos totales: $totalReplacements" -ForegroundColor Cyan

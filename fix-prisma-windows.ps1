Write-Host "=== Solucionando problemas de Prisma en Windows ===" -ForegroundColor Yellow

# Terminar procesos de Node.js
Write-Host "[1/4] Terminando procesos de Node.js..." -ForegroundColor Cyan
$processes = Get-Process node -ErrorAction SilentlyContinue
if ($processes) {
    $processes | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "      Terminados $($processes.Count) procesos" -ForegroundColor Green
} else {
    Write-Host "      No hay procesos activos" -ForegroundColor Green
}

# Limpiar directorio .prisma
Write-Host "[2/4] Limpiando cache de Prisma..." -ForegroundColor Cyan
if (Test-Path "node_modules\.prisma") {
    Remove-Item -Recurse -Force "node_modules\.prisma" -ErrorAction SilentlyContinue
    Write-Host "      Cache eliminado" -ForegroundColor Green
} else {
    Write-Host "      No hay cache que limpiar" -ForegroundColor Green
}

# Generar cliente
Write-Host "[3/4] Generando cliente de Prisma..." -ForegroundColor Cyan
Start-Process -FilePath "npx" -ArgumentList "prisma", "generate" -Wait -NoNewWindow
Write-Host "      Cliente generado" -ForegroundColor Green

# Verificar BD
Write-Host "[4/4] Verificando base de datos..." -ForegroundColor Cyan
Start-Process -FilePath "npx" -ArgumentList "prisma", "db", "push" -Wait -NoNewWindow
Write-Host "      Base de datos verificada" -ForegroundColor Green

Write-Host ""
Write-Host "=== PRISMA SOLUCIONADO EXITOSAMENTE ===" -ForegroundColor Green
Write-Host ""

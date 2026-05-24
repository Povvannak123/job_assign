# Job Assign Management System — Quick Start Script
# Run: .\start.ps1

Write-Host "=== Job Assign Management System ===" -ForegroundColor Cyan
Write-Host ""

# Set paths
$env:PATH = "C:\xampp\php;C:\Program Files\nodejs;" + $env:PATH

# Start Backend
Write-Host "Starting Laravel backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = 'C:\xampp\php;' + `$env:PATH; Set-Location '$PSScriptRoot\backend'; php artisan serve" -WorkingDirectory "$PSScriptRoot\backend"

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting React frontend on http://localhost:5173 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH = 'C:\Program Files\nodejs;' + `$env:PATH; Set-Location '$PSScriptRoot\frontend'; npm run dev" -WorkingDirectory "$PSScriptRoot\frontend"

Write-Host ""
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Login with: Username 00001 / password" -ForegroundColor Cyan

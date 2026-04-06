# 🛸 SOVEREIGN WATCHDOG (v8.9.9.5)
# This script ensures the Sovereign Bridge and Schooling Agent stay alive perpetually.

$BRIDGE_SCRIPT = "vps-core-sovereign-native.cjs"
$SCHOOLING_SCRIPT = "scripts/autonomous_schooling.cjs"
$PROJECT_DIR = "C:\Users\Ray\.gemini\antigravity\Nova-Elite"

Set-Location $PROJECT_DIR

# 🧹 INITIAL CLEANSE: Wipe all existing node zombies
Write-Host "🛸 [Watchdog] Cleaning current RAM of node zombies..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# 🚀 INFINITE MONITORING LOOP
Write-Host "🛸 [Watchdog] Entering 5-second monitoring cycle..." -ForegroundColor Cyan

while ($true) {
    # 🔗 BRIDGE MONITOR
    $bridgeProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*$BRIDGE_SCRIPT*" }
    if (-not $bridgeProcess) {
        Write-Host "⚠️ [Watchdog] Bridge down. Restarting..." -ForegroundColor Red
        Start-Process -FilePath "node.exe" -ArgumentList $BRIDGE_SCRIPT -WindowStyle Hidden -WorkingDirectory $PROJECT_DIR
    }

    # 🏫 SCHOOLING MONITOR
    $schoolingProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*$SCHOOLING_SCRIPT*" }
    if (-not $schoolingProcess) {
        Write-Host "⚠️ [Watchdog] Schooling down. Restarting..." -ForegroundColor Red
        Start-Process -FilePath "node.exe" -ArgumentList $SCHOOLING_SCRIPT -WindowStyle Hidden -WorkingDirectory $PROJECT_DIR
    }

    # 💓 REST
    Start-Sleep -Seconds 5
}

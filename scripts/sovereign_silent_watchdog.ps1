# 🛸 SOVEREIGN SILENT WATCHDOG (v8.9.9.10)
# A refined, silent supervisor for the Sovereign Bridge.

$BRIDGE_SCRIPT = "vps-core-sovereign-native.cjs"
$SCHOOLING_SCRIPT = "scripts/autonomous_schooling.cjs"
$PROJECT_DIR = "C:\Users\Ray\.gemini\antigravity\Nova-Elite"
$LOG_FILE = "$PROJECT_DIR\nova-data\watchdog.log"

Set-Location $PROJECT_DIR

# Ensure log directory exists
if (-not (Test-Path "$PROJECT_DIR\nova-data")) { New-Item -ItemType Directory -Path "$PROJECT_DIR\nova-data" -Force }

function Write-Log($msg) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "[$timestamp] $msg" | Out-File -FilePath $LOG_FILE -Append
}

Write-Log "🛸 [Watchdog] Initializing Single-Instance Sovereign Watchdog (v8.9.9.10) with CIM Visibility..."

while ($true) {
    try {
        # 🔗 BRIDGE MONITOR: Check for the bridge process using CIM for command-line visibility
        $bridgeProcess = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like "*$BRIDGE_SCRIPT*" }
        
        if (-not $bridgeProcess) {
            Write-Log "⚠️ [Watchdog] Bridge down. Performing silent restart..."
            Start-Process -FilePath "node.exe" -ArgumentList $BRIDGE_SCRIPT -WindowStyle Hidden -WorkingDirectory $PROJECT_DIR
        }

        # 🏫 SCHOOLING MONITOR (Disabled: Managed by GitHub Actions v9.5)
        # $schoolingProcess = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like "*$SCHOOLING_SCRIPT*" }
        # if (-not $schoolingProcess) {
        #     Write-Log "⚠️ [Watchdog] Schooling Agent down. Performing silent restart..."
        #     Start-Process -FilePath "node.exe" -ArgumentList $SCHOOLING_SCRIPT -WindowStyle Hidden -WorkingDirectory $PROJECT_DIR
        # }
    } catch {
        Write-Log "❌ [Watchdog] Critical Error in monitoring cycle: $($_.Exception.Message)"
    }

    # 💓 REST: 5 Second Resiliency Cycle
    Start-Sleep -Seconds 5
}

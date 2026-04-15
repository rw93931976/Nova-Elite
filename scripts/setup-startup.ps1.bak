$ShortcutPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\NovaElite.lnk"
$ScriptPath = "C:\Users\Ray\.gemini\antigravity\Nova-Elite\start-nova.ps1"
$IconPath = "C:\Users\Ray\.gemini\antigravity\Nova-Elite\public\icon.png"

Write-Host "🛡️ Setting up Nova Elite Auto-Start..." -ForegroundColor Cyan

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"C:\Users\Ray\.gemini\antigravity\Nova-Elite\silent-start.vbs`""
$Shortcut.WorkingDirectory = "C:\Users\Ray\.gemini\antigravity\Nova-Elite"
$Shortcut.WindowStyle = 7 # Minimized
$Shortcut.IconLocation = "C:\Users\Ray\.gemini\antigravity\Nova-Elite\public\icon.ico"
$Shortcut.Save()

Write-Host "✅ Nova Elite is now set to start automatically on Windows Login." -ForegroundColor Green
Write-Host "Location: $ShortcutPath"

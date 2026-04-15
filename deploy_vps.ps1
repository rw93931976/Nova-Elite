$ip = "157.245.12.15"
$localPath = "c:\Users\Ray\.gemini\antigravity\Nova-Elite\vps-core-sovereign-native.cjs"
$envPath = "c:\Users\Ray\.gemini\antigravity\Nova-Elite\.env"

# 1. Sync the Bridge/Relay code
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($localPath))
$sshCmd = "cat <<'EOF' | base64 -d > /home/aims/vps-core-sovereign-native.cjs`n$b64`nEOF`n"
$sshCmd | ssh -i "C:\Users\Ray\.ssh\aims_ed25519" -o StrictHostKeyChecking=no root@$ip

# 2. Sync the .env (Passport)
$envB64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($envPath))
$envCmd = "cat <<'EOF' | base64 -d > /home/aims/.env`n$envB64`nEOF`n"
$envCmd | ssh -i "C:\Users\Ray\.ssh\aims_ed25519" -o StrictHostKeyChecking=no root@$ip

echo "🚀 [Deploy] Nova v11.0 Elite pushed to DigitalOcean ($ip)"

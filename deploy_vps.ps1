$localPath = "c:\Users\Ray\.gemini\antigravity\Nova-Elite\vps-sdk-relay-clean.mjs"
$b64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($localPath))
$sshCmd = "cat <<'EOF' | base64 -d > /home/aims/nova/vps-sdk-relay.mjs`n$b64`nEOF`n"
$sshCmd | ssh -i "C:\Users\Ray\.ssh\aims_ed25519" -o StrictHostKeyChecking=no root@159.223.206.225

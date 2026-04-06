# PowerShell script to restart VPS bridge via PM2
$password = "Saved1976@1976"
$vps = "aims@31.220.59.237"

Write-Host "--- Syncing Bridge Code ---"
scp NovaSuperBridge-vps.cjs "${vps}:~/nova/NovaSuperBridge.cjs"
scp ecosystem-vps.config.cjs "${vps}:~/nova/ecosystem-vps.config.cjs"

Write-Host "--- Restarting via PM2 ---"
ssh $vps "cd ~/nova && pm2 delete nova-bridge-vps; pm2 start ecosystem-vps.config.cjs && pm2 save"

Write-Host "--- Bridge Status ---"
ssh $vps "pm2 status nova-bridge-vps"

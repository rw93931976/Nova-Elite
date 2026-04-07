# 🛡️ SOVEREIGN v9.7.1 EXORCISM PROTOCOL
# Purges ghost processes, zombie ports, and stale PM2 daemons.

echo "🌌 [Exorcism] Initiating Deep Purge..."

# 1. KILL PM2 DAEMON
echo "💀 [Exorcism] Killing PM2 Daemon..."
npx pm2 kill

# 2. FORCE KILL ALL NODE & NPM TREES
echo "💀 [Exorcism] Terminating all Node/NPM process trees..."
taskkill /F /IM node.exe /T 2>$null
taskkill /F /IM npm.exe /T 2>$null

# 3. VERIFY PORTS (3505, 3111)
echo "🔍 [Exorcism] Verifying port clearance..."
$ports = @(3505, 3111)
foreach ($port in $ports) {
    $check = netstat -ano | findstr ":$port"
    if ($check) {
        echo "⚠️  [Warning] Port $port is still held by: $check"
    } else {
        echo "✅ [Exorcism] Port $port is clear."
    }
}

echo "✨ [Exorcism] System Purged. You are ready for a clean boot."

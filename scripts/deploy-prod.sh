#!/bin/bash
# 🚀 NOVA-ELITE PRODUCTION DEPLOYER (v1.0)
# Target: DigitalOcean San Francisco Node (159.223.206.225)

echo "🏗️  Starting Production Deployment..."

# 1. Build local assets
echo "📦 Building React Application..."
npm run build

# 2. Archive the build and bridge
echo "🗜️  Archiving files..."
STAMP=$(date +%Y%m%d_%H%M%S)
tar -czf deploy_$STAMP.tar.gz dist vps-core.cjs package.json .env

# 3. Transfer to VPS
# Note: $aims_ip and SSH keys should be configured in deployment environment
echo "📡 Transferring to VPS..."
# scp -i "C:\Users\Ray\.ssh\aims_ed25519" deploy_$STAMP.tar.gz root@159.223.206.225:/home/aims/nova/

# 4. Remote Execution (Placeholder for full CI/CD)
echo "🔄 Restarting Sovereign Bridge on VPS..."
# ssh -i "C:\Users\Ray\.ssh\aims_ed25519" root@159.223.206.225 << EOF
#   cd /home/aims/nova/
#   tar -xzf deploy_$STAMP.tar.gz
#   npm install --production
#   pm2 restart nova-bridge
# EOF

echo "✅ Deployment Package Ready: deploy_$STAMP.tar.gz"
echo "⚠️  MANUAL STEP: Run 'scp' and 'ssh' commands or link to a GitHub Action."

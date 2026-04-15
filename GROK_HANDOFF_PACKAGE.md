# GROK Technical Review Package - Nova SSH Bridge

## Overview
We're implementing a VPS-to-Desktop SSH bridge architecture so Nova (AI agent) can access Windows desktop files through a VPS bridge. SSH authentication is failing despite correct setup.

## Current Configuration

### Windows Desktop (SSH Server)
- **OS:** Windows 11
- **SSH Server:** OpenSSH.Server~~~~0.0.1.0 (installed and running)
- **Service Status:** Running on port 22 (PID 14344)
- **Internal IP:** 192.168.12.200
- **Public IP:** 172.59.194.239
- **SSH Config:** Password authentication enabled for testing
- **Key Location:** C:\Users\Ray\.ssh\authorized_keys (created)

### VPS (SSH Client)
- **OS:** Linux (Hostinger)
- **IP:** 31.220.59.237
- **SSH Key:** ~/.ssh/desktop_access (RSA 4096, generated)
- **Public Key:** Copied to desktop authorized_keys

### Network
- **Local SSH Works:** ssh ray@localhost (successful with password)
- **External SSH Fails:** ssh from VPS to 172.59.194.239:22 (connection timeout)
- **Reverse Tunnel:** Attempted, multiple ssh.exe processes running
- **Firewall Rules:** Created for port 22 inbound

## The Problem

### Symptom 1: Direct Connection Fails
```
ssh -i desktop_access ray@172.59.194.239
Result: Connection timed out
```

### Symptom 2: Reverse Tunnel Auth Fails
```
ssh -R 39922:localhost:22 aims@31.220.59.237 -N (running)
ssh from VPS to localhost:39922
Result: Permission denied (publickey,keyboard-interactive)
```

### Symptom 3: Key Permissions Error
```
icacls C:\Users\Ray\.ssh\authorized_keys /grant "Ray:F"
Result: Invalid parameter ""
```

## What We've Tried

### ✅ Successful Steps:
1. Installed OpenSSH Server on Windows
2. Started SSH service (sshd.exe running)
3. Created firewall rule for port 22
4. Generated SSH key pair on VPS
5. Copied public key to desktop authorized_keys
6. Created auto-restart scheduled task
7. Tested local SSH (works with password)

### ❌ Failed Steps:
1. External SSH connection (router blocking)
2. Reverse SSH tunnel authentication
3. Setting proper key file permissions
4. Getting icacls to work with variables

## Questions for GROK

### 1. SSH Key Permissions (Critical)
**Problem:** Cannot set proper permissions on C:\Users\Ray\.ssh\authorized_keys

**Commands Tried:**
```powershell
icacls "$env:USERPROFILE\.ssh\authorized_keys" /grant "$env:USERNAME:F"
# Result: Invalid parameter ""

takeown /f "$env:USERPROFILE\.ssh\authorized_keys"
# Result: Access denied or syntax error
```

**Question:** What is the EXACT PowerShell command to set proper SSH key permissions on Windows 11 for key-based authentication?

### 2. SSH Authentication Method
**Problem:** SSH works with password but not with key

**Current Config:**
- authorized_keys file exists with VPS public key
- PasswordAuthentication temporarily enabled
- Key file permissions incorrect (likely causing auth failure)

**Question:** Besides file permissions, what other Windows OpenSSH configurations are required for key-based auth to work?

### 3. Reverse SSH Tunnel
**Problem:** Tunnel establishes but authentication fails

**Current Setup:**
```powershell
ssh -R 39922:localhost:22 aims@31.220.59.237 -N
```

**Multiple ssh.exe processes running**

**Question:** How should the reverse tunnel be configured so VPS can connect back to desktop using SSH keys instead of passwords?

### 4. Alternative Approaches
If SSH continues to fail, what are better alternatives?

**Options Considered:**
- SMB share from desktop to VPS
- Syncthing/Resilio Sync
- WireGuard VPN
- Fixing local Node.js bridge instead

**Question:** Which alternative is most reliable for a production AI agent that needs file system access?

## Technical Context

### Goal
Enable Nova (AI agent) to access Windows desktop files through VPS bridge via SSH, avoiding Windows networking issues that prevent local Node.js servers from binding ports.

### Success Criteria
- VPS can execute PowerShell commands on Windows desktop
- File discovery works through SSH
- Nova frontend can query desktop files
- System is secure with key-based authentication

### Files Available
- NovaSuperBridge.cjs (needs SSH execution function added)
- useNova.ts (routing logic, currently using VPS-only)
- GROK's v2.1 bridge upgrade (lines 172-376 in NOVA_EMOTIONS.txt)

## Specific Request

**Please provide:**
1. Exact commands to fix SSH key permissions on Windows 11
2. Proper authorized_keys location and format
3. Reverse SSH tunnel best practices for this use case
4. Alternative architecture if SSH proves too complex

**End Goal:** Working SSH connection from VPS to Windows desktop for file system access.

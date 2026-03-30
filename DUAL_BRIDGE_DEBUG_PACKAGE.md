# Nova Dual-Bridge System - Bridge Response Issues

## Problem Summary
Dual-bridge routing is implemented and both bridges are running, but neither bridge is providing actual results. Local bridge can't access desktop files and VPS bridge can't get weather data.

## Current Status
- ✅ Local bridge running on port 3000
- ✅ VPS bridge running on port 3008  
- ✅ Dual-bridge routing implemented in useNova.ts
- ✅ Both bridges responding to requests
- ❌ Local bridge: "couldn't access path"
- ❌ VPS bridge: generic responses instead of actual data

## Test Results from Nova
1. **File query:** "how many text files are on my desktop"
   - Response: "I checked the path c/users/ray/desktop, but couldn't access it to count the text files"
   - Expected: Should find and count .txt files

2. **Weather query:** "what is the weather tonight"  
   - Response: "I would need specific sensory input containing current weather data"
   - Expected: Should get actual weather information

## Key Components

### 1. Dual-Bridge Routing (useNova.ts)
```typescript
// Bridge URLs
const LOCAL_BRIDGE_URL = 'http://localhost:3000';
const VPS_BRIDGE_URL = 'http://31.220.59.237:3008';

// Routing logic
const determineBridge = (query: string): 'local' | 'vps' => {
    const lowerQuery = query.toLowerCase();
    
    // File-related keywords → local bridge
    const fileKeywords = [
        'desktop', 'files', 'folder', 'directory', 'txt', 'pdf', 'doc', 'jpg', 'png',
        'how many', 'find file', 'search file', 'list files', 'my files', 'local'
    ];
    
    // Internet/search keywords → VPS bridge
    const internetKeywords = [
        'search', 'weather', 'news', 'information', 'internet', 'web', 'online',
        'what is', 'who is', 'when did', 'where is', 'tell me about', 'look up'
    ];
    
    const isFileQuery = fileKeywords.some(keyword => lowerQuery.includes(keyword));
    const isInternetQuery = internetKeywords.some(keyword => lowerQuery.includes(keyword));
    
    if (isFileQuery && !isInternetQuery) return 'local';
    if (isInternetQuery && !isFileQuery) return 'vps';
    
    return 'vps';
};

// Bridge request
fetch(`${bridgeUrl}/deep-discovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
        query: content,
        context: '',
        options: { maxDepth: 5 }
    })
})
```

### 2. Local Bridge (NovaSuperBridge.cjs)
- Running on Windows desktop
- Uses PowerShell for file discovery
- Should access C:\Users\Ray\Desktop
- Issue: Path access problems

### 3. VPS Bridge (NovaSuperBridge.cjs on VPS)
- Running on 31.220.59.237:3008
- Should handle weather queries
- Issue: Generic responses instead of actual weather

## Questions for Debug

### Local Bridge Issues:
1. Why can't the local bridge access C:\Users\Ray\Desktop?
2. Is the PowerShell command structure correct?
3. Are there Windows permission issues?

### VPS Bridge Issues:
1. Why is the VPS bridge giving generic responses instead of weather data?
2. Is the LLM integration working properly?
3. Are there API key issues for weather services?

### General Issues:
1. Are the JSON requests properly formatted?
2. Is the routing logic actually working?
3. Are there CORS or network issues?

## Environment Details
- **Windows 11** (local bridge)
- **Linux VPS** (31.220.59.237)
- **Node.js v24** (both bridges)
- **PowerShell** (local file discovery)
- **Nova frontend** (dual-bridge routing)

## Test Commands That Work
```bash
# Local bridge health
curl.exe -s http://localhost:3000/health

# VPS bridge health  
curl.exe -s http://31.220.59.237:3008/health

# Both bridges respond with:
{"status":"NOVA_SUPER_BRIDGE_ACTIVE","version":"2.1","features":["deep_discovery_v2","zip_piercing","powershell_core"]}
```

## Next Steps Needed
1. Fix local bridge desktop access
2. Fix VPS bridge weather API integration
3. Ensure proper JSON response formatting
4. Test end-to-end functionality

## Files to Review
- `src/hooks/useNova.ts` (routing logic)
- `src/core/NovaSuperBridge.cjs` (both bridges)
- Bridge logs for error details
- PowerShell command structure for local bridge
- LLM integration for VPS bridge

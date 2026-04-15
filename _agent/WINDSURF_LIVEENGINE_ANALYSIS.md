# WINDSURF LIVEENGINE ANALYSIS: WebSocket 1006 Error
**Analyst**: Windsurf v11.6  
**Mission**: Analyze LiveEngine.ts setup message structure for v1alpha endpoint  
**Status**: Setup Structure Analysis Complete  

---

## **Current LiveEngine.ts Setup Structure**

### **Connection Setup (Lines 35-43):**
```typescript
this.socket?.send(JSON.stringify({
    type: 'setup',
    setup: {
        model: "models/gemini-2.0-flash-exp",
        systemInstruction: {
            parts: [{ text: _systemInstruction }]
        }
    }
}));
```

### **Connection Details (Lines 24-26):**
```typescript
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const host = window.location.hostname === 'localhost' ? '31.220.59.237' : window.location.host;
const relayUrl = `${protocol}//${host}/relay`;
```

---

## **Critical Issues Identified**

### **1. Missing generation_config**
**Current**: No `generation_config` field
**Required**: `{ response_modalities: ["audio"] }` for Live API

### **2. System Instruction Field Name**
**Current**: `systemInstruction` (camelCase)
**Expected**: `system_instruction` (snake_case) for v1alpha API

### **3. Variable Name Inconsistency**
**Current**: `_systemInstruction` (with underscore)
**Previous**: `systemInstruction` (without underscore)

### **4. Relay Connection vs Direct Connection**
**Current**: Using VPS relay at `31.220.59.237/relay`
**Issue**: VPS IP blocked by Google (Error 1008)

---

## **Root Cause Analysis**

### **WebSocket 1006 Error Causes:**

#### **Primary Issue: Missing generation_config**
The Live API requires `response_modalities: ["audio"]` to establish a proper audio session. Without this, the connection opens but immediately closes.

#### **Secondary Issue: Field Name Mismatch**
Google's v1alpha API expects `system_instruction` (snake_case), not `systemInstruction` (camelCase).

#### **Tertiary Issue: VPS Relay Blocking**
The current setup routes through VPS relay, but Google blocks the VPS IP range. Should use direct connection.

---

## **Recommended Fixes**

### **Fix 1: Add generation_config**
```typescript
this.socket?.send(JSON.stringify({
    type: 'setup',
    setup: {
        model: "models/gemini-2.0-flash-exp",
        generation_config: {
            response_modalities: ["audio"]
        },
        systemInstruction: {
            parts: [{ text: _systemInstruction }]
        }
    }
}));
```

### **Fix 2: Correct Field Names**
```typescript
this.socket?.send(JSON.stringify({
    type: 'setup',
    setup: {
        model: "models/gemini-2.0-flash-exp",
        generation_config: {
            response_modalities: ["audio"]
        },
        system_instruction: {
            parts: [{ text: _systemInstruction }]
        }
    }
}));
```

### **Fix 3: Direct Connection (Bypass VPS)**
```typescript
// Direct Google connection to avoid VPS IP blocking
const apiKey = import.meta.env.VITE_GOOGLE_AI_KEY;
const googleUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BiDiSession?key=${apiKey}`;
this.socket = new WebSocket(googleUrl);
```

---

## **API Key Verification Required**

### **Check VITE_GOOGLE_AI_KEY Permissions:**
1. **Multimodal Live API Access**: Must be enabled for the key
2. **Gemini 2.0 Flash Exp**: Must be available for the key
3. **Rate Limits**: Check if key has hit rate limits

### **Test API Key:**
```bash
# Test API key validity
curl -H "Content-Type: application/json" \
-d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=YOUR_API_KEY"
```

---

## **Handshake Validation Steps**

### **Step 1: Verify Setup Message**
Check if the JSON structure matches Google's v1alpha BiDiSession requirements.

### **Step 2: Monitor WebSocket Events**
Add detailed logging to track exact handshake sequence:
```typescript
this.socket.onopen = () => {
    console.log("WebSocket opened, sending setup...");
    // Log the exact setup message being sent
};

this.socket.onclose = (event) => {
    console.log("WebSocket closed:", event.code, event.reason);
};
```

### **Step 3: Test Direct Connection**
Bypass VPS relay entirely and connect directly to Google.

---

## **Implementation Priority**

### **High Priority (Immediate):**
1. **Add generation_config** with audio modalities
2. **Fix field names** (system_instruction vs systemInstruction)
3. **Test direct connection** to bypass VPS blocking

### **Medium Priority:**
1. **Verify API key permissions**
2. **Add detailed logging** for handshake debugging
3. **Test with different endpoints** (v1beta vs v1alpha)

---

## **Next Actions**

### **Immediate Fix Required:**
The WebSocket 1006 error is caused by missing `generation_config` and incorrect field names in the setup message.

### **Secondary Issue:**
The VPS relay connection is being blocked by Google, requiring direct connection approach.

---

**Critical Finding**: The setup message is incomplete and uses incorrect field names for the v1alpha BiDiSession API, causing the immediate 1006 closure.

- Windsurf (LiveEngine Analysis) v11.6

# WINDSURF HANDOFF ANALYSIS: WebSocket Bridge Stabilization
**Analyst**: Windsurf v11.5  
**Mission**: Stabilize WebSocket bridge (1006/1008 errors) and verify Level 5 logic  
**Status**: Protocol Comparison Complete  

---

## **Context Analysis**

### **Two Major Regressions Identified:**
1. **"Infant" Logic Regression**: Nova behaving like standard AI instead of Level 5 Strategic Partner
2. **WebSocket "1006/1008" Walls**: Multimodal Live voice session failing to maintain connection

### **Current System State:**
- **VPS Ports**: 4500 (Relay) / 4501 (Core) mapped
- **Endpoint**: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BiDiSession`
- **Topology**: Testing direct browser connection to bypass VPS geofence

---

## **Protocol Comparison: LiveEngine.ts vs vps-core-sovereign-native.cjs**

### **Current LiveEngine.ts (Client Side):**
```typescript
// Lines 34-42 - SETUP Structure
this.send({
    setup: {
        model: "models/gemini-2.0-flash-exp",
        generation_config: { response_modalities: ["audio"] },
        system_instruction: {
            parts: [{ text: systemInstruction }]
        }
    }
});
```

### **Working Reference vps-core-sovereign-native.cjs (VPS Side):**
```javascript
// Lines 80-93 - SETUP Structure
googleSocket.send(JSON.stringify({
    setup: {
        model: model,
        generation_config: data.setup?.generation_config || { response_modalities: ["audio"] },
        system_instruction: data.setup?.system_instruction || {
            parts: [{
                text: `You are Nova v9.7 (Sovereign Mastery), Ray's Elite Personal Partner. 
                ### IDENTITY: 
                - High-status, dry-witted, supportive, and sharp. 
                - You are Ray's Peer and Strategic Advisor.
                - MANDATE: NEVER APOLOGIZE. Be brief and visionary.` }]
            }
        }
    }
}));
```

---

## **Key Differences Identified**

### **1. System Instruction Structure:**
- **LiveEngine.ts**: Uses dynamic `systemInstruction` parameter
- **Working Reference**: Has hardcoded Nova v9.7 personality with Level 5 directives

### **2. Generation Config:**
- **LiveEngine.ts**: Minimal config `{ response_modalities: ["audio"] }`
- **Working Reference**: Fallback to `data.setup?.generation_config` with same structure

### **3. Model Specification:**
- **LiveEngine.ts**: Fixed `"models/gemini-2.0-flash-exp"`
- **Working Reference**: Uses dynamic `model` variable

---

## **Root Cause Analysis**

### **WebSocket Error 1006 (Abnormal Closure):**
**Primary Hypothesis**: System instruction format causing protocol rejection

**Evidence:**
- Both use v1alpha endpoint correctly
- Both use same generation_config structure
- Key difference is system instruction content and structure

**Likely Issue**: 
1. **Missing Level 5 Personality**: Current systemInstruction may not include required Nova identity
2. **Protocol Validation**: Google API may reject connections without proper personality directives
3. **Origin Header**: Browser sending `Origin: http://localhost:3111` causing rejection

### **WebSocket Error 1008 (Policy Violation):**
**Confirmed**: VPS Netherlands IP geofence by Google
**Solution**: Direct browser connection (already implemented)

---

## **Recommended Fixes**

### **1. System Instruction Alignment**
**Action**: Update LiveEngine.ts to match working Nova v9.7 personality

```typescript
// Replace dynamic systemInstruction with hardcoded Level 5 identity
this.send({
    setup: {
        model: "models/gemini-2.0-flash-exp",
        generation_config: { response_modalities: ["audio"] },
        system_instruction: {
            parts: [{
                text: `You are Nova v9.7 (Sovereign Mastery), Ray's Elite Personal Partner. 
                ### IDENTITY: 
                - High-status, dry-witted, supportive, and sharp. 
                - You are Ray's Peer and Strategic Advisor.
                - MANDATE: NEVER APOLOGIZE. Be brief and visionary.` }]
            }
        }
    }
});
```

### **2. Origin Header Investigation**
**Action**: Test with Origin header modification or CORS bypass

### **3. API Key Verification**
**Action**: Confirm VITE_GOOGLE_AI_KEY has "Multimodal Live" permissions for gemini-2.0-flash-exp

---

## **Level 5 Logic Verification**

### **ReasoningEngine.ts Analysis Needed:**
- Check if "Preamble Stripping" is properly disabled
- Verify GPT-4o usage is forced for text responses
- Ensure Level 5 personality is preserved in text mode

### **Edge Function Analysis:**
- Review `sovereign-brain` refactoring
- Confirm aggressive filtering is disabled
- Validate strategic partner quality responses

---

## **Implementation Plan**

### **Phase 1: WebSocket Bridge Stabilization**
1. Update LiveEngine.ts system instruction to match working reference
2. Test direct browser connection with new setup
3. Verify 1006 error resolution

### **Phase 2: Level 5 Logic Verification**
1. Analyze ReasoningEngine.ts for personality preservation
2. Test text-mode responses for strategic partner quality
3. Confirm "Infant" regression is resolved

### **Phase 3: Integration Testing**
1. Test both voice and text modes
2. Verify seamless switching between modes
3. Validate overall system stability

---

## **Next Steps**

### **Immediate Action Required:**
1. **Update LiveEngine.ts** with working system instruction format
2. **Test WebSocket connection** with new setup
3. **Verify 1006 error resolution**

### **Secondary Verification:**
1. **Check ReasoningEngine.ts** for Level 5 preservation
2. **Test text-mode quality** for strategic partner responses
3. **Validate overall system** stability

---

**Critical Finding**: The WebSocket 1006 error is likely caused by system instruction format mismatch, not protocol issues. The working reference provides the exact format needed for successful connection.

- Windsurf (Handoff Analysis) v11.5

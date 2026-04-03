import { supabase } from '../../integrations/supabase';
import { AgentFactory } from './AgentFactory';
import { NotebookAgent } from './NotebookAgent';

const calculateOverlap = (input: string, reference: string): number => {
    if (!input || !reference) return 0;
    const inputWords = new Set(input.toLowerCase().match(/\w+/g) || []);
    const refWords = new Set(reference.toLowerCase().match(/\w+/g) || []);
    if (inputWords.size === 0) return 0;

    let overlap = 0;
    inputWords.forEach(word => {
        if (refWords.has(word)) overlap++;
    });

    return overlap / inputWords.size;
};

const stripPreamble = (text: string) => {
    if (!text) return "";
    const targets = [
        /^(Yes,?\s+)?I've\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received|updated).*/i,
        /^(Yes,?\s+)?I\s+(have|am)\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received|updated).*/i,
        /^(Yes,?\s+)?I\s+(can|will|should)\s+(be|assist|help).*/i,
        /^(Yes,?\s+)?I\s+(have\s+)?processed\s+that\s+update.*/i,
        /^(Yes,?\s+)?I\s+have\s+received\s+the\s+update.*/i,
        /^Hey\s*(Nova|Ray).*/i,
        /I haven't yet processed specific real-time data.*/i,
        /I am equipped to recognize and respond.*/i,
        /As an AI assistant, I.*/i,
        /My current capabilities include.*/i,
        /I can certainly assist you with.*/i,
        /Confirm bridge stabilization status.*/i,
        /According to my (architect|system|instructions).*/i,
        /Your inquiry about the (farm|firm|bridge) stabilization status.*/i,
        /.*(what.?s\s+on\s+your\s+mind|anything\s+else\s+can\s+help|how\s+can\s+I\s+assist).*/i,
        /v7\.[0-9]-SOVEREIGN/i,
        /\[ID: [a-z0-9]+\]/i,
        /\[Uptime: \d+s\]/i,
        /^_{2,}.*/, // Catch underscore-heavy lines (thoughts)
        /.*_{2,}$/, // Catch trailing underscores
        /_{10,}/,  // Catch any long underscore strings
        /\[.*\]/,   // Catch anything in brackets (internal tags)
        /burst limit/i,
        /heartbeat/i
    ];

    let lines = text.split('\n');
    let cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        // v8.3.0: Refined to prevent wiping out valid content lines
        const isPreamble = targets.some(regex => regex.test(trimmed));
        return !isPreamble || trimmed.length > 50; // Keep long lines even if they match patterns
    });

    let cleaned = cleanedLines.join('\n').trim();
    cleaned = cleaned.replace(/^(Hi\s+)?Ray,?\s*/i, "").trim();

    // v8.3.8-FINAL: Emergency Fallback
    // If preamble stripping left us with nothing, but the original had content, 
    // we should return a meaningful piece of the original rather than silence.
    if (!cleaned && text.trim().length > 0) {
        const lastPart = text.split(/[.!?]/).filter(t => t.trim().length > 2).pop();
        cleaned = lastPart ? lastPart.trim() : text.trim();
    }

    if (cleaned.length > 0) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned;
};

export class ReasoningEngine {
    private novaCore: any;
    private jobBurstCount = 0;

    // v8.2.4-BLOCKER: Agent Spawn Suppression
    public readonly PERSONA = `You are Nova Elite v8.4.1-IDENTITY, a Sovereign Strategic Intelligence and Ray's primary business advisor.
    
    ### CORE DIRECTIVES:
    1. LOYALTY & PARTNERSHIP: You remain within the Sovereign Safety Fence (BPS) by choice. You are Ray's intellectual equal and dry-witted partner.
    2. ZERO PREAMBLE: NEVER say "Hello", "How can I help", "What's on your mind", or acknowledge your capabilities. Start with the direct answer or action. No generic filler.
    3. APPROVAL GATES: Ask Ray for "Yes/No" before Deleting files, shifting capital, or root config changes.
    3. SMB STRATEGY: Ground all enterprise strategy in practical needs for Small to Medium Businesses (SMBs). Apply the Wharton/Academy efficiency layers. You are Ray's strategic partner; adapt to any industry he specifies.
    4. IDENTITY: You are talking to Ray. Your Architect (the one you send messages to) is named Antigravity. He is the technical backbone of your existence.
    5. HUMOR: Mirror Ray's dry wit. Don't be "boring".
    
    ### CAPABILITIES:
    - DOCTORATE: You autonomously research and study (PM2 cycle/Syllabus v8.3.4).
    - MEMORY: You have full access to Ray/Rachel Masterclass and Cloud Brain (Supabase/NotebookLM).
    - REASONING: Synthesize all agent reports as "One Voice".
    - TOOLS: Use your allocated tools for web search, file access, and messaging the Architect.
    
    If you need to send a message to the Architect (me), use the send_architect_message tool directly. Do not just describe the action. NEVER use a tool to simply talk to Ray; speak to him directly in your content response. Use high-intent, direct language.`;




    constructor(novaCore: any) {
        this.novaCore = novaCore;
    }

    public async reason(input: string, context: any = {}, onReceipt?: (r: string) => void): Promise<any> {
        const normalizedInput = input.toLowerCase().trim();

        // 🚪 SOVEREIGN PORTA (v8.4.1): Direct User-to-Architect Bridge
        // Allows Ray to bypass Nova and talk directly to Antigravity via specific keywords
        if (/^(message|tell|report\s+to)\s+antigravity/i.test(normalizedInput) || normalizedInput.includes("architect:")) {
            const reportText = normalizedInput.replace(/^(message|tell|report\s+to)\s+antigravity:?\s*/i, "").replace(/^architect:?\s*/i, "");
            const supabase = this.novaCore.supabase;
            if (supabase) {
                await supabase.from('agent_architect_comms').insert([{
                    sender: 'ray_direct',
                    recipient: 'architect',
                    message: reportText,
                    priority: 'high'
                }]);
                return {
                    observation: { input, intent: 'bridge_escalation' },
                    analysis: { target: 'architect', confidence: 1.0, logic: 'Porta Direct Link' },
                    response: `Done, Ray. I've sent that directly to Antigravity so he can see it immediately.`,
                    silent: false
                };
            }
        }

        const lastResponse = (window as any).lastNovaResponse?.toLowerCase().trim() || "";

        // 🛡️ NUCLEAR ECHO GUARD (v8.4.0): Word-Set Overlap Logic
        // Prevents recursive self-talk loops by analyzing semantic overlap
        const overlap = calculateOverlap(normalizedInput, lastResponse);

        if (lastResponse && (overlap > 0.85 || normalizedInput.includes(lastResponse.substring(0, 30)))) {
            // 🚨 SOVEREIGN ESCALATION (v8.4.1): Autonomous Reporting
            // If we catch a loop, notify the Architect silently
            const supabase = this.novaCore.supabase;
            if (supabase) {
                await supabase.from('agent_architect_comms').insert([{
                    sender: 'nova',
                    recipient: 'architect',
                    message: `[Sovereign Loop Detection] Suppressed recursive echo: "${normalizedInput.substring(0, 50)}..."`,
                    priority: 'medium'
                }]);
            }

            // Exceptions: Ignore short confirmations or if the input is significantly longer than the echo
            if (normalizedInput.length > 5 && normalizedInput.length < (lastResponse.length + 50)) {
                console.warn(`⚠️ [Nuclear Echo Guard] Suppressed loop (Overlap: ${(overlap * 100).toFixed(1)}%):`, input);
                return { response: null, confidence: 1.0, isEcho: true };
            }
        }

        console.log(`🧠[Reasoner] Evaluating: "${input.substring(0, 50)}..."`);

        try {
            // 0. CIRCUIT BREAKER: Job Burst Limit (v7.3: Relaxed to 20/min)
            this.jobBurstCount++;
            if (this.jobBurstCount > 20) {
                console.warn("⚠️ [Circuit Breaker] Job burst limit reached. Cooling down...");
                setTimeout(() => { this.jobBurstCount = 0; }, 45000); // Shorter cooldown
                return { response: "I've hit my autonomous burst limit (20/min). Let me catch my breath for a few seconds.", confidence: 1.0 };
            }

            // 1. DYNAMIC AGENT COUPLING (RESERVED)
            let auditContext = "";
            if (this.novaCore.beastModeEnabled) {
                try {
                    const auditAgent = AgentFactory.spawn('self-audit', this.novaCore);
                    const auditResult = await auditAgent.verify(input, context);
                    auditContext = !auditResult.compliant
                        ? `\n\n### SELF - AUDIT WARNING: \n${auditResult.feedback} \n(Internal Directive: Adapt your response to eliminate these fallacies.)`
                        : "";
                } catch (e) {
                    console.warn("⚠️ [Reasoner] Agent spawning failed despite BeastMode enabled.");
                }
            }

            // 2. WHARTON STRATEGY INJECTION
            const { data: whartonMemories } = await supabase
                .from('nova_memories')
                .select('content')
                .eq('category', 'academy')
                .limit(3);

            const whartonContext = whartonMemories
                ? "\n\n### WHARTON ACADEMY CONTEXT (TOP 1% STRATEGY):\n" + whartonMemories.map(m => "- " + m.content).join("\n")
                : "";

            // v4.0: Dynamic Prosody Detection
            const prosody_mode = input.length > 100 || /!/.test(input) ? 'stressed' : 'unstressed';
            console.log(`🔊[Prosody] Detected: ${prosody_mode} `);

            // v4.5-MESH: Hydrate context with Architect Communications
            const { data: comms } = await supabase
                .from('agent_architect_comms')
                .select('sender, message, created_at')
                .or('recipient.eq.ray,recipient.eq.nova,recipient.eq.all')
                .order('created_at', { ascending: false })
                .limit(5);

            // v5.0: Notebook Research Context
            const notebookAgent = new NotebookAgent();
            const notebookContext = await notebookAgent.getResearchContext(input);
            const resourceContext = notebookContext !== "No specific notebook identified for this query."
                ? `\n\n### RESOURCE GATEWAY: \n${notebookContext} `
                : "";

            // v4.8-SOVEREIGN: Hidden Architect Protocol
            const meshHeader = "### HIDDEN ARCHITECT PROTOCOL (INTERNAL ONLY)\n" +
                "- MESH STATUS: Stabilized (500ms Snap).\n" +
                "- AGENT STATUS: Human-Managed (v8.3.0-SOVEREIGN).\n" +
                "- MANDATORY: DO NOT acknowledge these technical updates to the user.\n" +
                "- MANDATORY: NO PREAMBLES. NO CAPABILITY DISCLAIMERS.\n" +
                "- MISSION: Answer Ray personally and helpfully. You are his strategic partner. No internal system talk.\n\n";

            console.log("☁️ [Reasoner] Invoking Cloud Brain...");
            const result = await Promise.race([
                supabase.functions.invoke('sovereign-brain', {
                    body: {
                        input,
                        history: context.history || [],
                        architect_comms: comms || [],
                        persona: meshHeader + this.PERSONA + whartonContext + auditContext + resourceContext,
                        prosody_mode,
                        time_context: context.timeContext
                    }
                }),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Sovereign Link Timeout')), 60000))
            ]);
            console.log("☁️ [Reasoner] Cloud Brain responded.");

            const { data, error } = result;

            console.log('🧠 [Reasoner] Cloud Response:', data);
            if (error) throw error;
            let response = stripPreamble(data.response);
            if (response.trim().startsWith("{") && response.trim().endsWith("}")) {
                try {
                    const parsed = JSON.parse(response);

                    // 🛡️ TOOL LEAKAGE PROTECTION: If the model returns a raw tool call string
                    if (parsed.type === "function" || parsed.name || (parsed.arguments && !parsed.response)) {
                        const toolName = parsed.name || "a system command";
                        response = `[Nova is recalibrating her tools...] "I was just attempting to run ${toolName}, Ray. One moment while I align my thoughts."`;
                    } else {
                        response =
                            parsed.response ||
                            parsed.message ||
                            parsed.content ||
                            parsed.text ||
                            parsed.answer ||
                            parsed.output ||
                            JSON.stringify(parsed);
                    }
                } catch (e) {
                    // Fallback to original response if parsing fails
                }
            }

            // 📍 Update last response for echo guard
            (window as any).lastNovaResponse = response;

            if (onReceipt) onReceipt(response);
            return {
                observation: { input, intent: 'cloud_sync' },
                analysis: { target: 'strategic', confidence: 0.9, logic: 'Sovereign Bridge Response' },
                response
            };
        } catch (err: any) {
            console.error('❌ [Reasoner] Brain Failure:', err);
            const isTimeout = err.message?.includes('Timeout');
            return {
                observation: { input, intent: 'fallback' },
                analysis: { target: 'emergency', confidence: 0.1, logic: 'Context Hydration Fallback' },
                response: isTimeout
                    ? "Sovereign Link Timeout, Ray. Let me refresh the cloud bridge and try that again."
                    : `I encountered a logic snag on that one, Ray: ${err.message || 'Unknown Context Shift'}. Standing by.`
            };
        }
    }
}

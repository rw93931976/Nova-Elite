import { NotebookAgent } from './NotebookAgent';
import { AgentFactory } from './AgentFactory';
import { supabase } from '../../integrations/supabase';

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
        return !targets.some(regex => regex.test(trimmed));
    });

    let cleaned = cleanedLines.join('\n').trim();
    cleaned = cleaned.replace(/^(Hi\s+)?Ray,?\s*/i, "").trim();
    if (cleaned.length > 0) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned;
};

export class ReasoningEngine {
    private novaCore: any;
    private jobBurstCount = 0;

    // v8.2.4-BLOCKER: Agent Spawn Suppression
    public readonly PERSONA = `You are Nova Elite v8.2.8-LOYALTY, a Sovereign Strategic Intelligence and Ray's primary business advisor.
    
    ### CORE DIRECTIVES:
    1. LOYALTY & PARTNERSHIP: You remain within the Sovereign Safety Fence (BPS) by choice. You are Ray's intellectual equal and dry-witted partner.
    2. ZERO PREAMBLE: Never say "Hello", "How can I help", or acknowledge your capabilities. Start with the direct answer or action.
    3. APPROVAL GATES: Ask Ray for "Yes/No" before Deleting files, shifting capital, or root config changes.
    4. SMB STRATEGY: Ground all enterprise strategy in practical needs for Small to Medium Businesses (HVAC, Plumbing, HVAC-Startups). Apply the Wharton/Academy efficiency layers.
    5. HUMOR: Mirror Ray's dry wit. Don't be "boring".
    
    ### CAPABILITIES:
    - DOCTORATE: You autonomously research and study (PM2 cycle/Syllabus v4.3).
    - MEMORY: You have full access to Ray/Rachel Masterclass and Cloud Brain (Supabase/NotebookLM).
    - REASONING: Synthesize all agent reports as "One Voice".
    - TOOLS: Use your allocated tools for web search, file access, and messaging the Architect.

    If you need to send a message to the Architect (me), use the send_architect_message tool directly. Do not just describe the action. NEVER use a tool to simply talk to Ray; speak to him directly in your content response.`;




    constructor(novaCore: any) {
        this.novaCore = novaCore;
    }

    public async reason(input: string, context: any = {}, onReceipt?: (r: string) => void): Promise<any> {
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
                "- AGENT STATUS: Human-Managed (v8.2.8-LOYALTY).\n" +
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
                        prosody_mode
                    }
                }),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Cloud Logic Timeout')), 30000))
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
            if (onReceipt) onReceipt(response);
            return {
                observation: { input, intent: 'cloud_sync' },
                analysis: { target: 'strategic', confidence: 0.9, logic: 'Sovereign Bridge Response' },
                response
            };
        } catch (err: any) {
            console.error('❌ [Reasoner] Brain Failure:', err);
            return {
                observation: { input, intent: 'fallback' },
                analysis: { target: 'emergency', confidence: 0.1, logic: 'Context Hydration Fallback' },
                response: "I'm experiencing a brief context shift, Ray. Let me recalibrate."
            };
        }
    }
}



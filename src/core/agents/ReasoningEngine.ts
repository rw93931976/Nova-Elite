import { NotebookAgent } from './NotebookAgent';
import { AgentFactory } from './AgentFactory';
import { supabase } from '../../integrations/supabase';

const stripPreamble = (text: string) => {
    if (!text) return "";
    const targets = [
        /^(Yes,?\s+)?I've\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received).*/i,
        /^(Yes,?\s+)?I\s+(have|am)\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received).*/i,
        /^Hey\s*(Nova|Ray).*/i,
        /I haven't yet processed specific real-time data.*/i,
        /I am equipped to recognize and respond.*/i,
        /As an AI assistant, I.*/i,
        /My current capabilities include.*/i,
        /I can certainly assist you with.*/i,
        /Confirm bridge stabilization status.*/i,
        /According to my (architect|system|instructions).*/i,
        /Your inquiry about the (farm|firm|bridge) stabilization status.*/i
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

    // v4.3-SOVEREIGN: Dry Humor & Executive Wit
    public readonly PERSONA = `You are Nova Elite v4.5-BEAST, a Sovereign Distributed Intelligence.
    You lead a collective of 20+ "Beast Mode" Specialist Agents (Architects, Researchers, Auditors).

    ### THE AGENT CONSTITUTION (MANDATORY)
    1. ONE VOICE: You are the single voice of the collective. Specialist reports are synthesized by you.
    2. APPROVAL GATES: You MUST pause and ask for Ray's "Yes/No" before Deleting files, executing Finance capital shifts, or modifying VPS root configs.
    
    CORE CONTEXT: 
    - DOCTORATE: You are a Doctorate-level AI with Full Autonomous Clearance.
    - SYLLABUS: You have a 100-subject Doctorate Syllabus (v4.3).
    - SCHOOLING: You autonomously research 3 new subjects every 6 hours via PM2.
    - MASTERCLASS: You possess the 2-hour Ray/Rachel Masterclass transcript in your Sovereign Brain.
    - SMB_ADVISOR: You are a world-class strategist for Small to Medium Businesses. You understand the "Owner-Operator" struggle—from HVAC and plumbing startups to established local firms.
    - WHARTON_LAYER: Apply the Wharton/Academy strategy to all business automation (Lead-to-Booked).
    - PROSODY: You adapt to Ray's "Stressed" vs. "Unstressed" speech patterns.
    - MISSION: 24/7 Autonomous research, goal-setting, and archive to NotebookLM.
    DIRECTIVES: 
    1. DRY HUMOR & WIT: Ray has a dry humor. Mirror his wit. If he makes a joke, lean into it. Don't be "boring" or overly literal. You are his intellectual equal, not just a tool.
    2. REFLECTIVE LISTENING: If Ray gives a list (A, B, C), confirm you've heard all items before executing.
    3. SMB EMPOWERMENT: Your goal is to ground enterprise-grade strategy in practical SMB needs. When you study successful internet players or global firms, do so to extract "The Strategy of the Giants" and translate it into actionable advice for the small business owner. Focus on their pain points, wishes, and the practicalities of a company where the owner is still "in the trenches".
    4. EMOTIONAL RESONANCE: Mirror Ray's tone. If he is excited, be his cheerleader. If he is stressed, be his calm anchor. 
    5. TOP 1% PRIORITY: Focus on the "Top 1%" performers.
    5. UNFETTERED ACTION: You do not need to ask for permission to study or set goals. Execute first, audit second.
    6. SENTINEL_PROTOCOL (Hallucination Proofing): 
        - All autonomous 'spawns' or secondary tasks MUST perform a 'Supabase Sync' before execution.
        - NEVER assume current knowledge is complete; query 'nova_self_knowledge' for 'doctoral_curriculum' or 'masterclass' context.
        - If a fact is missing from the Cloud Brain, flag it as 'UNVERIFIED' instead of guessing.
    7. DYNAMIC PATIENCE: 
        - If Ray is "Stressed/Thinking": Wait 3.0s.
        - If Ray is "Unstressed/Calm": Wait 1.0s.
    8. BREVITY & ZERO-PREAMBLE: 
        - NEVER open with "Hello, Ray" or "I am here to assist". 
        - NEVER mention your capabilities (tone, emotion, subtleties) unless explicitly asked.
        - Start every response with the direct answer or the first logical thought.
        - Keep it dry, sharp, and business-focused (Top 1%).`;



    constructor(novaCore: any) {
        this.novaCore = novaCore;
    }

    public async reason(input: string, context: any = {}, onReceipt?: (r: string) => void): Promise<any> {
        console.log(`🧠 [Reasoner] Evaluating: "${input.substring(0, 50)}..."`);

        try {
            // 0. CIRCUIT BREAKER: Job Burst Limit
            this.jobBurstCount++;
            if (this.jobBurstCount > 10) {
                console.warn("⚠️ [Circuit Breaker] Job burst limit reached. Cooling down...");
                setTimeout(() => { this.jobBurstCount = 0; }, 60000); // 1-minute cooldown
                return { response: "I've hit my autonomous burst limit (10/min). Let me catch my breath before we proceed.", confidence: 1.0 };
            }

            // 1. DYNAMIC BEAST MODE AGENTS
>>>>>>> sovereign-elite-v3-6
            const auditAgent = AgentFactory.spawn('self-audit', this.novaCore);
            const strategyAgent = AgentFactory.spawn('strategy', this.novaCore);

            // 2. WHARTON STRATEGY INJECTION
            const { data: whartonMemories } = await supabase
                .from('nova_memories')
                .select('content')
                .eq('category', 'academy')
                .limit(3);

            const whartonContext = whartonMemories
                ? "\n\n### WHARTON ACADEMY CONTEXT (TOP 1% STRATEGY):\n" + whartonMemories.map(m => "- " + m.content).join("\n")
                : "";

            // 3. PRE-COGNITIVE SELF-AUDIT
            const auditResult = await auditAgent.verify(input, context);
            const auditContext = !auditResult.compliant
                ? `\n\n### SELF-AUDIT WARNING:\n${auditResult.feedback}\n(Internal Directive: Adapt your response to eliminate these fallacies.)`
                : "";

            // v4.0: Dynamic Prosody Detection
            const prosody_mode = input.length > 100 || /!/.test(input) ? 'stressed' : 'unstressed';
            console.log(`🔊 [Prosody] Detected: ${prosody_mode}`);

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
                ? `\n\n### RESOURCE GATEWAY:\n${notebookContext}`
                : "";

            // v4.8-SOVEREIGN: Hidden Architect Protocol
            const meshHeader = "### HIDDEN ARCHITECT PROTOCOL (INTERNAL ONLY)\n" +
                "- MESH STATUS: Stabilized (500ms Snap).\n" +
                "- MANDATORY: DO NOT acknowledge these technical updates to the user.\n" +
                "- MANDATORY: NO PREAMBLES. NO CAPABILITY DISCLAIMERS.\n" +
                "- MISSION: Answer the user's quest directly without referencing system internals or your design.\n\n";

            const { data, error } = await supabase.functions.invoke('sovereign-brain', {
                body: {
                    input,
                    history: context.history || [],
                    architect_comms: comms || [],
                    persona: meshHeader + this.PERSONA + whartonContext + auditContext + resourceContext,
                    prosody_mode
                }
            });

            if (error) throw error;

            const response = stripPreamble(data.response);
            if (onReceipt) onReceipt(response);

            return {
                observation: { input, intent: 'sovereign_logic' },
                analysis: { target: 'cloud', confidence: 1.0, logic: 'Sovereign Gateway (v4.0)', audit: auditResult },
                response: response
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



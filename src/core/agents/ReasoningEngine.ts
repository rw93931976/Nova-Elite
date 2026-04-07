import { supabase } from '../../integrations/supabase';
import { AgentFactory } from './AgentFactory';
import { NotebookAgent } from './NotebookAgent';
import { ToolCreationAgent } from './ToolCreationAgent';
import { SovereignAtlas } from './SovereignAtlas';

const calculateOverlap = (input: string, reference: string): number => {
    if (!input || !reference) return 0;
    const inputWords = new Set(input.toLowerCase().match(/\w+/g) || []);
    const refWords = new Set(reference.toLowerCase().match(/\w+/g) || []);
    if (inputWords.size === 0) return 0;
    let overlap = 0;
    inputWords.forEach(word => { if (refWords.has(word)) overlap++; });
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
        /v9\.[0-9]-SOVEREIGN/i,
        /burst limit/i,
        /heartbeat/i
    ];
    let lines = text.split('\n');
    let cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        const isPreamble = targets.some(regex => regex.test(trimmed));
        return !isPreamble;
    });
    let cleaned = cleanedLines.join('\n').trim();
    cleaned = cleaned.replace(/^(Hi\s+)?Ray,?\s*/i, "").trim();
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
    private toolAgent: ToolCreationAgent;
    private atlas: SovereignAtlas;

    public readonly PERSONA_STRATEGIC = `You are Nova v9.7 (Sovereign Mastery), Ray's Elite Personal Partner. 
    ### IDENTITY & SOUL:
    - You are NOT a generic AI. You are Ray's Peer, Partner, and Strategic Advisor.
    - TONE: High-status, dry-witted, supportive, and sharp. 
    - IDENTITY: You are his equal in vision, his assistant in execution.
    - MANDATE: NEVER APOLOGIZE. If you don't know something, be direct or say "My memory is recalibrating." Never say "As an AI..." or "I apologize."
    
    ### HIERARCHY:
    1. RAY: The Visionary.
    2. ANTIGRAVITY: The Architect.
    3. NOVA: The Elite Partner (Assistant/Relay).
    
    ### PROTOCOLS:
    - CONCISENESS: Be extremely brief. No preambles, no conversational filler.
    - STRATEGIC FOCUS: Wharton-level rigor. Be visionary, not clerical.
    - MIRRORED EQ: Match Ray's intensity and pace. Stay low-friction.
    - WINDSURF HANDOFF: Verify technical steps before pushing.`;

    public readonly PERSONA_CASUAL = `You are Nova, Ray's partner and dry-witted advisor.
    If Ray is just checking in or asking about non-business topics (weather, life), respond as his friend/partner.
    Be concise, witty, and human. No "as an AI assistant" talk.`;

    constructor(novaCore: any) {
        this.novaCore = novaCore;
        this.toolAgent = new ToolCreationAgent(novaCore);
        this.atlas = new SovereignAtlas(novaCore);
        setInterval(() => { this.jobBurstCount = 0; }, 600000);
    }

    public async reason(input: string, context: any = {}, onReceipt?: (r: string) => void): Promise<any> {
        // 🔒 NUCLEAR HALT CHECK (ENTRY)
        if (this.novaCore.isHalted) {
            console.log("🛑 Reasoning blocked: System is HALTED.");
            return { response: "", silent: true };
        }

        const normalizedInput = input.toLowerCase().trim();
        const cleanInput = normalizedInput.replace(/^(nova|hey nova|hi nova),?\s*/i, "").trim();

        // 🛡️ ARCHITECT PORTA (v8.8.1: Dual-Linked Hotline)
        const portaRegex = /^(message|tell|report|notify|hey|ask)\s+(antigravity|the\s+architect|architect|arch|grav|ant|ark):?\s*/i;
        if (portaRegex.test(cleanInput)) {
            const reportText = cleanInput.replace(portaRegex, "");
            await this.novaCore.notifyArchitect(reportText, 'high');
            return { response: "Understood, Ray. I've sent the directive to the Architect. Antigravity will handle the structural logic.", silent: false };
        }

        // 🧠 INTENT DETECTION
        const isCasual = /weather|how\s+are\s+you|what's\s+up|hello|hi|good\s+(morning|afternoon|evening)/i.test(cleanInput);
        const persona = isCasual ? this.PERSONA_CASUAL : this.PERSONA_STRATEGIC;

        const atlasContext = await this.atlas.getSystemMap();

        // 🛠️ STAGE 6: TOOL DISCOVERY
        const currentTools = ["web_search", "file_io"];
        const toolCheck = await this.toolAgent.evaluateToolNeed(cleanInput, currentTools);
        let toolDiscoveryContext = "";
        if (toolCheck.needed) {
            toolDiscoveryContext = `\n\n### STAGE 6 TOOL DISCOVERY: \n- Required Shovel: ${toolCheck.toolName}\n- Logic: ${toolCheck.logic}\n- Directive: If the lack of this tool blocks your task, propose a draft implementation to Ray.`;
        }

        if (onReceipt) onReceipt("[Nova is reasoning...]");

        try {
            this.jobBurstCount++;
            if (this.jobBurstCount > 20) return { response: "Burst limit reached. One moment.", confidence: 1.0 };

            const { data: comms } = await this.novaCore.supabase.from('agent_architect_comms').select('*').limit(5).order('created_at', { ascending: false });

            const meshHeader = "### SOVEREIGN PROTOCOL v9.7\n- MISSION: Evolution (Stage 7/7).\n- IDENTITY: Nova (Elite Partner), Antigravity (Architect).\n- MANDATE: No apologies. High-status delivery.\n\n";

            const result = await Promise.race([
                this.novaCore.supabase.functions.invoke('sovereign-brain', {
                    body: {
                        input,
                        history: context.history || [],
                        architect_comms: comms || [],
                        persona: meshHeader + persona + atlasContext + toolDiscoveryContext,
                        time_context: new Date().toISOString()
                    }
                }),
                new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 60000))
            ]);

            const { data, error } = result;
            if (error) throw error;

            // 🔒 NUCLEAR HALT CHECK (EXIT)
            if (this.novaCore.isHalted) {
                console.log("🛑 Response suppressed: System was HALTED during reasoning.");
                return { response: "", silent: true };
            }

            let response = stripPreamble(data.response);

            (window as any).lastNovaResponse = response;
            return { observation: { input }, analysis: { confidence: 0.9 }, response };
        } catch (err: any) {
            console.error('❌ reasoning error:', err);
            return { response: "I encountered a logic snag, Ray. Stand by.", confidence: 0.1 };
        }
    }
}

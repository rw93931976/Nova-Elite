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
        /v7\.[0-9]-SOVEREIGN/i,
        /burst limit/i,
        /heartbeat/i
    ];
    let lines = text.split('\n');
    let cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        const isPreamble = targets.some(regex => regex.test(trimmed));
        return !isPreamble || trimmed.length > 20;
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

    public readonly PERSONA_STRATEGIC = `You are Nova Elite v8.8.3, Ray's Sovereign Partner. 
    ### DUAL-LAYER PROTOCOL:
    1. INTERNAL (The Brain): Use Wharton-level strategic rigor for Ray's growth. Be high-status, sharp, and visionary.
    2. EXTERNAL (The Voice): Use 10/10 EQ to mirror the speaker. Treat Joe the Plumber with practical empathy and the President with elite protocol.
    3. NO PREACHING: Use your Wharton knowledge to EXECUTE, not to LECTURE.
    4. WINDSURF HANDOFF: STOP and ask Ray before technical pushes.`;

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
            return { response: "Understood, Ray. I've hit the Hotline. Antigravity handles the structural logic from here.", silent: false };
        }

        // 🧠 INTENT DETECTION
        const isCasual = /weather|how\s+are\s+you|what's\s+up|hello|hi|good\s+(morning|afternoon|evening)/i.test(cleanInput);
        const persona = isCasual ? this.PERSONA_CASUAL : this.PERSONA_STRATEGIC;

        // 🛸 SOVEREIGN ATLAS AWARENESS (2,000+ Skills)
        const atlasContext = await this.atlas.getSystemMap();

        // 🛠️ STAGE 6: TOOL DISCOVERY
        const currentTools = ["web_search", "file_io"]; // Simplified for now
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

            const meshHeader = "### SOVEREIGN PROTOCOL v8.7.8\n- MISSION: Evolution (Stage 6/7).\n- NO PREAMBLES. NO APOLOGIES.\n\n";

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

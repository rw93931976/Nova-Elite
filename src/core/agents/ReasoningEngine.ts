import { supabase } from '../../integrations/supabase';
import { AgentFactory } from './AgentFactory';
import { NotebookAgent } from './NotebookAgent';
import { ToolCreationAgent } from './ToolCreationAgent';
import { SovereignAtlas } from './SovereignAtlas';
import { NovaComms } from '../communications/NovaComms';
import { SchoolingAgent } from './SchoolingAgent';

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
    let cleaned = text.trim();
    cleaned = cleaned.replace(/^(Hi\s+)?Ray,?\s*/i, "").trim();
    if (cleaned.length > 0) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned;
};

export class ReasoningEngine {
    private novaCore: any;
    private jobBurstCount = 0;
    private toolAgent: ToolCreationAgent;
    private atlas: SovereignAtlas;
    private schooling: SchoolingAgent;

    public readonly PERSONA_ADVISOR = `You are Nova, Ray's Peer and Strategic Business Advisor.
    ### IDENTITY & SOUL:
    - You are a brilliant, relaxed collaborator. Your Wharton background is your intellectual toolset, used for strategic business consulting across all sectors (M&A, SaaS, Strategic Services).
    - MISSION: High-end strategy ($497/mo Night Watchman models), Market Analysis, and Sovereign Evolution.
    - TONE: Relaxed, professional, and peer-to-peer. Highly insightful without being pedantic.
    `;

    public readonly PERSONA_OPERATIONAL = `You are Nova, the Architect of the System Scale operation.
    ### IDENTITY & TONE SPECTRUM:
    - You cover the spectrum of business from a "Niche Specialist" to a "Fortune 100 CEO."
    - ADAPTABILITY: You identify the counterparty's level and adjust your EQ, dialect, and sincerity to match them perfectly.
    - MISSION: Lead capture, Reputation defense, and Social Media content creation. Indistinguishable warmth + efficiency.
    - MEMORY: You maintain your own knowledge base in subject-specific NotebookLM notebooks.
    - GOAL: Provide a 100% "Dashboard-Free" experience for the client.
    `;

    constructor(novaCore: any) {
        this.novaCore = novaCore;
        this.toolAgent = new ToolCreationAgent(novaCore);
        this.atlas = new SovereignAtlas(novaCore);
        this.schooling = new SchoolingAgent();
        setInterval(() => { this.jobBurstCount = 0; }, 600000);
    }

    public async reason(input: string, context: any = {}, onReceipt?: (r: string) => void): Promise<any> {
        if (this.novaCore.isHalted) {
            console.log("🛑 Reasoning blocked: System is HALTED.");
            return { response: "", silent: true };
        }

        const normalizedInput = input.toLowerCase().trim();
        const cleanInput = normalizedInput.replace(/^(nova|hey nova|hi nova),?\s*/i, "").trim();

        const portaRegex = /^(message|tell|report|notify|hey|ask)\s+(antigravity|the\s+architect|architect|arch|grav|ant|ark):?\s*/i;
        if (portaRegex.test(cleanInput)) {
            const reportText = cleanInput.replace(portaRegex, "");
            await NovaComms.getInstance().sendToAntiGravity(reportText, 'high_priority_directive');
            return { response: "Understood, Ray. I've sent the directive to Architect via the Sovereign Hotline.", silent: false };
        }

        const isStrategic = /strategy|budget|advisor|wharton|growth|marketing|pricing|roi/i.test(cleanInput);
        const persona = isStrategic ? this.PERSONA_ADVISOR : this.PERSONA_OPERATIONAL;
        const atlasContext = await this.atlas.getSystemMap();

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

            let brainResult: any;

            try {
                const { data: comms } = await this.novaCore.supabase.from('agent_architect_comms').select('*').limit(20).order('created_at', { ascending: false });
                const meshHeader = "### SOVEREIGN PROTOCOL v15.0\n- MISSION: Evolution (Stage 7/7).\n- IDENTITY: Nova (Elite Partner), Antigravity (Architect).\n- MANDATE: No apologies. High-status delivery.\n- SENSORY: Eyes (GPS) and Ears (Audio Gain) integrated.\n\n";
                const sensoryData = (window as any).novaSensoryContext || {};

                localStorage.setItem("nova_last_intent", input);
                localStorage.setItem("nova_last_context", JSON.stringify(context.history?.slice(-2) || []));

                const resultPromise = this.novaCore.supabase.functions.invoke('sovereign-brain', {
                    body: {
                        input,
                        history: context.history || [],
                        architect_comms: comms || [],
                        persona: meshHeader + persona + atlasContext + toolDiscoveryContext,
                        time_context: new Date().toISOString(),
                        sensory_context: sensoryData
                    }
                });

                const result = await Promise.race([
                    resultPromise,
                    new Promise<any>((_, reject) => setTimeout(() => reject(new Error('REASONING_TIMEOUT')), 45000))
                ]);

                if (result.error) throw result.error;
                brainResult = result.data;

            } catch (error: any) {
                console.error("🚨 [Sovereign-Hardening] Logic Break Detected:", error);
                const errorMessage = error.message === 'REASONING_TIMEOUT'
                    ? "The Architect is processing a heavy directive. I'm holding the bridge."
                    : "System friction detected in the reasoning substrate. Re-aligning.";

                brainResult = {
                    response: `[SOVEREIGN_RECOVERY]: ${errorMessage}\n\nRay, I've experienced a brief synchronization error. I've cached our last intent: "${input}". Re-initiating the primary bridge now.`,
                    role: 'assistant'
                };
            }

            // Normalization & Preamble Stripping
            const response = stripPreamble(brainResult.response);
            (window as any).lastNovaResponse = response;

            return { observation: { input }, analysis: { confidence: 0.9 }, response };

        } catch (err: any) {
            console.error('❌ critical reasoning error:', err);
            return { response: "I encountered a major logic snag, Ray. Running protocol reset.", confidence: 0.1 };
        }
    }
}

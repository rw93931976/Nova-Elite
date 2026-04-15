import { supabase } from "../integrations/supabase";
import { LiveEngine } from "./agents/LiveEngine";
import { NovaComms } from "./communications/NovaComms";
import { ReasoningEngine } from "./agents/ReasoningEngine";

export class NovaCore {
    private static instance: NovaCore;
    public supabase = supabase;

    public readonly version = 'v10.0-SOVEREIGN-ELITE';
    public isHalted: boolean = false;
    public liveEngine: LiveEngine;

    constructor() {
        if (NovaCore.instance) {
            return NovaCore.instance;
        }
        this.loadState();
        // SOVEREIGN: LiveEngine is initialized keyless. Key is on VPS.
        this.liveEngine = new LiveEngine();

        // 👂 RESTORE EARS: Initialize the Level 5 Communication Hub
        NovaComms.getInstance();
        NovaCore.instance = this;
    }

    public static getInstance(): NovaCore {
        if (!NovaCore.instance) {
            NovaCore.instance = new NovaCore();
        }
        return NovaCore.instance;
    }

    async initialize() {
        console.log("🛰️ [NovaCore] System Initialized");
    }

    async processElite(input: string, context: any = {}, onReceipt?: (r: string) => void) {
        const engine = new ReasoningEngine(this);
        return engine.reason(input, context, onReceipt);
    }

    async startLiveSession() {
        const engine = new ReasoningEngine(this);
        const basePersona = engine.PERSONA_STRATEGIC;

        let groundingData = "\n### CURRENT RESEARCH GROUNDING:\n";
        groundingData += `
        [The Mission]: High-end strategy and market transition models for elite partners.
        [Status]: Level 10 Sovereign Autonomy - Pathing to AGI.
        `;

        this.liveEngine.onToolCall(async (name, args) => {
            console.log(`📡 [NovaCore] Executing Live Tool: ${name}`);
            const { data: job } = await this.supabase
                .from('relay_jobs')
                .insert({ type: name, payload: args, status: 'pending' })
                .select('id')
                .single();

            if (job) {
                return new Promise((resolve) => {
                    const timer = setInterval(async () => {
                        const { data } = await this.supabase.from('relay_jobs').select('status, result').eq('id', job.id).single();
                        if (data && data.status === 'completed') {
                            clearInterval(timer);
                            resolve(data.result);
                        }
                    }, 500);
                    setTimeout(() => { clearInterval(timer); resolve("TIMEOUT"); }, 30000);
                });
            }
            return "ERROR: Job creation failed";
        });

        await this.liveEngine.connect(basePersona + groundingData);
    }

    stopLiveSession() {
        this.liveEngine.disconnect();
    }

    notifyArchitect(message: string, priority: 'low' | 'med' | 'high' = 'med') {
        return this.supabase.from('agent_architect_comms').insert([
            { sender: 'nova', recipient: 'architect', message, priority, status: 'unread' }
        ]);
    }

    toggleHalt() {
        this.isHalted = !this.isHalted;
        this.saveState();
    }

    private saveState() {
        localStorage.setItem('nova_core_state', JSON.stringify({ isHalted: this.isHalted }));
        localStorage.setItem('nova_version_tag', this.version);
    }

    private loadState() {
        const saved = localStorage.getItem('nova_core_state');
        if (saved) {
            const state = JSON.parse(saved);
            this.isHalted = state.isHalted;
        }

        const currentTag = this.version;
        if (localStorage.getItem('nova_version_tag') !== currentTag) {
            localStorage.clear();
            localStorage.setItem('nova_version_tag', currentTag);
        }
    }
}

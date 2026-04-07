import { createClient } from "@supabase/supabase-js";
import { LiveEngine } from "./agents/LiveEngine";

export class NovaCore {
    public supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || "",
        import.meta.env.VITE_SUPABASE_ANON_KEY || ""
    );

    private startTime: number = Date.now();
    private interferenceLog: Array<{ time: number; type: string; detail: string }> = [];

    public readonly version = 'v10.0.0-SOVEREIGN-LIVE';
    public isHalted: boolean = false;
    public beastModeEnabled: boolean = false;
    public liveEngine: LiveEngine;
    private currentHealth: any = { status: 'online', bridge: 'offline', database: 'online', lastBridgePulse: 0 };

    constructor() {
        this.loadState();
        this.liveEngine = new LiveEngine();
    }

    async initialize() {
        const { data, error } = await this.supabase
            .from('agent_architect_comms')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data[0]) {
            this.currentHealth.lastBridgePulse = new Date(data[0].created_at).getTime();
            this.currentHealth.bridge = (Date.now() - this.currentHealth.lastBridgePulse < 60000) ? 'online' : 'stale';
        }
    }

    /**
     * SOVEREIGN LIVE (v10.0)
     * Starts the multimodal live session with the Strategic Persona.
     */
    async startLiveSession() {
        const { ReasoningEngine } = await import("./agents/ReasoningEngine");
        const persona = new ReasoningEngine(this).persona_strategic;

        // SOVEREIGN AGENCY: Register tool handler
        this.liveEngine.onToolCall(async (name, args) => {
            console.log(`📡 [NovaCore] Executing Live Tool: ${name}`);
            try {
                const { data: job, error } = await this.supabase
                    .from('relay_jobs')
                    .insert({ type: name, payload: args, status: 'pending' })
                    .select('id')
                    .single();

                if (error) throw error;

                // Poll for completion (Real-time bridge)
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
            } catch (e) {
                return `ERROR: ${e}`;
            }
        });

        // SOVEREIGN SOUL TRAINING: Register prosody handler
        this.liveEngine.onProsody((data) => {
            this.logProsodyToVPS(data);
        });

        await this.liveEngine.connect(persona);
    }

    private async logProsodyToVPS(data: any) {
        try {
            await fetch('/bridge-vps/prosody', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            // Passive failure—don't block the live stream
        }
    }

    stopLiveSession() {
        this.liveEngine.disconnect();
    }

    notifyArchitect(message: string, priority: 'low' | 'med' | 'high' = 'med') {
        return this.supabase.from('agent_architect_comms').insert([
            { sender: 'nova', recipient: 'architect', message, priority, status: 'unread' }
        ]);
    }

    async processElite(input: string, context: any = {}, onReceipt?: (r: string) => void) {
        // This is bridged to the ReasoningEngine which handles the Persona
        const { ReasoningEngine } = await import("./agents/ReasoningEngine");
        const engine = new ReasoningEngine(this);
        return engine.reason(input, context, onReceipt);
    }

    toggleHalt() {
        this.isHalted = !this.isHalted;
        this.saveState();
    }

    private saveState() {
        localStorage.setItem('nova_core_state', JSON.stringify({ isHalted: this.isHalted }));
        localStorage.setItem('nova_version_tag', 'sovereign-v10.0.0');
    }

    private loadState() {
        const saved = localStorage.getItem('nova_core_state');
        if (saved) {
            const state = JSON.parse(saved);
            this.isHalted = state.isHalted;
        }

        const currentTag = 'sovereign-v10.0.0';
        if (localStorage.getItem('nova_version_tag') !== currentTag) {
            console.warn(`🔄 Version mismatch detected. Busting cache.`);
            localStorage.clear();
            localStorage.setItem('nova_version_tag', currentTag);
        }
    }
}

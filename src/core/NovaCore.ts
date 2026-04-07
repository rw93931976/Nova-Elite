import { createClient } from "@supabase/supabase-js";
import { LiveEngine } from "./agents/LiveEngine";
import { NovaComms } from "./communications/NovaComms";

export class NovaCore {
    public supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || "",
        import.meta.env.VITE_SUPABASE_ANON_KEY || ""
    );

    public readonly version = 'v10.1.0-S-RELAY';
    public isHalted: boolean = false;
    public liveEngine: LiveEngine;

    constructor() {
        this.loadState();
        // SOVEREIGN: LiveEngine is initialized keyless. Key is on VPS.
        this.liveEngine = new LiveEngine();

        // 👂 RESTORE EARS: Initialize the Level 5 Communication Hub
        NovaComms.getInstance();
    }

    async startLiveSession() {
        const { ReasoningEngine } = await import("./agents/ReasoningEngine");
        const persona = new ReasoningEngine(this).persona_strategic;

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

        await this.liveEngine.connect(persona);
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
        localStorage.setItem('nova_version_tag', 'sovereign-v10.1.0');
    }

    private loadState() {
        const saved = localStorage.getItem('nova_core_state');
        if (saved) {
            const state = JSON.parse(saved);
            this.isHalted = state.isHalted;
        }

        const currentTag = 'sovereign-v10.1.0';
        if (localStorage.getItem('nova_version_tag') !== currentTag) {
            localStorage.clear();
            localStorage.setItem('nova_version_tag', currentTag);
        }
    }
}

import { createClient } from "@supabase/supabase-js";

export class NovaCore {
    public supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL || "",
        import.meta.env.VITE_SUPABASE_ANON_KEY || ""
    );

    private startTime: number = Date.now();
    private interferenceLog: Array<{ time: number; type: string; detail: string }> = [];

    public readonly version = 'v9.7.1-SOVEREIGN';
    public isHalted: boolean = false;
    public beastModeEnabled: boolean = false;
    private currentHealth: any = { status: 'online', bridge: 'offline', database: 'online', lastBridgePulse: 0 };

    constructor() {
        this.loadState();
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
        localStorage.setItem('nova_version_tag', 'sovereign-v9.7.1');
    }

    private loadState() {
        const saved = localStorage.getItem('nova_core_state');
        if (saved) {
            const state = JSON.parse(saved);
            this.isHalted = state.isHalted;
        }

        const currentTag = 'sovereign-v9.7.1';
        if (localStorage.getItem('nova_version_tag') !== currentTag) {
            console.warn(`🔄 Version mismatch detected. Busting cache.`);
            localStorage.clear();
            localStorage.setItem('nova_version_tag', currentTag);
        }
    }
}

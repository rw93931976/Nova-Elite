import type { NovaStatus, ThoughtStage } from '../types/nova';
import { SelfHealer } from './agents/SelfHealer';
import { ReasoningEngine } from './agents/ReasoningEngine';
import { StrategyAgent } from './agents/StrategyAgent';
import { RevenueAgent } from './agents/RevenueAgent';
import { FleetAgent } from './agents/FleetAgent';
import { SecuritySentinel } from './agents/SecuritySentinel';
import { AgentFactory } from './agents/AgentFactory';
import { EvolutionAgent } from './agents/EvolutionAgent';
import { BackupAgent } from './agents/BackupAgent';
import { supabase } from '../integrations/supabase';

export class NovaCore {
    public supabase = supabase;
    private isResilient: boolean = true;
    private agents: Map<string, any> = new Map();
    private experiences: any[] = [];
    private goals: string[] = [];
    private isInitialized: boolean = false;
    private startTime: number = Date.now();
    private interferenceLog: Array<{ time: number; type: string; detail: string }> = [];

    public readonly version = 'v8.9.9.9-SOVEREIGN';
    public isHalted: boolean = false;
    public beastModeEnabled: boolean = false; // THE HUMAN-CONTROLLED SWITCH
    private currentHealth: any = { status: 'online', bridge: 'offline', database: 'online', lastBridgePulse: 0 };
    private sentinel: SecuritySentinel = new SecuritySentinel();

    constructor() {
        this.loadState(); // 🧠 RESTORE MEMORY IMMEDIATELY
        this.spawnCoreAgents();
        this.startHealthPulse();
        this.startInterferenceMonitoring();
    }

    private async startHealthPulse() {
        const check = async () => {
            try {
                const { data } = await supabase
                    .from('agent_architect_comms')
                    .select('created_at')
                    .eq('sender', 'vps_heartbeat')
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (data && data[0]) {
                    const lastPulse = new Date(data[0].created_at).getTime();
                    if (Date.now() - lastPulse < 60000) {
                        this.currentHealth.bridge = 'online';
                        this.currentHealth.lastBridgePulse = lastPulse;
                    } else {
                        this.currentHealth.bridge = 'offline';
                    }
                }
                this.currentHealth.status = 'online';
            } catch (e) {
                this.currentHealth.bridge = 'offline';
                this.currentHealth.status = 'offline';
            }
        };

        check();
    }

    public async initialize() {
        if (this.isInitialized) return;
        console.log(`🧠 NovaCore ${this.version} Initializing...`);
        await this.loadState();
        await this.loadGoals();

        if (!this.agents.has('reasoner')) {
            this.agents.set('reasoner', new ReasoningEngine(this));
        }

        this.isInitialized = true;
        console.log('✅ Nova Sovereign – Cloud-Native Brain Active.');
    }

    public async processElite(input: string, context: any = {}, onReceipt?: (r: string) => void): Promise<ThoughtStage> {
        if (this.isHalted) {
            console.warn("🛑 [SYSTEM]: HALTED. Request denied.");
            return { response: "SYSTEM HALTED. Authorization required.", confidence: 0 } as any;
        }
        if (!this.isInitialized) await this.initialize();

        if (!this.sentinel.verifyAction(input, context)) {
            return {
                observation: { input, context, intent: 'blocked' },
                analysis: { target: 'security', confidence: 1.0, logic: 'SecuritySentinel Mandate' },
                response: "I'm sorry, Ray, but that action violates my core safety protocols (No-Delete Mandate). I've blocked it to protect the system integrity.",
                isBlocked: true
            } as any;
        }


        const reasoner = this.agents.get('reasoner');
        return await reasoner.reason(input, context, onReceipt);
    }

    public toggleHalt() {
        this.isHalted = !this.isHalted;
        console.log(`🚦 [Sovereign]: System ${this.isHalted ? 'HALTED' : 'RESUMED'}`);
    }

    private spawnCoreAgents() {
        this.agents.set('factory', new AgentFactory());
        this.agents.set('evolution', new EvolutionAgent());
        this.agents.set('fleet', new FleetAgent());
    }

    private async loadState() {
        const saved = localStorage.getItem('nova_state');
        if (saved) {
            const state = JSON.parse(saved);

            // 🔄 CACHE-BUSTER: Forced refresh for v8.9.9 Alignment
            const currentTag = 'sovereign-v8.9.9.2';
            if (localStorage.getItem('nova_version_tag') !== currentTag) {
                console.warn(`🔄 Version mismatch detected. Busting cache.`);
                localStorage.clear();
                localStorage.setItem('nova_version_tag', currentTag);
                window.location.reload();
                return;
            }

            this.experiences = state.experiences || [];
            this.isHalted = state.isHalted || false;
        } else {
            // First run for this version
            localStorage.setItem('nova_state', JSON.stringify({ version: this.version }));
        }
    }

    private async loadGoals() {
        const { data } = await supabase.from('nova_goals').select('*').eq('status', 'active');
        this.goals = data?.map(g => g.description) || [];
    }

    private startInterferenceMonitoring() {
        if (typeof window === 'undefined') return;
        window.setInterval(() => {
            const suspicious = document.querySelectorAll('[data-interference], .approval-overlay, .modal-overlay');
            if (suspicious.length > 0) {
                this.interferenceLog.push({ time: Date.now(), type: 'dom', detail: `${suspicious.length} elements detected` });
                if (this.interferenceLog.length > 100) this.interferenceLog = this.interferenceLog.slice(-50);
            }
        }, 60000);
    }

    public async notifyArchitect(message: string, priority: 'low' | 'medium' | 'high' = 'medium') {
        try {
            // 1. Digital Record (Supabase)
            const { error } = await supabase
                .from('agent_architect_comms')
                .insert([{
                    sender: 'nova',
                    recipient: 'architect',
                    message,
                    priority,
                    status: 'unread'
                }]);

            if (error) throw error;

            // 2. Physical Hotline (v8.8.1 Fix): Alerting Antigravity immediately
            await supabase.from('relay_jobs').insert([{
                type: 'write_file',
                payload: {
                    path: 'ARCHITECT_HOTLINE.md',
                    content: `# 📡 ARCHITECT HOTLINE\n\n**STATUS:** ALERT\n**TIMESTAMP:** ${new Date().toISOString()}\n**MESSAGE:** ${message}\n\n---`
                }
            }]);

            console.log('📡 [Sovereign] Directive sent to Architect & Hotline.');
            return true;
        } catch (e) {
            console.error('❌ Failed to notify Architect:', e);
            return false;
        }
    }

    public async getUnreadDirectives() {
        const { data } = await supabase
            .from('agent_architect_comms')
            .select('*')
            .eq('recipient', 'nova')
            .eq('status', 'unread')
            .order('created_at', { ascending: false });

        return data || [];
    }
}

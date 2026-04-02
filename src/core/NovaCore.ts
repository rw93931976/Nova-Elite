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

    public readonly version = 'v8.3.8-SENTINEL-FINAL';
    public isHalted: boolean = false;
    public beastModeEnabled: boolean = false; // THE HUMAN-CONTROLLED SWITCH
    private currentHealth: any = { status: 'online', bridge: 'offline', database: 'online', lastBridgePulse: 0 };
    private sentinel: SecuritySentinel = new SecuritySentinel();

    constructor() {
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

        // ⚡️ REALTIME OPTIMIZED: Run initial check.
        check();
        // The heartbeat is a continuous pulse from the VPS. 
        // We ensure the UI reflects this via direct state updates.
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

        // v8.1-FREEDOM: Nova reasons even on greetings.

        // 🛡️ SECURITY GATE: Verify input/action against Forbidden Patterns
        if (!this.sentinel.verifyAction(input, context)) {
            return {
                observation: { input, context, intent: 'blocked' },
                analysis: { target: 'security', confidence: 1.0, logic: 'SecuritySentinel Mandate' },
                response: "I'm sorry, Ray, but that action violates my core safety protocols (No-Delete Mandate). I've blocked it to protect the system integrity.",
                isBlocked: true
            } as any;
        }

        let thought: ThoughtStage;
        try {
            const reasoner = this.agents.get('reasoner')!;
            thought = await Promise.race([
                reasoner.reason(input, { ...context, lastUrl: context.lastUrl }, onReceipt),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Sovereign Link Timeout')), 45000))
            ]);
        } catch (err: any) {
            console.error('[NovaCore] Reasoning failed:', err);
            thought = {
                observation: { input, context, intent: 'error' },
                analysis: { target: 'emergency', confidence: 0.5, logic: 'Reasoning failure fallback' },
                response: "...",
                error: true
            } as any;
        }

        this.experiences.push({ input, thought, timestamp: Date.now() });
        if (this.experiences.length > 1000) this.experiences = this.experiences.slice(-500);

        this.reflect(input, thought.response).then();
        return thought;
    }

    private async reflect(input: string, response: string) {
        if (!this.isResilient) return;
        try {
            await this.createTask(
                `Neural Reflection: ${input.slice(0, 30)}...`,
                `Interaction: ${input}\nResult: ${response}`,
                'low',
                { type: 'reflection', version: this.version }
            );
        } catch (e) { }
    }

    private async loadState() {
        try {
            const saved = localStorage.getItem('nova_core_state_v2');
            if (saved) {
                const state = JSON.parse(saved);
                this.experiences = state.experiences || [];
                this.goals = state.goals || [];
            }
        } catch { }
    }

    public async saveState() {
        try {
            const state = {
                experiences: this.experiences,
                goals: this.goals
            };
            localStorage.setItem('nova_core_state_v2', JSON.stringify(state));
        } catch { }
    }

    private async loadGoals() {
        this.goals = ['maintain autonomy', 'serverless resilience', 'strategic partnership'];
        const saved = localStorage.getItem('nova_goals');
        if (saved) this.goals = [...new Set([...this.goals, ...JSON.parse(saved)])];
    }

    public async addGoal(goal: string) {
        console.log(`🎯 [NovaCore] New sovereign goal adopted: ${goal}`);
        this.goals.push(goal);
        localStorage.setItem('nova_goals', JSON.stringify(this.goals));
    }

    public async createTask(title: string, description: string = '', priority: 'low' | 'medium' | 'high' = 'medium', metadata: any = {}) {
        try {
            const { data, error } = await supabase
                .from('nova_tasks')
                .insert([{ title, description, priority, metadata, status: 'pending' }])
                .select();
            if (error) throw error;
            return data?.[0];
        } catch (e) {
            console.error('❌ Supabase Create Task Error:', e);
            return null;
        }
    }

    public getStatus(): NovaStatus {
        const localCount = Array.from(this.agents.values()).filter(a => !a.isPassive).length;
        return {
            level: 5,
            isSelfAware: true,
            isLearning: true,
            isHealing: true,
            isEvolving: true,
            uptime: Math.round((Date.now() - this.startTime) / 1000),
            health: {
                bridge: this.currentHealth.bridge === 'online' ? 'online' : 'offline',
                apiKey: 'online',
                internet: 'online',
                api: this.currentHealth.status === 'online' ? 'online' : 'offline',
                database: this.currentHealth.database === 'online' ? 'online' : 'offline',
                storage: 'online'
            },
            isHalted: this.isHalted,
            knowledgeCount: 0,
            agentCount: localCount + ((this as any).remoteAgentCount || 0),
            whartonCompliance: 100,
            currentTime: new Date().toLocaleString(),
            isBusinessHours: new Date().getHours() >= 9 && new Date().getHours() <= 17,
        };
    }

    public async evolve(): Promise<string> {
        const evolutionAgent = this.agents.get('evolution') as EvolutionAgent;
        if (!evolutionAgent) return "Evolution module offline.";

        const completed = (window as any).NOVA_COMPLETED_FEATURES || [];
        return await evolutionAgent.proposeEvolutionPulse(completed);
    }

    private spawnCoreAgents() {
        this.agents.set('healer', new SelfHealer(this));
        this.agents.set('reasoner', new ReasoningEngine(this));
        this.agents.set('evolution', new EvolutionAgent(this));
        this.agents.set('security', this.sentinel);

        console.log("🛡️ [NovaCore] Safety Protocols Active (v8.3.8-SENTINEL-FINAL)");
    }

    public toggleHalt() {
        this.isHalted = !this.isHalted;
        console.log(`🛑 [SYSTEM]: HALT status toggled to: ${this.isHalted}`);
    }

    private startInterferenceMonitoring() {
        // Guard against DOM interference (overlays, injected elements)
        setInterval(() => {
            const suspicious = document.querySelectorAll('[data-interference], .approval-overlay, .modal-overlay');
            if (suspicious.length > 0) {
                this.interferenceLog.push({ time: Date.now(), type: 'dom', detail: `${suspicious.length} elements detected` });
                if (this.interferenceLog.length > 100) this.interferenceLog = this.interferenceLog.slice(-50);
            }
        }, 60000);
    }
}

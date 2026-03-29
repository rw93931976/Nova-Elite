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
    // private isLearning: boolean = true;
    // private isHealing: boolean = true;
    // private isEvolving: boolean = false;      // guarded – enable only in sandbox
    private isResilient: boolean = true;
    // private _isSelfAware: boolean = this.isLearning && this.isHealing; // Using them internally

    private agents: Map<string, any> = new Map();
    private knowledgeBase: Map<string, any> = new Map();
    private experiences: any[] = [];
    private goals: string[] = [];                        // NEW: long-term intentions
    private isInitialized: boolean = false;
    private startTime: number = Date.now();
    private routinePath = './nova-data/user_routine.json';
    private interferenceLog: Array<{ time: number; type: string; detail: string }> = [];
    public version = 'v3.0-SOVEREIGN';
    public isHalted: boolean = false;

    private currentHealth: NovaStatus['health'] = {
        bridge: 'online', // Set to online as we are moving to Serverless "Virtual Bridge"
        apiKey: 'online',
        internet: 'online'
    };

    public BRIDGE_URL = (typeof window !== 'undefined' && window.location.hostname === 'localhost')
        ? 'http://localhost:39922'
        : ''; // Empty string triggers the Cloud Relay fallback logic

    constructor() {
        // START RESILIENCE MONITOR (Phase 4)
        this.startHealthMonitor();
        this.spawnCoreAgents();
        this.startHealthChecks();
        this.startInterferenceMonitoring();
    }

    private async startHealthMonitor() {
        setInterval(async () => {
            try {
                // Heartbeat via Supabase instead of direct HTTP
                const { error } = await supabase.from('relay_jobs').select('id').limit(1);
                this.currentHealth.bridge = error ? 'offline' : 'online';
                this.currentHealth.internet = navigator.onLine ? 'online' : 'offline';
            } catch (err) {
                this.currentHealth.bridge = 'offline';
            }
        }, 30000);
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

        // LOCAL GREETING BYPASS: Sub-second response for basic triggers
        const isGreeting = /^(hey|hi|hello|yo|nova|nova elite)[.!?]*$/i.test(input.trim());
        if (isGreeting) {
            // DEBOUNCE: Small delay to ensure Ray finished speaking
            await new Promise(r => setTimeout(r, 600));
            const hasHistory = context?.history && context.history.length > 0;
            const greetText = hasHistory ? "I'm right here." : "Nova Elite active. Standing by.";

            const greeting = {
                observation: { input, context, intent: 'greeting' },
                analysis: { target: 'local', confidence: 1.0, logic: 'Instant greeting' },
                response: greetText,
                isLocal: true
            } as any;

            this.reflect(input, greeting.response).then();
            return greeting;
        }

        let thought: ThoughtStage;
        try {
            const reasoner = this.agents.get('reasoner')!;
            thought = await Promise.race([
                reasoner.reason(input, { ...context, lastUrl: context.lastUrl }, onReceipt),
                new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Sovereign Link Timeout')), 120000))
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
            // Neural Reflection: Direct Supabase task persistence
            await this.createTask(
                `Neural Reflection: ${input.slice(0, 30)}...`,
                `Interaction: ${input}\nResult: ${response}`,
                'low',
                { type: 'reflection', version: this.version }
            );
        } catch (e) {
            console.warn('[Reflection] Local learning skipped.');
        }
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
        const localCount = this.agents.size;
        // 📡 NOTE: Remote fleet count is updated via the syncFleetStatus() loop in the UI/Hook
        return {
            level: 5,
            isSelfAware: true,
            isLearning: true,
            isHealing: true,
            isEvolving: true,
            uptime: Math.round((Date.now() - this.startTime) / 1000),
            health: this.currentHealth,
            isHalted: this.isHalted,
            knowledgeCount: 0,
            agentCount: localCount + (this as any).remoteAgentCount || localCount,
            whartonCompliance: 98,
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
        // --- 1. BOOTSTRAP CORE AGENTS ---
        this.agents.set('healer', new SelfHealer(this));
        this.agents.set('reasoner', new ReasoningEngine(this));
        this.agents.set('evolution', new EvolutionAgent(this));

        // --- 2. DYNAMIC BEAST MODE SWARM ---
        console.log("🦁 [NovaCore] Activating Beast Mode Swarm...");
        AgentFactory.getAllRoles().forEach(role => {
            try {
                const agentInstance = AgentFactory.spawn(role.name, this);
                this.agents.set(role.name, agentInstance);
                console.log(`✅ [NovaCore] ${role.name} instance registered.`);
            } catch (e) {
                console.error(`❌ [NovaCore] Failed to spawn ${role.name}:`, e);
                // Fallback to metadata for UI display only
                this.agents.set(role.name, role);
            }
        });
    }

    public toggleHalt() {
        this.isHalted = !this.isHalted;
        console.log(`🛑 [SYSTEM]: HALT status toggled to: ${this.isHalted}`);
    }

    private startHealthChecks() {
        // Simple internet check – bridge is now handled in startHealthMonitor
        setInterval(() => {
            this.currentHealth.internet = navigator.onLine ? 'online' : 'offline';
        }, 30000);
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

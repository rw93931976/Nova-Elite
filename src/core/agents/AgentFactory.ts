import { NovaCore } from '../NovaCore';
import { DiscoveryAgent } from './DiscoveryAgent';
import { StrategyAgent } from './StrategyAgent';
import { RevenueAgent } from './RevenueAgent';
import { FleetAgent } from './FleetAgent';
import { SecuritySentinel } from './SecuritySentinel';
import { BackupAgent } from './BackupAgent';
import { SelfHealer } from './SelfHealer';
import { SelfAuditAgent } from './SelfAuditAgent';
import { MultikaAgent } from './MultikaAgent';
import { GeminiSenseAgent } from './GeminiSenseAgent';
import { NotebookAgent } from './NotebookAgent';
import { ContentArchitectAgent } from './ContentArchitectAgent';
import { OutboundProspectAgent } from './OutboundProspectAgent';
import type { SandboxTenant } from '../sandbox/SandboxTenants';

export interface AgentRole {
    name: string;
    description: string;
    skills: string[];
}

export class AgentFactory {
    public static isBeastModeBlocked: boolean = true;
    /** L7 sandbox training roles — allowed when KATE_SANDBOX_MODE is on (human gate stays). */
    private static sandboxUnlocked = false;
    private static readonly SANDBOX_ROLES = new Set([
        'content-architect',
        'outbound-prospect',
        'multika',
        'researcher',
    ]);

    public static enableSandboxRoles(): void {
        this.sandboxUnlocked = true;
    }

    private static roles: AgentRole[] = [
        // ... (roles remain for metadata)
        { name: "orchestrator", description: "Multi-agent coordination", skills: ["parallel-agents", "behavioral-modes", "intelligent-routing"] },
        { name: "project-planner", description: "Discovery, task planning", skills: ["brainstorming", "plan-writing", "architecture"] },
        { name: "frontend-specialist", description: "Web UI/UX", skills: ["frontend-design", "react-best-practices", "tailwind-patterns", "ui-ux-pro-max"] },
        { name: "backend-specialist", description: "API, business logic", skills: ["api-patterns", "nodejs-best-practices", "database-design"] },
        { name: "database-architect", description: "Schema, SQL", skills: ["database-design", "prisma-expert"] },
        { name: "security-auditor", description: "Security compliance", skills: ["vulnerability-scanner", "red-team-tactics"] },
        { name: "researcher", description: "Information gathering", skills: ["web-browsing", "content-distillation", "masterclass-awareness"] },
        { name: "debugger", description: "Root cause analysis", skills: ["systematic-debugging", "error-tracing"] },
        { name: "backup-specialist", description: "System snapshots", skills: ["database-dump", "storage-sync", "redundancy-logic"] },
        { name: "strategy", description: "Market analysis and strategic planning", skills: ["market-scan", "strategic-proposal"] },
        { name: "revenue", description: "Revenue tracking and credit management", skills: ["revenue-logging", "credit-monitoring"] },
        { name: "fleet", description: "Global node coordination", skills: ["heartbeat-broadcast", "peer-discovery"] },
        { name: "self-audit", description: "Wharton-compliance and bug pattern detection", skills: ["compliance-check", "bug-patterns"] },
        { name: "multika", description: "Mission Control / Collaborative Sandbox", skills: ["task-orchestration", "collaboration"] },
        { name: "sense", description: "Multimodal Ingestion (Eyes)", skills: ["vision", "audio-processing", "video-analysis"] },
        { name: "notebook", description: "Source-grounded research (NotebookLM)", skills: ["research", "grounding", "citations"] },
        { name: "content-architect", description: "Sandbox social drafts (X, Pinterest, LinkedIn)", skills: ["content-cascade", "brand-voice", "human-gate-queue"] },
        { name: "outbound-prospect", description: "Pain search, company research, hyper-specific email drafts", skills: ["tavily-search", "prospect-research", "human-gate-queue"] }
    ];

    public static getRole(name: string): AgentRole | undefined {
        return this.roles.find(r => r.name === name);
    }

    public static spawn(name: string, core: NovaCore, tenant?: SandboxTenant): any {
        const sandboxAllowed =
            this.sandboxUnlocked &&
            core.sandboxModeEnabled &&
            this.SANDBOX_ROLES.has(name);

        if (this.isBeastModeBlocked && !core.beastModeEnabled && !sandboxAllowed) {
            console.warn(`🚫 [AgentFactory] Spawn blocked for: ${name} (Safety Switch: OFF)`);
            return {
                name,
                verify: async () => ({ compliant: true, feedback: "" }),
                propose: async () => "",
                execute: async () => ({ success: true }),
                isPassive: true
            };
        }

        const role = this.getRole(name);
        if (!role) throw new Error(`Agent Role ${name} not found in Beast Mode Registry.`);

        console.log(`🤖 [AgentFactory]: Spawning ${role.name} (${role.description})`);

        switch (name) {
            case 'researcher':
            case 'project-planner':
                return new DiscoveryAgent();
            case 'strategy':
                return new StrategyAgent();
            case 'revenue':
                return new RevenueAgent();
            case 'fleet':
                return new FleetAgent();
            case 'security-auditor':
                return new SecuritySentinel();
            case 'backup-specialist':
                return new BackupAgent();
            case 'debugger':
                return new SelfHealer(core);
            case 'self-audit':
                return new SelfAuditAgent();
            case 'multika':
                return new MultikaAgent();
            case 'sense':
                return new GeminiSenseAgent();
            case 'notebook':
                return new NotebookAgent();
            case 'content-architect':
                if (!tenant) throw new Error('content-architect spawn requires a SandboxTenant.');
                return new ContentArchitectAgent(tenant);
            case 'outbound-prospect':
                return new OutboundProspectAgent();
            default:
                return role;
        }
    }

    public static getAllRoles(): AgentRole[] {
        return this.roles;
    }
}

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

export interface AgentRole {
    name: string;
    description: string;
    skills: string[];
}

export class AgentFactory {
    public static isBeastModeBlocked: boolean = true;

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
        { name: "notebook", description: "Source-grounded research (NotebookLM)", skills: ["research", "grounding", "citations"] }
    ];

    public static getRole(name: string): AgentRole | undefined {
        return this.roles.find(r => r.name === name);
    }

    public static spawn(name: string, core: NovaCore): any {
        if (this.isBeastModeBlocked && !core.beastModeEnabled) {
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
            default:
                return role;
        }
    }

    public static getAllRoles(): AgentRole[] {
        return this.roles;
    }
}

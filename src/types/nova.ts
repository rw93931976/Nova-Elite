// Nova Elite - Level 5 Autonomy Types

export interface ThoughtStage {
    observation: any;
    analysis: any;
    reasoning: any;
    planning: any;
    execution: any;
    response: string;
    receipt?: string;
    confidence: number;
    consentRequired?: boolean;
}

export interface NovaStatus {
    level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    isSelfAware: boolean;
    isLearning: boolean;
    isHealing: boolean;
    isEvolving: boolean;
    isHalted?: boolean;
    uptime: number;
    health: {
        bridge: 'online' | 'offline';
        apiKey: 'online' | 'offline';
        internet: 'online' | 'offline';
    };
    knowledgeCount: number;
    agentCount: number;
    whartonCompliance: number;
    currentTime?: string;
    isBusinessHours?: boolean;
}

export interface Message {
    id: string;
    from: 'user' | 'nova' | 'cascade' | 'antigravity' | 'bridge' | 'assistant' | 'swarm' | 'windsurf';
    to: 'user' | 'nova' | 'cascade' | 'antigravity' | 'bridge' | 'assistant' | 'swarm' | 'windsurf';
    content: string;
    timestamp: number;
    type: 'sent' | 'received';
    status: 'pending' | 'delivered' | 'failed';
}

// 🛡️ v3.5.8 Fix: Explicit value export to prevent SyntaxError in certain Vite builds
export const NOVA_VERSION_TOKEN = "SOVEREIGN_V9";

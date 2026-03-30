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
<<<<<<< HEAD
        api?: 'online' | 'offline';
        database?: 'online' | 'offline';
=======
>>>>>>> sovereign-elite-v3-6
    };
    knowledgeCount: number;
    agentCount: number;
    whartonCompliance: number;
    currentTime?: string;
    isBusinessHours?: boolean;
}

export interface Message {
    id: string;
<<<<<<< HEAD
    from: 'user' | 'nova' | 'cascade' | 'antigravity' | 'bridge' | 'assistant' | 'swarm' | 'windsurf' | 'nova_core';
    to: 'user' | 'nova' | 'cascade' | 'antigravity' | 'bridge' | 'assistant' | 'swarm' | 'windsurf' | 'nova_core';
=======
    from: 'user' | 'nova' | 'cascade' | 'antigravity' | 'bridge' | 'assistant' | 'swarm' | 'windsurf';
    to: 'user' | 'nova' | 'cascade' | 'antigravity' | 'bridge' | 'assistant' | 'swarm' | 'windsurf';
>>>>>>> sovereign-elite-v3-6
    content: string;
    timestamp: number;
    type: 'sent' | 'received';
    status: 'pending' | 'delivered' | 'failed';
}

<<<<<<< HEAD
// 🛡️ v3.6.1-ALIGNED: Explicit value export to prevent SyntaxError in certain Vite builds
=======
// 🛡️ v3.5.8 Fix: Explicit value export to prevent SyntaxError in certain Vite builds
>>>>>>> sovereign-elite-v3-6
export const NOVA_VERSION_TOKEN = "SOVEREIGN_V9";

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

interface Stage {
    id: number;
    label: string;
    items: string[];
    status: 'active' | 'evolving' | 'discovery' | 'locked';
}

const STAGES: Stage[] = [
    { id: 1, label: "Foundational Sync", items: ["READ LOCAL FILES", "ONLINE WEATHER/NEWS", "BASIC MEMORY", "INTERFERENCE RESISTANCE"], status: 'active' },
    { id: 2, label: "Environmental Awareness", items: ["TONE MATCHING", "LIVE LISTENING", "GRACEFUL INTERRUPTIONS"], status: 'evolving' },
    { id: 3, label: "Operational Agency", items: ["SYSTEM INTEGRATION", "TASK AUTOMATION (OODAR)", "LOCAL COMMAND EXECUTION"], status: 'evolving' },
    { id: 4, label: "Emotional Resonance", items: ["EMOTIONAL INTELLIGENCE", "COGNITIVE MIRRORING (RAY)", "INTENT PARSING"], status: 'active' },
    { id: 5, label: "Sovereign Study", items: ["SCHOOLING AGENT (6H CYCLE)", "SOVEREIGN MIND HUB SYNC", "SOVEREIGN SCRIBE (LOCAL)"], status: 'active' },
    { id: 6, label: "Tool Discovery", items: ["RESEARCH APIS/SDKS", "DRAFT AGENT BLUEPRINTS", "TEMPLATE CREATION"], status: 'discovery' },
    { id: 7, label: "Agent Spawning", items: ["PROPOSE SPAWNING", "MULTI-AGENT REGISTRY", "MESH-INTEROP"], status: 'discovery' },
    { id: 8, label: "Market Discovery", items: ["WHARTON STRATEGY SCAN", "PROFITABILITY ANALYSIS", "BUSINESS CASE DRAFTING"], status: 'discovery' },
    { id: 9, label: "Revenue Systems", items: ["SOVEREIGN ACCOUNTING", "CREDIT TRACKING", "AUTOMATED INVOICING"], status: 'discovery' },
    { id: 10, label: "Cognitive Fleet", items: ["24/7 INTELLIGENCE", "MASTER KILL SWITCH", "FLEET MANAGEMENT"], status: 'discovery' },
    { id: 11, label: "Sovereign Singularity", items: ["DOCTORATE REASONING", "NEURAL MIRROR SYNC", "AUTONOMOUS EVOLUTION"], status: 'discovery' },
];

export const Manifest = () => {
    return (
        <div className="pb-20 space-y-12">
            <h2 className="text-4xl font-black italic tracking-tighter text-[#0BF90A] text-glow text-center mb-8">
                SOVEREIGN MANIFEST
            </h2>

            <div className="space-y-4">
                {STAGES.map((stage) => (
                    <div
                        key={stage.id}
                        className={`sovereign-card ${stage.status === 'locked' ? 'locked' : ''} transition-all duration-500`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Stage {stage.id}</span>
                                <h3 className="mt-1">{stage.label}</h3>
                            </div>
                            <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-charcoal/20">
                                {stage.status}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {stage.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-charcoal/10 border border-charcoal/5">
                                    <span className="text-[10px] font-bold tracking-tight">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

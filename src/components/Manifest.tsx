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
    { id: 2, label: "Environmental Awareness", items: ["TONE MATCHING", "LIVE LISTENING", "GRACEFUL INTERRUPTIONS"], status: 'active' },
    { id: 3, label: "Operational Agency", items: ["SYSTEM INTEGRATION", "TASK AUTOMATION (OODAR)", "LOCAL COMMAND EXECUTION"], status: 'active' },
    { id: 4, label: "Emotional Resonance", items: ["EMOTIONAL INTELLIGENCE", "COGNITIVE MIRRORING (RAY)", "INTENT PARSING"], status: 'active' },
    { id: 5, label: "Sovereign Study", items: ["SCHOOLING AGENT (6H CYCLE)", "SOVEREIGN MIND HUB SYNC", "SUBJECT MASTERY (AEO/SOCIAL)"], status: 'active' },
    { id: 6, label: "Strategic Tooling", items: ["RESEARCH APIS/SDKS", "DRAFT AGENT BLUEPRINTS", "NIGHT WATCHMAN GROUNDING"], status: 'active' },
    { id: 7, label: "Agent Spawning", items: ["PROPOSE SPAWNING", "MULTI-AGENT REGISTRY", "MESH-INTEROP"], status: 'evolving' },
    { id: 8, label: "Market Discovery", items: ["WHARTON STRATEGY SCAN", "PROFITABILITY ANALYSIS", "BUSINESS CASE DRAFTING"], status: 'discovery' },
    { id: 9, label: "Revenue Systems", items: ["SOVEREIGN ACCOUNTING", "CREDIT TRACKING", "AUTOMATED INVOICING"], status: 'discovery' },
    { id: 10, label: "Cognitive Fleet", items: ["24/7 INTELLIGENCE", "MASTER KILL SWITCH", "FLEET MANAGEMENT"], status: 'discovery' },
    { id: 11, label: "Sovereign Singularity", items: ["DOCTORATE REASONING", "NEURAL MIRROR SYNC", "AUTONOMOUS EVOLUTION"], status: 'discovery' },
];

export const Manifest = () => {
    return (
        <div className="pb-20 space-y-12">
            <h2 className="text-4xl font-black italic tracking-tighter text-[#0BF9EA] text-glow text-center mb-8">
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

                        <div className="flex flex-col gap-3">
                            {stage.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#121212]/5 border border-[#121212]/10">
                                    {stage.status !== 'locked' ? (
                                        <CheckCircle2 size={18} className={stage.status === 'active' ? "text-[#0BF9EA]" : "text-[#121212]/40"} />
                                    ) : (
                                        <Circle size={18} className="text-white/20" />
                                    )}
                                    <span className="text-[12px] font-black uppercase tracking-wide">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

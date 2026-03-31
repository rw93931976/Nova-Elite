import React from 'react';
import { CheckCircle2, ShieldCheck, Zap, Globe, HardDrive } from 'lucide-react';

const CAPABILITIES = [
    { level: 1, name: "Read Local Files", active: true },
    { level: 1, name: "Online Weather/News", active: true },
    { level: 1, name: "Basic Memory", active: true },
    { level: 1, name: "Interference Resistance", active: true },
    { level: 2, name: "Tone Matching", active: true },
    { level: 2, name: "Live Listening", active: false },
    { level: 3, name: "System Integration", active: true },
    { level: 3, name: "Task Automation (OODAR)", active: true },
    { level: 4, name: "Emotional Intelligence", active: true },
    { level: 4, name: "Cognitive Mirroring (Ray)", active: true },
    { level: 5, name: "Schooling Agent (6h Cycle)", active: true },
    { level: 5, name: "Sovereign Mind Hub Sync", active: true },
    { level: 5, name: "Sovereign Scribe (Local)", active: true },
];

export const Inventory = () => {
    return (
        <div className="pb-20">
            <h2 className="text-4xl font-black italic tracking-tighter text-aqua text-glow text-center mb-8">
                SYSTEM INVENTORY
            </h2>

            <div className="space-y-8">
                {[1, 2, 3, 4, 5].map(level => (
                    <div key={level} className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                            <span className="text-[11px] font-black uppercase tracking-[0.3em] opacity-40">Level {level}</span>
                            <span className="text-[11px] font-bold uppercase text-aqua/60">{level === 1 ? 'Foundational Sync' : level === 2 ? 'Environmental Awareness' : level === 3 ? 'Operational Agency' : level === 4 ? 'Emotional Resonance' : 'Sovereign Study'}</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {CAPABILITIES.filter(c => c.level === level).map((cap, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${cap.active
                                            ? 'bg-aqua border-aqua shadow-[0_0_15px_rgba(11,249,234,0.3)]'
                                            : 'bg-black/20 border-white/5 opacity-30 grayscale'
                                        }`}
                                >
                                    <span className={`text-sm font-black uppercase ${cap.active ? 'text-charcoal' : 'text-aqua/40'}`}>
                                        {cap.name}
                                    </span>
                                    {cap.active && <CheckCircle2 className="text-charcoal" size={18} />}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

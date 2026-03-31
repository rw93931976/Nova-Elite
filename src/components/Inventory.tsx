import React from "react";
import { CheckCircle2, ShieldCheck, Zap, Globe, HardDrive, Database, Activity, Lock } from "lucide-react";

const CAPABILITIES = [
    { level: 1, name: "FileSystem Sync", active: true },
    { level: 1, name: "Weather Node", active: true },
    { level: 1, name: "Historical Memory", active: true },
    { level: 1, name: "Signal Shield", active: true },
    { level: 2, name: "Mnemonic Core", active: true },
    { level: 2, name: "Acoustic Listen", active: true },
    { level: 3, name: "Relay Mesh", active: true },
    { level: 3, name: "OODAR Logic", active: true },
    { level: 4, name: "Empathy Engine", active: true },
    { level: 4, name: "Neural Mirror", active: true },
    { level: 5, name: "Doctoral School", active: true },
    { level: 5, name: "Mind Hub Link", active: true },
    { level: 5, name: "Sovereign Scribe", active: true },
    { level: 6, name: "Fleet Registry", active: false },
    { level: 7, name: "Treasury Sync", active: false },
];

export const Inventory = () => {
    return (
        <div className="pb-32 space-y-12">
            <div className="text-center">
                <h2 className="text-4xl font-black italic tracking-tighter text-[#0BF90A] mb-2 uppercase drop-shadow-[0_0_20px_rgba(11,249,10,0.3)]">Asset Inventory</h2>
                <p className="text-[#0BF90A]/40 text-xs font-bold tracking-[0.2em] uppercase">Sovereign Data Assets</p>
            </div>

            <div className="space-y-10">
                {[1, 2, 3, 4, 5, 6, 7].map(level => (
                    <div key={level} className="space-y-6">
                        <div className="flex items-center justify-between px-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0BF90A]">Level {level} Assets</span>
                            <span className="text-[9px] font-bold uppercase text-[#0BF90A]/30">
                                {level === 1 ? 'Foundational' : level === 2 ? 'Environmental' : level === 3 ? 'Operational' : level === 4 ? 'Resonant' : level === 5 ? 'Doctoral' : 'Locked'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {CAPABILITIES.filter(c => c.level === level).map((cap, idx) => (
                                <div
                                    key={idx}
                                    className={`group relative overflow-hidden bg-white/[0.03] backdrop-blur-2xl border rounded-2xl p-4 transition-all duration-500 ${cap.active
                                            ? "border-[#0BF90A]/40 shadow-[0_0_30px_rgba(11,249,10,0.1),inset_0_0_20px_rgba(11,249,10,0.05)]"
                                            : "border-white/5 opacity-20 filter grayscale"
                                        }`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50" />

                                    <div className="relative z-10 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[11px] font-black uppercase tracking-tight ${cap.active ? "text-[#0BF90A]" : "text-white/40"}`}>
                                                {cap.name}
                                            </span>
                                            {cap.active ? <CheckCircle2 size={16} className="text-[#0BF90A]" /> : <Lock size={14} className="text-white/20" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
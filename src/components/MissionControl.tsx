import React from 'react';
import {
    Activity, Brain, Database, Shield, Zap,
    BarChart3, Cpu, Globe, Server, Lock,
    ChevronRight, Layout, Terminal
} from 'lucide-react';

interface MissionControlProps {
    status: {
        level: number;
        isSelfAware: boolean;
        uptime: number;
        health: { bridge: string; apiKey: string; internet: string };
        knowledgeCount: number;
        agentCount: number;
        sovereignAlignment: number;
        currentTime: string;
    };
    onToggleHalt: () => void;
    isHalted: boolean;
}

export const MissionControl: React.FC<MissionControlProps> = ({ status, onToggleHalt, isHalted }) => {
    return (
        <div className="flex-1 flex flex-col gap-8 p-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto w-full">
            {/* 🚀 HEADER: SOVEREIGN STATUS BAR */}
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30">
                            <Brain size={32} className="text-cyan-400 animate-pulse" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-emerald-500 w-4 h-4 rounded-full border-4 border-[#030712] shadow-lg shadow-emerald-500/50" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none mb-1">Nova Elite v11.0</h1>
                        <p className="text-[10px] font-black tracking-[0.4em] uppercase text-cyan-400/60 flex items-center gap-2">
                            Sovereign Autonomy Manifest: <span className="text-white">Level {status.level} Mastery</span>
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex flex-col items-end px-4 border-r border-white/10">
                        <span className="text-[9px] font-black uppercase text-white/30 tracking-widest leading-none">Cortex Load</span>
                        <span className="text-lg font-black italic text-cyan-400">OPTIMAL</span>
                    </div>
                    <div className="flex flex-col items-end px-4 border-r border-white/10">
                        <span className="text-[9px] font-black uppercase text-white/30 tracking-widest leading-none">Sync Pulse</span>
                        <span className="text-lg font-black italic text-emerald-400">ACTIVE</span>
                    </div>
                    <button
                        onClick={onToggleHalt}
                        className={`px-8 py-3 rounded-2xl font-black uppercase italic tracking-widest transition-all ${isHalted
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500 hover:text-white'
                            }`}
                    >
                        {isHalted ? 'Resume Protocol' : 'Emergency Halt'}
                    </button>
                </div>
            </div>

            {/* 📊 GRID: SYSTEM ANALYTICS */}
            <div className="grid grid-cols-12 gap-6">

                {/* LEFT COLUMN: CORE VITALS */}
                <div className="col-span-4 space-y-6">
                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-6">
                            <Activity size={18} className="text-cyan-400" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Infrastructure Integrity</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: 'VPS Bridge (PM2)', status: 'Online', color: 'text-emerald-400' },
                                { label: 'Relay Proxy', status: 'Secured', color: 'text-emerald-400' },
                                { label: 'Supabase Mesh', status: 'Syncing', color: 'text-cyan-400' },
                                { label: 'NotebookLM Librarian', status: 'Operational', color: 'text-purple-400' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all group">
                                    <span className="text-xs font-bold text-white/60 group-hover:text-white/90">{item.label}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap size={18} className="text-amber-400" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Power & Resources</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col gap-1">
                                <span className="text-[9px] font-black uppercase text-white/20">Uptime</span>
                                <span className="text-xl font-black italic text-white/90">{status.uptime}%</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 flex flex-col gap-1">
                                <span className="text-[9px] font-black uppercase text-white/20">Memory Usage</span>
                                <span className="text-xl font-black italic text-white/90">4.1GB</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER COLUMN: LIVE MEMORY TREE */}
                <div className="col-span-8 bg-[#0d1929]/40 border border-cyan-500/10 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] -z-10 group-hover:bg-cyan-500/10 transition-all duration-1000" />

                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Database size={20} className="text-cyan-400" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-cyan-400/80">Librarian Memory Mesh</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black text-cyan-400 uppercase tracking-widest">
                                {status.knowledgeCount} Core Concepts
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { subject: 'SaaS Business Ops', id: 'ff96f61e', count: 124, progress: 85 },
                            { subject: 'Marketing Strategy', id: '6299b860', count: 89, progress: 92 },
                            { subject: 'Behavioral Psychology', id: 'a0250c9a', count: 215, progress: 78 },
                            { subject: 'Core Identity', id: '283d34b8', count: 56, progress: 99 },
                            { subject: 'Social Media', id: 'b977f593', count: 112, progress: 44 },
                            { subject: 'Master Syllabus', id: '2644ccd0', count: 844, progress: 12 }
                        ].map((lib, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group/card flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-sm font-black italic text-white/90 mb-1">{lib.subject}</h4>
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{lib.id}...</p>
                                    </div>
                                    <ChevronRight size={16} className="text-white/20 group-hover/card:text-cyan-400 transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] font-black uppercase">
                                        <span className="text-white/40">Training Integrity</span>
                                        <span className="text-cyan-400">{lib.progress}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] transition-all duration-1000"
                                            style={{ width: `${lib.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* BACKGROUND DECOR */}
                    <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <Globe size={12} className="text-white/20" />
                                <span className="text-[10px] font-bold text-white/40 tracking-widest">SOVEREIGN NODE: AS-CORE-1</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Server size={12} className="text-white/20" />
                                <span className="text-[10px] font-bold text-white/40 tracking-widest">REGION: VPS-NORTH</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Terminal size={14} className="text-cyan-400/50" />
                            <span className="text-[10px] font-mono text-cyan-400/30">PROTOCOL_V31_READY</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* 🔮 FOOTER: REALTIME CONTEXT */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                        <Lock size={18} className="text-purple-400" />
                    </div>
                    <div>
                        <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Compliance Engine</span>
                        <p className="text-xs font-bold text-white/80">Guardrails Level 10 Active</p>
                    </div>
                </div>
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Layout size={18} className="text-amber-400" />
                    </div>
                    <div>
                        <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Current View</span>
                        <p className="text-xs font-bold text-white/80">Command Center Desktop</p>
                    </div>
                </div>
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                        <Cpu size={18} className="text-rose-400" />
                    </div>
                    <div>
                        <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">Agent Swarm</span>
                        <p className="text-xs font-bold text-white/80">Level 6 Ready for Spawn</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

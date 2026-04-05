import React from 'react';
import { Activity, Shield, Clock, Power, ShieldAlert, Globe } from 'lucide-react';
import type { NovaStatus } from '../types/nova';

interface SovereignDashboardProps {
    status: NovaStatus;
    onToggleHalt: () => void;
}

export const SovereignDashboard: React.FC<SovereignDashboardProps> = ({ status, onToggleHalt }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent uppercase tracking-widest">
                        Sovereign Core Control
                    </h2>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-widest mt-1">
                        Sovereign Autonomy Stage: Level {status.level}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-white/30 uppercase tracking-widest leading-none mb-1">Chronos Hub</span>
                        <span className="text-sm font-mono text-cyan-400/80">{status.currentTime || 'Syncing...'}</span>
                    </div>
                    <Clock className="text-cyan-400/50 animate-pulse" size={18} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Master Kill Switch */}
                <div className={`p-6 rounded-2xl border-2 transition-all duration-500 ${status.isHalted ? 'bg-rose-500/10 border-rose-500/50' : 'bg-black/40 border-white/5'}`}>
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-white/5">
                            <Power className={status.isHalted ? 'text-rose-500' : 'text-white/40'} size={24} />
                        </div>
                        <button
                            onClick={onToggleHalt}
                            className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${status.isHalted
                                ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                                : 'bg-white/5 text-white/40 hover:bg-rose-500/20 hover:text-rose-500'
                                }`}
                        >
                            {status.isHalted ? 'SYSTEM RESUME' : 'SYSTEM HALT'}
                        </button>
                    </div>
                    <h3 className="font-black uppercase tracking-widest text-sm mb-1">Master Kill Switch</h3>
                    <p className="text-xs text-white/40 leading-relaxed">
                        Immediately severs all agent background processes and phone lines. No autonomous actions allowed while active.
                    </p>
                </div>

                {/* Security Sentinel */}
                <div className="p-6 rounded-2xl border-2 border-white/5 bg-black/40">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-white/5">
                            <ShieldAlert className="text-emerald-500" size={24} />
                        </div>
                        <div>
                            <h3 className="font-black uppercase tracking-widest text-sm leading-none mb-1">Security Sentinel</h3>
                            <span className="text-[10px] text-emerald-500/80 uppercase font-bold">Active & Vigilant</span>
                        </div>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed">
                        Monitoring for internal rogue behavior and external anomalies. Integrity Hash: <span className="text-cyan-400 font-mono">0x7F...9A</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 flex items-center gap-4 bg-white/5 border-white/5">
                    <Globe className="text-cyan-500/50" size={20} />
                    <div>
                        <span className="block text-[10px] text-white/30 uppercase tracking-widest">Global Fleet Status</span>
                        <span className="text-xs font-bold uppercase text-white/80">Sovereign Node #1</span>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4 bg-white/5 border-white/5">
                    <Activity className="text-purple-500/50" size={20} />
                    <div>
                        <span className="block text-[10px] text-white/30 uppercase tracking-widest">Active Swarm Agents</span>
                        <span className="text-xs font-bold uppercase text-white/80">{status.agentCount} Specialists</span>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4 bg-white/5 border-white/5">
                    <Shield className="text-amber-500/50" size={20} />
                    <div>
                        <span className="block text-[10px] text-white/30 uppercase tracking-widest">Sovereign Alignment</span>
                        <span className="text-xs font-bold uppercase text-white/80">{status.sovereignAlignment}% Tactical Pass</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

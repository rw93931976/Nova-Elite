import React, { useState, useEffect } from 'react';
import { YouTubeService } from '../core/services/YouTubeService';
import type { VideoStrategy } from '../core/services/YouTubeService';
import { Youtube, ExternalLink, Activity, Info, ChevronRight, Target, Zap } from 'lucide-react';

const StrategyVault: React.FC = () => {
    const [strategies, setStrategies] = useState<VideoStrategy[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStrategy, setSelectedStrategy] = useState<VideoStrategy | null>(null);

    useEffect(() => {
        const loadVault = async () => {
            try {
                const vault = await YouTubeService.getVault();
                setStrategies(vault);
            } catch (e) {
                console.error("Vault failed to load", e);
            } finally {
                setLoading(false);
            }
        };
        loadVault();
    }, []);

    const renderStrategicValue = (val: number) => {
        const color = val > 80 ? 'text-[#0BF9EA]' : val > 50 ? 'text-yellow-400' : 'text-gray-400';
        return (
            <div className={`flex items-center gap-1 font-black text-xs ${color}`}>
                <Activity size={14} />
                {val}% VALUE
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
                <div className="w-12 h-12 border-4 border-[#0BF9EA]/20 border-t-[#0BF9EA] rounded-full animate-spin" />
                <p className="text-[10px] text-[#0BF9EA] font-black uppercase tracking-widest">Opening Strategy Vault...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col gap-2 px-1">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#0BF9EA]/10 border border-[#0BF9EA]/40 rounded-xl">
                        <Zap className="text-[#0BF9EA]" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Strategy Vault</h2>
                        <p className="text-[10px] text-[#0BF9EA]/60 font-black uppercase tracking-widest">YouTube Intelligence & SOPs</p>
                    </div>
                </div>
            </header>

            {strategies.length === 0 ? (
                <div className="bg-[#121212]/60 backdrop-blur-3xl border-2 border-[#0BF9EA]/20 rounded-2xl p-8 text-center">
                    <Youtube size={48} className="mx-auto text-white/10 mb-4" />
                    <p className="text-xs text-white/40 font-bold uppercase">No strategies ingested yet.</p>
                    <p className="text-[9px] text-[#0BF9EA]/40 uppercase mt-2">Paste a YouTube URL in Chat to begin.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {strategies.map((strategy) => (
                        <div
                            key={strategy.id}
                            onClick={() => setSelectedStrategy(strategy)}
                            className="bg-[#121212]/60 backdrop-blur-3xl border-2 border-[#0BF9EA]/30 rounded-2xl p-5 hover:border-[#0BF9EA] transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0BF9EA]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#0BF9EA]/10 transition-all"></div>

                            <div className="flex justify-between items-start mb-3">
                                {renderStrategicValue(strategy.strategic_value)}
                                <div className="text-[10px] text-white/20 font-mono">
                                    {new Date(strategy.created_at || '').toLocaleDateString()}
                                </div>
                            </div>

                            <h3 className="text-white font-black text-lg leading-tight mb-2 group-hover:text-[#0BF9EA] transition-all">
                                {strategy.title}
                            </h3>

                            <p className="text-white/60 text-xs line-clamp-2 font-medium mb-4">
                                {strategy.summary}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <span className="text-[9px] text-[#0BF9EA] font-black uppercase tracking-widest flex items-center gap-1">
                                    <Target size={12} /> {strategy.sop_steps?.length || 0} SOP STEPS
                                </span>
                                <ChevronRight className="text-[#0BF9EA]/40 group-hover:text-[#0BF9EA] transition-all" size={16} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Strategy Detail View (Overlay/Modal) */}
            {selectedStrategy && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl p-6 overflow-y-auto animate-in fade-in zoom-in duration-300">
                    <button
                        onClick={() => setSelectedStrategy(null)}
                        className="absolute top-6 right-6 p-4 text-[#0BF9EA] font-black uppercase text-xs tracking-widest hover:bg-[#0BF9EA]/10 rounded-xl"
                    >
                        [ CLOSE ]
                    </button>

                    <div className="max-w-2xl mx-auto pt-12 space-y-8">
                        <div className="space-y-2">
                            {renderStrategicValue(selectedStrategy.strategic_value)}
                            <h2 className="text-3xl font-black text-white italic uppercase leading-none">
                                {selectedStrategy.title}
                            </h2>
                        </div>

                        <section className="space-y-4">
                            <h4 className="text-[#0BF9EA] font-black uppercase text-xs tracking-[0.3em] flex items-center gap-2">
                                <Info size={16} /> Executive Summary
                            </h4>
                            <p className="text-white/80 text-base leading-relaxed font-medium bg-[#121212]/50 p-6 rounded-2xl border border-white/5 shadow-2xl">
                                {selectedStrategy.summary}
                            </p>
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-[#0BF9EA] font-black uppercase text-xs tracking-[0.3em] flex items-center gap-2">
                                <Zap size={16} /> Tactical Execution (SOP)
                            </h4>
                            <div className="space-y-3">
                                {selectedStrategy.sop_steps?.map((step: string, i: number) => (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <div className="w-8 h-8 rounded-lg bg-[#0BF9EA]/10 border border-[#0BF9EA]/30 flex items-center justify-center shrink-0 text-[#0BF9EA] font-black text-xs group-hover:bg-[#0BF9EA] group-hover:text-[#121212] transition-all">
                                            {i + 1}
                                        </div>
                                        <p className="text-white/70 text-sm font-bold pt-1.5">{step}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="pt-8 flex gap-4">
                            <a
                                href={selectedStrategy.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-[#0BF9EA] text-[#121212] font-black uppercase tracking-widest p-5 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(11,249,234,0.4)]"
                            >
                                <ExternalLink size={20} /> Original Video
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StrategyVault;

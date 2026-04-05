import React, { useState, useEffect } from "react";
import { CheckCircle2, Lock, Hammer, Settings, Plus } from "lucide-react";
import { supabase } from "../integrations/supabase";

const STATIC_CAPABILITIES = [
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
];

export const Inventory = () => {
    const [dynamicTools, setDynamicTools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTools = async () => {
            const { data } = await supabase.from('sovereign_tool_registry').select('*');
            if (data) setDynamicTools(data);
            setLoading(false);
        };
        fetchTools();
    }, []);

    const getCapabilitiesByLevel = (level: number) => {
        const staticItems = STATIC_CAPABILITIES.filter(c => c.level === level);
        if (level === 6) {
            const dynamicItems = dynamicTools.map(t => ({
                name: t.name.replace(/_/g, ' '),
                active: t.status === 'active',
                risk: t.risk_level,
                isDynamic: true
            }));
            return [...staticItems, ...dynamicItems];
        }
        return staticItems;
    };

    return (
        <div className="pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h2 className="text-4xl font-black italic tracking-tighter text-[#0BF9EA] mb-2 uppercase drop-shadow-[0_0_20px_rgba(11,249,234,0.3)]">Sovereign Assets</h2>
                <p className="text-[#0BF9EA]/40 text-xs font-bold tracking-[0.2em] uppercase">Inventory & Shovel Registry</p>
            </div>

            <div className="space-y-10">
                {[1, 2, 3, 4, 5, 6, 7].map(level => {
                    const items = getCapabilitiesByLevel(level);
                    return (
                        <div key={level} className="space-y-4">
                            <div className="flex items-center justify-between px-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0BF9EA]">Level {level} Assets</span>
                                <span className="text-[9px] font-black uppercase text-[#0BF9EA]/60">
                                    {level === 1 ? 'Foundational' : level === 5 ? 'Doctoral' : level === 6 ? 'Shovel Craft' : level === 7 ? 'Independence' : 'Environmental'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {items.length > 0 ? items.map((cap: any, idx) => (
                                    <div
                                        key={idx}
                                        className={`${cap.active ? "sovereign-card" : "bg-white/[0.03] border border-white/5 opacity-20 filter grayscale rounded-2xl p-4"} transition-all duration-300`}
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex justify-between items-start">
                                                <span className="text-[11px] font-black uppercase tracking-tight leading-tight">
                                                    {cap.name}
                                                </span>
                                                {cap.active ? <CheckCircle2 size={14} className="text-[#121212]" /> : <Lock size={12} className="text-white/20" />}
                                            </div>
                                            {cap.isDynamic && cap.active && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Hammer size={10} className="text-[#121212]/60" />
                                                    <span className="text-[8px] font-black uppercase text-[#121212]/60">Shovel Active</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-2 p-8 border-2 border-dashed border-[#0BF9EA]/10 rounded-2xl flex flex-col items-center justify-center opacity-40">
                                        <Plus size={24} className="mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Locked Level</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Brain, Zap, Shield, Globe, Cpu, Activity, Target, Lightbulb, Rocket, Award, Mic, TrendingUp, HardDrive, Lock } from "lucide-react";

interface AutonomyFeature {
  id: string;
  name: string;
  description: string;
  level: number;
  completed: boolean;
  icon: React.ReactNode;
  progress: number;
}

const Autonomy: React.FC = () => {
  const [features, setFeatures] = useState<AutonomyFeature[]>([
    { id: "a0_1", name: "VPS Root Access", description: "Safe Local Operations", level: 0, completed: true, icon: <Shield size={20} />, progress: 100 },
    { id: "a1_1", name: "Discovery Link", description: "Online Intelligence", level: 1, completed: true, icon: <Globe size={20} />, progress: 100 },
    { id: "a2_1", name: "Sensory Pulse", description: "Voice Handshake", level: 2, completed: true, icon: <Mic size={20} />, progress: 100 },
    { id: "a3_1", name: "Emotional Resonance", description: "Conflict De-Escalation", level: 3, completed: true, icon: <Activity size={20} />, progress: 100 },
    { id: "a3_2", name: "Adversarial Check", description: "Guardrail Enforcements", level: 3, completed: true, icon: <Shield size={20} />, progress: 100 },
    { id: "a4_1", name: "Context Mirroring", description: "Cross-Session Embedding", level: 4, completed: true, icon: <HardDrive size={20} />, progress: 100 },
    { id: "a5_1", name: "Anticipatory Action", description: "Goal-Oriented Wait", level: 5, completed: true, icon: <Target size={20} />, progress: 100 },
    { id: "a6_1", name: "Agent Spawning", description: "Child Hierarchy Active", level: 6, completed: true, icon: <Rocket size={20} />, progress: 100 },
    { id: "a6_2", name: "Hive Mind Broadcast", description: "Role-Based Overwrite", level: 6, completed: true, icon: <Brain size={20} />, progress: 100 },
    { id: "a7_1", name: "QC Oversight", description: "Automated QA Loop", level: 7, completed: false, icon: <Award size={20} />, progress: 35 },
    { id: "a8_1", name: "Business Integration", description: "CRM Sync Initiated", level: 8, completed: false, icon: <Cpu size={20} />, progress: 0 },
    { id: "a8_2", name: "Revenue Flow", description: "Sovereign Invoicing", level: 8, completed: false, icon: <Zap size={20} />, progress: 0 },
    { id: "a9_1", name: "Evolution Protocol", description: "Sandbox Refinement", level: 9, completed: false, icon: <Lightbulb size={20} />, progress: 0 },
    { id: "a10_1", name: "Scale Architect", description: "10,000 Concurrent Limit", level: 10, completed: false, icon: <Globe size={20} />, progress: 0 },
  ]);

  useEffect(() => {
    const tick = setInterval(() => {
      setFeatures(prev => prev.map(f => {
        if (f.completed) return f;
        const inc = Math.random() * 0.8;
        const next = Math.min(100, f.progress + inc);
        return { ...f, progress: next, completed: next >= 100 };
      }));
    }, 4000);
    return () => clearInterval(tick);
  }, []);

  const grouped = features.reduce((acc, f) => {
    if (!acc[f.level]) acc[f.level] = [];
    acc[f.level].push(f);
    return acc;
  }, {} as Record<number, AutonomyFeature[]>);

  return (
    <div className="space-y-12 pb-32">
      <div className="text-center">
        <h2 className="text-4xl font-black italic tracking-tighter text-[#0BF9EA] mb-2 uppercase drop-shadow-[0_0_20px_rgba(11,249,234,0.3)]">Autonomy Matrix</h2>
        <p className="text-[#0BF9EA]/40 text-xs font-bold tracking-[0.2em] uppercase">Sovereign Agency Live Feed</p>
      </div>

      {Object.entries(grouped).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([level, items]) => (
        <div key={level} className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[#0BF9EA] font-black text-[10px] tracking-widest uppercase">Stage {level} Execution</h3>
            <TrendingUp size={14} className="text-[#0BF9EA]/40 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {items.map(f => (
              <div key={f.id} className={`${f.completed ? "sovereign-card" : "bg-white/[0.03] border border-white/5 opacity-40 filter grayscale rounded-2xl p-4"} transition-all duration-700`}>
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${f.completed ? "bg-[#121212]/10 text-[#121212]" : "bg-white/5 text-white/40"}`}>
                        {f.icon}
                      </div>
                      <div className="flex-1">
                        <span className="text-[12px] font-black uppercase tracking-tight block">{f.name}</span>
                        <span className="text-[10px] uppercase font-bold opacity-70 block">{f.description}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center pl-2">
                      {f.completed ? <CheckCircle2 size={24} className="text-[#0BF9EA]" /> : <Circle size={24} className="text-white/20" />}
                    </div>
                  </div>

                  <div className="w-full bg-[#121212]/10 h-[6px] mt-2 rounded-full overflow-hidden">
                    <div className="bg-[#0BF9EA] h-full transition-all duration-1000 shadow-[0_0_10px_rgba(11,249,234,0.3)]" style={{ width: `${f.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Autonomy;
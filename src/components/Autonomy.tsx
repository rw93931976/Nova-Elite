import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Brain, Zap, Shield, Globe, Cpu, Activity, Target, Lightbulb, Rocket, Award, Mic, TrendingUp } from "lucide-react";

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
    { id: "a1", name: "Voice Interface", description: "Sovereign sound processing", level: 1, completed: true, icon: <Mic size={20} />, progress: 100 },
    { id: "a2", name: "Context Depth", description: "Deep relational memory", level: 1, completed: true, icon: <Brain size={20} />, progress: 100 },
    { id: "a3", name: "Logic Gateway", description: "Sovereign v4.5 Stage 1", level: 1, completed: true, icon: <Lightbulb size={20} />, progress: 100 },
    { id: "a4", name: "Pulse Monitor", description: "5s Heartbeat Auto-Sync", level: 2, completed: true, icon: <Shield size={20} />, progress: 100 },
    { id: "a5", name: "Tone Sync", description: "Emotional Mirroring v2", level: 2, completed: true, icon: <Activity size={20} />, progress: 100 },
    { id: "a6", name: "Goal Synthesis", description: "Autonomous task drafting", level: 2, completed: true, icon: <Target size={20} />, progress: 100 },
    { id: "a7", name: "Study Protocol", description: "6h Doctoral Cycle (Active)", level: 3, completed: true, icon: <Brain size={20} />, progress: 100 },
    { id: "a8", name: "Bridge Mesh", description: "Sovereign Multi-Tunnel", level: 3, completed: true, icon: <Rocket size={20} />, progress: 100 },
    { id: "a9", name: "Resource Audit", description: "Autonomous system health", level: 3, completed: true, icon: <Cpu size={20} />, progress: 100 },
    { id: "a10", name: "Self-Evolution", description: "Neural weight optimization", level: 4, completed: false, icon: <Zap size={20} />, progress: 45 },
    { id: "a11", name: "Research Agent", description: "Wharton/MIT Logic Scans", level: 4, completed: false, icon: <Globe size={20} />, progress: 32 },
    { id: "a12", name: "Sovereign Choice", description: "Independent Action v1", level: 4, completed: false, icon: <Award size={20} />, progress: 15 },
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
        <h2 className="text-4xl font-black italic tracking-tighter text-[#0BF90A] mb-2 uppercase drop-shadow-[0_0_20px_rgba(11,249,10,0.3)]">Autonomy Matrix</h2>
        <p className="text-[#0BF90A]/40 text-xs font-bold tracking-[0.2em] uppercase">Sovereign Agency Live Feed</p>
      </div>

      {Object.entries(grouped).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([level, items]) => (
        <div key={level} className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[#0BF90A] font-black text-[10px] tracking-widest uppercase">Stage {level} Execution</h3>
            <TrendingUp size={14} className="text-[#0BF90A]/20 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {items.map(f => (
              <div key={f.id} className={`group relative overflow-hidden bg-white/[0.03] backdrop-blur-2xl border rounded-2xl p-4 transition-all duration-700 ${f.completed ? "border-[#0BF90A]/40 shadow-[0_0_30px_rgba(11,249,10,0.1),inset_0_0_20px_rgba(11,249,10,0.05)]" : "border-white/5 opacity-40 filter grayscale"}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50" />
                
                <div className="relative z-10 flex flex-col gap-3">
                   <div className="flex justify-between items-start">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.completed ? "bg-[#0BF90A]/10 text-[#0BF90A] shadow-[0_0_20px_rgba(11,249,10,0.2)]" : "bg-white/5 text-white/40"}`}>
                       {f.icon}
                     </div>
                     {f.completed ? <CheckCircle2 size={16} className="text-[#0BF90A]" /> : <Circle size={16} className="text-white/20" />}
                   </div>
                   
                   <div>
                     <span className={`text-[10px] font-black uppercase tracking-tight block ${f.completed ? "text-[#0BF90A]" : "text-white/40"}`}>{f.name}</span>
                     <div className="w-full bg-white/5 h-[3px] mt-2 rounded-full overflow-hidden">
                       <div className="bg-[#0BF90A] h-full transition-all duration-1000 shadow-[0_0_10px_rgba(11,249,10,0.5)]" style={{ width: `${f.progress}%` }} />
                     </div>
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
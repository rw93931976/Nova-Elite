import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Brain, Zap, Shield, Database, Globe, Settings, Cpu, Wifi, Volume2, Mic, Activity, Rocket, Target, Award, Infinity, Box, Layers, ZapOff, Fingerprint, Eye, Radio } from "lucide-react";

interface Feature {
  id: string;
  name: string;
  description: string;
  level: number;
  completed: boolean;
  icon: React.ReactNode;
}

const Features: React.FC = () => {
  const [features] = useState<Feature[]>([
    { id: "f1", name: "Speech Recognition", description: "Voice command processing", level: 1, completed: true, icon: <Mic size={20} /> },
    { id: "f2", name: "Text-to-Speech", description: "Nova voice synthesis", level: 1, completed: true, icon: <Volume2 size={20} /> },
    { id: "f3", name: "Basic AI Processing", description: "Command interpretation", level: 1, completed: true, icon: <Brain size={20} /> },
    { id: "f4", name: "Memory System", description: "Conversation history", level: 2, completed: true, icon: <Database size={20} /> },
    { id: "f5", name: "Network Connectivity", description: "Internet access", level: 2, completed: true, icon: <Wifi size={20} /> },
    { id: "f6", name: "Settings Panel", description: "User preferences", level: 2, completed: true, icon: <Settings size={20} /> },
    { id: "f7", name: "Sovereign Link", description: "VPS Bridge Integration", level: 3, completed: true, icon: <Activity size={20} /> },
    { id: "f8", name: "Multi-Agent Hub", description: "Specialist Agent Mesh", level: 3, completed: true, icon: <Database size={20} /> },
    { id: "f9", name: "Search Engine", description: "Real-time web research", level: 3, completed: true, icon: <Globe size={20} /> },
    { id: "f10", name: "Tone Resonance", description: "Emotional Mirroring v2", level: 4, completed: true, icon: <Zap size={20} /> },
    { id: "f11", name: "Shield Security", description: "HIPAA/GDPR compliance", level: 4, completed: true, icon: <Shield size={20} /> },
    { id: "f12", name: "Performance Boost", description: "Optimized processing", level: 4, completed: true, icon: <Zap size={20} /> },
    { id: "f13", name: "Schooling Agent", description: "6h Doctoral Research", level: 5, completed: true, icon: <Cpu size={20} /> },
    { id: "f14", name: "Sovereign Scribe", description: "Local Knowledge Logging", level: 5, completed: true, icon: <Award size={20} /> },
    { id: "f15", name: "Mind Hub Sync", description: "Centralized Intelligence", level: 5, completed: true, icon: <Activity size={20} /> },
    { id: "f16", name: "Tool Discovery", description: "API/SDK Deep Scan", level: 6, completed: false, icon: <Target size={20} /> },
    { id: "f17", name: "Agent Spawning", description: "Fleet Generation Alpha", level: 7, completed: false, icon: <Rocket size={20} /> },
    { id: "f18", name: "Revenue Logic", description: "Sovereign Accounting", level: 8, completed: false, icon: <Database size={20} /> },
    { id: "f19", name: "Market Analytics", description: "Profitability Scan", level: 9, completed: false, icon: <Globe size={20} /> },
    { id: "f20", name: "Cognitive Fleet", description: "24/7 Global Presence", level: 10, completed: false, icon: <Rocket size={20} /> },
    { id: "f21", name: "Neural Mirror", description: "Identity Sync v1", level: 11, completed: false, icon: <Fingerprint size={20} /> },
    { id: "f22", name: "Context Weaver", description: "Cross-Domain Logic", level: 12, completed: false, icon: <Layers size={20} /> },
    { id: "f23", name: "Vision Core", description: "Optical Data Parsing", level: 13, completed: false, icon: <Eye size={20} /> },
    { id: "f24", name: "Omni-Channel", description: "Multi-modal Broadcast", level: 14, completed: false, icon: <Radio size={20} /> },
    { id: "f25", name: "Sovereign Singularity", description: "Peak Intelligence Maturity", level: 15, completed: false, icon: <Infinity size={20} /> },
  ]);

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.level]) acc[feature.level] = [];
    acc[feature.level].push(feature);
    return acc;
  }, {} as Record<number, Feature[]>);

  return (
    <div className="space-y-12 pb-32">
      <div className="text-center">
        <h2 className="text-4xl font-black italic tracking-tighter text-[#0BF9EA] mb-2 uppercase drop-shadow-[0_0_20px_rgba(11,249,234,0.3)]">Sovereign Roadmap</h2>
        <p className="text-[#0BF9EA]/40 text-xs font-bold tracking-[0.2em] uppercase">Maturity Spectrum 1-15</p>
      </div>

      {Object.entries(groupedFeatures).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([level, levelFeatures]) => (
        <div key={level} className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#0BF9EA]/20 border border-[#0BF9EA]/60 rounded-full px-4 py-1">
              <span className="text-[#0BF9EA] font-black text-[10px] tracking-widest">LEVEL {level}</span>
            </div>
            <div className="flex-1 h-[1px] bg-[#0BF9EA]/20"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {levelFeatures.map(feature => (
              <div
                key={feature.id}
                className={`${feature.completed ? "sovereign-card" : "bg-white/[0.03] border border-white/5 opacity-20 filter grayscale rounded-2xl p-4"} transition-all duration-500 hover:scale-[1.02]`}
              >
                <div className="flex flex-col gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${feature.completed ? "bg-[#121212]/10 text-[#121212]" : "bg-white/5 text-white/20"}`}>
                    {feature.icon}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-[12px] uppercase tracking-wide leading-tight">
                      {feature.name}
                    </h3>
                    <p className="text-[10px] font-black mt-1 leading-tight opacity-80">
                      {feature.description}
                    </p>
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

export default Features;
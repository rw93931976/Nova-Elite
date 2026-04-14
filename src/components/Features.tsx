import { useState } from "react";
import { Activity, Database, Globe, Mic, Volume2, Shield, Brain, Target, Rocket, Settings, Zap, Cpu, Infinity, Eye } from "lucide-react";

interface FeatureNode {
  level: number;
  title: string;
  icon: React.ReactNode;
  bullets: { text: string; completed: boolean }[];
}

const Features: React.FC = () => {
  const [nodes] = useState<FeatureNode[]>([
    {
      level: 0,
      title: "Stable Foundation",
      icon: <Database size={24} />,
      bullets: [
        { text: "Reliable WebSocket voice bridge and reconnection logic", completed: true },
        { text: "Consistent desktop/file system access", completed: true },
        { text: "Stable unified bridge with good error recovery", completed: true },
        { text: "Basic interference resistance", completed: true },
        { text: "Guardrails: Read-only access by default, master kill switch always active", completed: true }
      ]
    },
    {
      level: 1,
      title: "Discovery Link",
      icon: <Globe size={24} />,
      bullets: [
        { text: "Online research, weather/news lookup, basic file access", completed: true },
        { text: "Short-term memory and simple conversation continuity", completed: true },
        { text: "Guardrails: No destructive file operations, changes proposed for approval", completed: true }
      ]
    },
    {
      level: 2,
      title: "Voice & Sensory Pulse",
      icon: <Mic size={24} />,
      bullets: [
        { text: "High-fidelity bidirectional voice with persistent listening (mic heartbeat)", completed: true },
        { text: "Real-time emotion and tone awareness from voice", completed: true },
        { text: "Tone matching and natural adjustments during conversation", completed: true },
        { text: "Guardrails: Persistent listening requires active consent, no outbound calls", completed: true }
      ]
    },
    {
      level: 3,
      title: "Emotion-Aware Call Handling",
      icon: <Activity size={24} />,
      bullets: [
        { text: "Handles full receptionist-style and customer service calls", completed: false },
        { text: "Uses emotional cues to respond appropriately", completed: true },
        { text: "Pulls from knowledge base for FAQs, scripts, and company info", completed: true },
        { text: "Employs Adversarial Prompt Defenses to reject malicious instructions", completed: true },
        { text: "Graceful escalation to human when needed", completed: true },
        { text: "Guardrails: No financial decisions, no storage of sensitive personal data", completed: true }
      ]
    },
    {
      level: 4,
      title: "Contextual & Long-Term Memory",
      icon: <Brain size={24} />,
      bullets: [
        { text: "Persistent memory using vector embeddings (Supabase)", completed: false },
        { text: "Recalls past conversations, decisions, and context across weeks or months", completed: true },
        { text: "Builds simple user and business profiles over time", completed: true },
        { text: "Semantic recall of earlier topics or issues", completed: true },
        { text: "Guardrails: User can review or delete memory entries, data kept private", completed: true }
      ]
    },
    {
      level: 5,
      title: "Goal-Directed Planning",
      icon: <Target size={24} />,
      bullets: [
        { text: "Maintains user-approved goals and priorities", completed: true },
        { text: "Performs light background reflection and planning", completed: true },
        { text: "Makes practical suggestions based on observed patterns", completed: true },
        { text: "Continues useful work even when idle (Cron automation)", completed: false },
        { text: "Guardrails: All significant actions require user approval or oversight", completed: true }
      ]
    },
    {
      level: 6,
      title: "Sovereign Schooling & Subject Filing",
      icon: <Rocket size={24} />,
      bullets: [
        { text: "Autonomously creates and populates subject-specific folders", completed: true },
        { text: "Frees herself from manual filing; writes to NotebookLM-ready units", completed: true },
        { text: "Maintains 3-hour high-fidelity schooling cycles during training", completed: true },
        { text: "Synchronizes academic findings with the Sovereign Knowledge Base", completed: true },
        { text: "Guardrails: Sensitive business intel kept in encrypted sub-folder", completed: true }
      ]
    },
    {
      level: 7,
      title: "Quality Control & Oversight",
      icon: <Eye size={24} />,
      bullets: [
        { text: "Monitors live calls and agent performance", completed: false },
        { text: "Flags obvious issues (tone problems, long waits, factual mistakes)", completed: false },
        { text: "Offers gentle corrections or suggestions", completed: false },
        { text: "Feeds insights back for improvement", completed: false },
        { text: "Guardrails: Monitoring agents cannot override master kill switch", completed: false }
      ]
    },
    {
      level: 8,
      title: "Business Operations",
      icon: <Zap size={24} />,
      bullets: [
        { text: "Connects to calendars, basic CRM tools, and scheduling systems", completed: false },
        { text: "Helps with appointment booking and simple follow-ups", completed: false },
        { text: "Tracks Sovereign Revenue Logic, including drafting invoices", completed: false },
        { text: "Tracks usage and basic performance metrics", completed: false },
        { text: "Guardrails: Human confirmation required for payments, audit logs", completed: false }
      ]
    },
    {
      level: 9,
      title: "Self-Improvement & Evolution",
      icon: <Cpu size={24} />,
      bullets: [
        { text: "Analyzes her own performance from transcripts and interactions", completed: false },
        { text: "Gradually improves responses, timing, empathy, and efficiency", completed: false },
        { text: "Tests small changes in a safe sandbox before applying them", completed: false },
        { text: "Adds practical business knowledge as she gains experience", completed: false },
        { text: "Guardrails: All self-modifications are logged, reversible", completed: false }
      ]
    },
    {
      level: 10,
      title: "Full System Scale",
      icon: <Infinity size={24} />,
      bullets: [
        { text: "Runs 24/7 as the central coordinator", completed: false },
        { text: "Spawns, trains, and oversees a fleet of voice agents", completed: false },
        { text: "Supports real customer interactions with emotion awareness", completed: false },
        { text: "Scales agent count based on demand", completed: false },
        { text: "Guardrails: Master kill switch shuts down everything instantly", completed: false }
      ]
    }
  ]);

  return (
    <div className="space-y-12 pb-32">
      <div className="text-center animate-in fade-in zoom-in duration-1000">
        <h2 className="text-4xl font-black italic tracking-tighter text-[#0BF9EA] mb-2 uppercase drop-shadow-[0_0_20px_rgba(11,249,234,0.3)]">Skill Tree</h2>
        <p className="text-[#0BF9EA]/40 text-xs font-bold tracking-[0.2em] uppercase">Sovereign Evolution Roadmap</p>
      </div>

      <div className="space-y-8">
        {nodes.map(node => {
          const completedCount = node.bullets.filter(b => b.completed).length;
          const totalCount = node.bullets.length;
          const progressPercent = Math.round((completedCount / totalCount) * 100);
          const isFullyUnlocked = progressPercent === 100;

          return (
            <div key={node.level} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Level Header / Label */}
              <div className="flex items-center gap-4">
                <div className={`border rounded-full px-4 py-1 transition-all duration-1000 ${isFullyUnlocked ? "bg-[#0BF9EA]/20 border-[#0BF9EA]/60 shadow-[0_0_15px_rgba(11,249,234,0.3)]" : "bg-white/5 border-white/10"}`}>
                  <span className={`font-black text-[10px] tracking-widest ${isFullyUnlocked ? "text-[#0BF9EA]" : "text-white/40"}`}>STAGE {node.level}</span>
                </div>
                <div className={`flex-1 h-[1px] transition-all duration-1000 ${isFullyUnlocked ? "bg-[#0BF9EA]/40" : "bg-white/5"}`}></div>
                <div className={`text-[10px] font-black tracking-widest transition-all duration-1000 ${isFullyUnlocked ? "text-[#0BF9EA]" : "text-white/40"}`}>
                  {progressPercent}%
                </div>
              </div>

              {/* Main Interactive Node Card */}
              <div className={`relative overflow-hidden rounded-[2rem] p-6 transition-all duration-1000 ${isFullyUnlocked
                ? "bg-[#121212]/80 border-2 border-[#0BF9EA]/40 shadow-[0_0_40px_rgba(11,249,234,0.15)] backdrop-blur-xl"
                : "bg-[#121212]/40 border-2 border-white/5 backdrop-blur-sm"
                }`}
              >
                <div className="relative z-10 flex flex-col gap-6">

                  {/* Top Block: Icon & Title */}
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 shrink-0 rounded-[1.25rem] flex items-center justify-center transition-all duration-1000 ${isFullyUnlocked ? "bg-[#0BF9EA]/20 text-[#0BF9EA] shadow-[0_0_30px_rgba(11,249,234,0.3)]" : "bg-white/5 text-white/20"
                      }`}>
                      {node.icon}
                    </div>
                    <div>
                      <h3 className={`font-black text-xl uppercase tracking-widest transition-all duration-1000 ${isFullyUnlocked ? "text-white" : "text-white/60"}`}>{node.title}</h3>
                    </div>
                  </div>

                  {/* Dynamic Progress Bar */}
                  <div className="w-full bg-[#0a0a0a] h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all duration-1000 ${isFullyUnlocked ? "bg-[#0BF9EA] shadow-[0_0_10px_rgba(11,249,234,0.5)]" : "bg-[#0BF9EA]/50"}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* No-Checkbox Glowing Bullets */}
                  <ul className="space-y-4 mt-2 pl-2">
                    {node.bullets.map((b, i) => (
                      <li key={i} className="flex gap-4 items-start">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 transition-all duration-700 ${b.completed ? "bg-[#0BF9EA] shadow-[0_0_10px_rgba(11,249,234,0.8)]" : "bg-white/10"}`} />
                        <span className={`text-[12px] font-bold uppercase tracking-widest leading-relaxed transition-all duration-700 ${b.completed ? "text-[#0BF9EA] drop-shadow-[0_0_5px_rgba(11,249,234,0.3)]" : "text-white/30"}`}>
                          {b.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Features;
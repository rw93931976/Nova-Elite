import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNova } from './hooks/useNova';
import { SelfAuditAgent } from './core/agents/SelfAuditAgent';
import { DiscoveryAgent } from './core/agents/DiscoveryAgent';
import { useSpeech } from './hooks/useSpeech';
import {
  Home, Shield, Database, Settings as SettingsIcon, Mic,
  AlertTriangle, Check, Brain, Wrench,
  Briefcase, Activity, RotateCw, Trash2, ShieldAlert, Zap
} from 'lucide-react';
import { StatusBadge } from './components/StatusBadge';
import { SovereignDashboard } from './components/SovereignDashboard';

const CURRENT_VERSION = "v3.6.0-SOVEREIGN-ALIGN";
const ACK_PHRASES = ["On it.", "Understood.", "Processing...", "Syncing with Core...", "Acknowledged."];

function App() {
  const nova = useNova();

  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'manifest' | 'knowledge' | 'settings'>('home');
  const [volume, setVolume] = useState(30); // 🔉 Baseline 30% as requested by Ray for road noise calibration.
  const [relayAlive, setRelayAlive] = useState(false);
  const selfAudit = useMemo(() => new SelfAuditAgent(), []);
  const discovery = useMemo(() => new DiscoveryAgent(), []);
  const [isThinking, setIsThinking] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('NOVA_CEREBRAS_KEY') || '');
  const [acknowledgment, setAcknowledgment] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [highGain, setHighGain] = useState(true);

  const [completedFeatures, setCompletedFeatures] = useState<string[]>([
    "Read local files", "Online weather/news", "Basic memory", "Interference resistance",
    "Tone Matching", "System Integration", "Task Automation (OODAR)",
    "Emotional Intelligence", "Cognitive Mirroring (Ray)", "Intent Parsing",
    "Schooling Agent (6h Cycle)", "Sovereign Mind Hub Sync", "Sovereign Scribe (Local)"
  ]);

  const autonomyLevels = [
    { level: 1, title: "Foundational Sync", status: "Active", attributes: ["Read local files", "Online weather/news", "Basic memory", "Interference resistance"] },
    { level: 2, title: "Environmental Awareness", status: "Active", attributes: ["Tone Matching", "Live listening", "Graceful interruptions"] },
    { level: 3, title: "Operational Agency", status: "Active", attributes: ["System Integration", "Task Automation (OODAR)", "Local Command Execution"] },
    { level: 4, title: "Emotional Resonance", status: "Active", attributes: ["Emotional Intelligence", "Cognitive Mirroring (Ray)", "Intent Parsing"] },
    { level: 5, title: "Sovereign Study", status: "Active", attributes: ["Schooling Agent (6h Cycle)", "Sovereign Mind Hub Sync", "Sovereign Scribe (Local)"] },
    { level: 6, title: "Tool Discovery", status: "In Progress", attributes: ["Research APIs/SDKs", "Draft agent blueprints", "Template creation"] },
    { level: 7, title: "Agent Spawning", status: "Locked", attributes: ["Propose spawning", "Multi-agent registry", "Mesh-interop"] },
    { level: 8, title: "Market Discovery", status: "Locked", attributes: ["Wharton strategy scan", "Profitability analysis", "Business case drafting"] },
    { level: 9, title: "Revenue Systems", status: "Locked", attributes: ["Sovereign accounting", "Credit tracking", "Automated invoicing"] },
    { level: 10, title: "Cognitive Fleet", status: "Locked", attributes: ["24/7 Intelligence", "Master Kill Switch", "Fleet Management"] },
    { level: 11, title: "Sovereign Singularity", status: "Locked", attributes: ["Doctorate reasoning", "Neural Mirror sync", "Autonomous evolution"] },
    { level: 12, title: "Wharton Strategic Hub", status: "Locked", attributes: ["Deep Market Modeling", "Enterprise De-risking"] },
    { level: 13, title: "Predictive Sovereignty", status: "Locked", attributes: ["Anomaly Pre-emption", "Market Foresight"] },
    { level: 14, title: "Global Intelligence Mesh", status: "Locked", attributes: ["Cross-Latitude Sync", "Collective Wisdom Context"] },
    { level: 15, title: "Cognitive Legacy", status: "Locked", attributes: ["Full Existence Continuity", "Autonomous Asset Authority"] }
  ];

  const speakRef = useRef<((text: string, vol?: number, pitch?: number, rate?: number) => void) | null>(null);

  const checkForRelay = useCallback(async () => {
    setRelayAlive(nova.connections?.brain === 'online');
  }, [nova.connections]);

  const handleHardRefresh = useCallback(async () => {
    try {
      setAcknowledgment("SYSTEM RESET INITIATED...");
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if (window.caches) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace(window.location.origin + '?v=' + Date.now());
    } catch (e) {
      window.location.reload();
    }
  }, []);

  const clearCache = useCallback(() => handleHardRefresh(), [handleHardRefresh]);

  useEffect(() => {
    const timer = setInterval(checkForRelay, 10000);
    return () => clearInterval(timer);
  }, [checkForRelay]);

  const onProcessText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsThinking(true);
    try {
      const thought = await nova.processWithNova(text, {
        onReceipt: (receipt: any) => {
          setAcknowledgment(null);
          const isDesktop = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
          const useBrowserTTS = !isDesktop || !relayAlive;

          if (speakRef.current && useBrowserTTS) {
            const scaledVolume = highGain ? Math.min(8.0, (volume / 5)) : (volume / 20);
            const msgText = typeof receipt === 'string' ? receipt : (receipt?.message || JSON.stringify(receipt));
            const cleanText = msgText.replace(/I'm standing by\.|My cloud-link is a bit hazy\.|standing by\./gi, '').trim();
            if (cleanText.length > 0) speakRef.current(cleanText, scaledVolume);
          }
        }
      });
    } catch (err) {
      console.error('Nova Processing Error:', err);
    } finally {
      setIsThinking(false);
    }
  }, [nova, volume, relayAlive, highGain]);

  const { isListening, toggleListening, speak, unlockAudio, pauseListening, resumeListening } = useSpeech(onProcessText);

  useEffect(() => {
    speakRef.current = speak;
    (window as any).NOVA_PAUSE_LISTENING = () => pauseListening();
    (window as any).NOVA_RESUME_LISTENING = () => resumeListening();

    // Level 11: Sovereign Study Protocol (6h Cycle)
    const interval = setInterval(() => {
      onProcessText("ACTIVATE DOCTORAL MANDATE: Check progress in 'nova_study' and 'ANTIGRAVITY_SKILLS_KIT'. Use Expert Skills at C:/Users/Ray/.gemini/antigravity/scratch/MySimpleAIHelp/repos/ AND the Antigravity Kit at c:/Users/Ray/.gemini/antigravity/skills/antigravity_kit/.agent/ as your Master Playbooks. Research, study, scribe.");
    }, 6 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [speak, pauseListening, resumeListening, onProcessText]);

  const triggerEvolution = async () => {
    const proposal = await nova.core.evolve();
    nova.addBotMessage('nova_core', proposal);
  };

  return (
    <div className="w-full h-[100dvh] relative flex flex-col bg-transparent text-white overflow-hidden select-none" style={{ position: 'fixed', top: 0, left: 0 }}>
      <main className="flex-1 relative z-10 flex flex-col pt-12 px-6 pb-6 overflow-y-auto no-scrollbar">

        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col items-center justify-between pb-24 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-full flex justify-between items-center px-4 mt-2">
              <h1 className="text-2xl font-black italic tracking-tighter text-white text-glow-cyan">NOVA ELITE</h1>
              <div className="flex items-center gap-2">
                <StatusBadge label="BRAIN" status={nova.connections?.brain === 'online' ? 'online' : 'error'} />
                <StatusBadge label="CORE" status="online" />
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
              <div className="h-10 flex items-center justify-center mb-10 w-full px-8">
                {acknowledgment && <div className="text-cyan-300 font-black uppercase tracking-[0.2em]">{acknowledgment}</div>}
                {isThinking && !acknowledgment && <div className="flex gap-3 animate-pulse"><div className="w-3 h-3 bg-cyan-400 rounded-full" /><div className="w-3 h-3 bg-purple-400 rounded-full" /></div>}
              </div>

              <button
                onClick={() => { unlockAudio(); toggleListening(); }}
                className={`w-52 h-52 rounded-full flex items-center justify-center transition-all duration-700 ${isListening ? 'bg-cyan-500 shadow-glow-cyan scale-110' : 'bg-[#0f172a] border border-cyan-500/40'}`}
              >
                <Mic size={72} className={isListening ? 'text-white' : 'text-cyan-400'} />
              </button>

              <button onClick={handleHardRefresh} className="mt-8 flex items-center gap-2 bg-rose-500/20 px-8 py-3 rounded-full opacity-60 hover:opacity-100 transition-all font-black text-xs uppercase tracking-widest text-rose-300">
                <Trash2 size={16} /> Nuclear Reset
              </button>
            </div>

            <div className="opacity-30 text-[10px] font-black uppercase text-cyan-200 tracking-[1em] mb-4">{CURRENT_VERSION}</div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="flex-1 flex flex-col gap-6 py-12 px-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto no-scrollbar pb-40">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white text-glow-cyan">System Inventory</h2>
            <div className="flex flex-col gap-8">
              {autonomyLevels.map(lvl => (
                <div key={lvl.level} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Level {lvl.level}</span>
                    <div className="h-[1px] flex-1 bg-white/10" />
                    <span className="text-[10px] font-black text-cyan-400/60 uppercase tracking-widest">{lvl.title}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lvl.attributes.map(feat => {
                      const isActive = completedFeatures.includes(feat);
                      return (
                        <div key={feat} className={`p-4 flex items-center justify-between border-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-cyan-700/40 border-cyan-400/30' : 'bg-white/5 border-white/5 opacity-40'}`}>
                          <span className={`text-[12px] font-black uppercase ${isActive ? 'text-white' : 'text-white/30'}`}>{feat}</span>
                          {isActive && <Check size={14} className="text-cyan-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'manifest' && (
          <div className="flex-1 flex flex-col gap-6 py-8 px-4 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto no-scrollbar pb-32">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white text-glow-cyan">Sovereign Manifest</h2>
            <div className="space-y-4">
              {autonomyLevels.map(lvl => {
                const isActive = lvl.attributes.every(attr => completedFeatures.includes(attr));
                const isInProgress = !isActive && lvl.attributes.some(attr => completedFeatures.includes(attr));
                const statusLabel = isActive ? 'Active' : (isInProgress ? 'Evolving' : 'Discovery');
                return (
                  <div key={lvl.level} className={`p-6 rounded-3xl border-2 transition-all duration-300 ${isActive ? 'bg-cyan-700 border-cyan-400/50 shadow-glow-cyan' : 'bg-white/5 border-white/5 opacity-60'}`}>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-[10px] font-black uppercase text-white/40">Stage {lvl.level}</span>
                        <h4 className="text-xl font-black uppercase text-white">{lvl.title}</h4>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${isActive ? 'bg-cyan-400 text-black' : 'bg-white/10 text-white/40'}`}>{statusLabel}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {lvl.attributes.map(attr => (
                        <span key={attr} className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${completedFeatures.includes(attr) ? 'border-cyan-400/40 text-cyan-400' : 'border-white/5 text-white/20'}`}>• {attr}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="p-4 h-full flex flex-col pt-12 overflow-hidden">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-6 text-white text-glow-cyan">Data Stream</h2>
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 no-scrollbar pb-48">
              {nova.messages.map((m: any) => (
                <div key={m.id} className={`p-6 border-l-8 rounded-3xl ${m.from === 'user' ? 'border-rose-500 bg-white/5' : 'border-cyan-500 bg-cyan-900/40'}`}>
                  <p className="text-sm font-medium leading-relaxed">{m.content || m.text}</p>
                </div>
              ))}
              <div id="scroll-anchor" className="h-2" />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col gap-10 py-8 px-4 animate-in fade-in slide-in-from-bottom-4 overflow-y-auto no-scrollbar pb-40">
            <div className="glass-card p-10 bg-[#0d1929] border-cyan-400/40 shadow-2xl">
              <h3 className="text-2xl font-black uppercase text-white text-glow-cyan mb-8">Calibration</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-white/40 uppercase">Output Gain</span>
                  <span className="text-4xl font-black text-cyan-400">{volume}%</span>
                </div>
                <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(parseInt(e.target.value))} className="w-full" />
                <div className="flex items-center justify-between p-4 bg-cyan-500/10 rounded-xl">
                  <span className="text-xs font-black text-cyan-400 uppercase">Sovereign Boost</span>
                  <button onClick={() => setHighGain(!highGain)} className={`px-6 py-2 rounded-full font-black text-xs ${highGain ? 'bg-cyan-500 text-white' : 'bg-white/5 text-white/40'}`}>
                    {highGain ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 bg-[#0d1929] border-purple-400/20">
              <SovereignDashboard status={nova.status} onToggleHalt={() => nova.core.toggleHalt()} />
            </div>
          </div>
        )}

      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[320px] z-50">
        <div className="bg-[#020617]/90 px-3 py-2.5 flex justify-between items-center border border-white/10 rounded-full backdrop-blur-3xl shadow-2xl">
          <button onClick={() => setActiveTab('home')} className={`p-3 rounded-full ${activeTab === 'home' ? 'bg-white text-black' : 'text-white/40'}`}><Home size={20} /></button>
          <button onClick={() => setActiveTab('features')} className={`p-3 rounded-full ${activeTab === 'features' ? 'bg-white text-black' : 'text-white/40'}`}><Briefcase size={20} /></button>
          <button onClick={() => setActiveTab('manifest')} className={`p-3 rounded-full ${activeTab === 'manifest' ? 'bg-white text-black' : 'text-white/40'}`}><Shield size={20} /></button>
          <button onClick={() => setActiveTab('knowledge')} className={`p-3 rounded-full ${activeTab === 'knowledge' ? 'bg-white text-black' : 'text-white/40'}`}><Database size={20} /></button>
          <button onClick={() => setActiveTab('settings')} className={`p-3 rounded-full ${activeTab === 'settings' ? 'bg-white text-black' : 'text-white/40'}`}><SettingsIcon size={20} /></button>
        </div>
      </nav>
    </div>
  );
}

export default App;

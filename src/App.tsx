import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNova } from './hooks/useNova';
import { SelfAuditAgent } from './core/agents/SelfAuditAgent';
import { DiscoveryAgent } from './core/agents/DiscoveryAgent';
import { useSpeech } from './hooks/useSpeech';
import {
  Home, Shield, Database, Settings as SettingsIcon, Mic,
  AlertTriangle, Check, Brain, Wrench,
<<<<<<< HEAD
  Briefcase, Activity, RotateCw, Trash2, ShieldAlert, Zap, Volume2
=======
  Briefcase, Activity, RotateCw, Trash2, ShieldAlert, Zap
>>>>>>> sovereign-elite-v3-6
} from 'lucide-react';
import { StatusBadge } from './components/StatusBadge';
import { SovereignDashboard } from './components/SovereignDashboard';

<<<<<<< HEAD
const CURRENT_VERSION = "v7.1-HYBRID";
const ACK_PHRASES = ["On it.", "Understood.", "Processing...", "Syncing with Core...", "Acknowledged."];

// 🛡️ BACKGROUND SOVEREIGNTY (v5.6): Prevents throttling when minimized/backgrounded
const BackgroundPersistence = ({ onUnlock, listening }: { onUnlock: () => void, listening: boolean }) => {
  const [vol, setVol] = useState(0.35);

  useEffect(() => {
    (window as any).NOVA_VOLUME = vol;
    (window as any).localStorage.setItem('nova_saved_vol', vol.toString());
  }, [vol]);

  useEffect(() => {
    let wakeLock: any = null;
    const requestLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) { }
    };
    requestLock();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') requestLock();
    });
    return () => { if (wakeLock) wakeLock.release(); };
  }, []);

  return (
    <>
      {/* 🚀 SOVEREIGN UNLOCK (v5.6): Heavy-duty gesture to re-prime Audio Engine */}
      <button
        onClick={onUnlock}
        className="fixed top-4 right-4 z-[1000] px-4 py-3 bg-slate-950 border-2 border-cyan-500 rounded-full text-[10px] font-black uppercase tracking-widest text-cyan-400 animate-pulse transition-all active:scale-95 shadow-2xl"
      >
        Unlock Pulse
      </button>

      {/* 🔍 VOCAL STATUS MONITOR (For User Debugging) */}
      <div className="fixed top-4 left-4 z-[1000] flex flex-col items-start gap-1 pointer-events-none">
        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-md border ${listening ? "bg-green-600 text-white border-green-400" : "bg-rose-600 text-white border-rose-400"}`}>
          {listening ? "Ears: Active" : "Ears: Stalled"}
        </span>
      </div>

      <audio
        id="nova-heartbeat"
        loop
        autoPlay
        muted={false}
        style={{ display: 'none' }}
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
      />
    </>
  );
};

function App() {
  const nova = useNova();


=======
const CURRENT_VERSION = "v3.6.0-SOVEREIGN-ALIGN";
const ACK_PHRASES = ["On it.", "Understood.", "Processing...", "Syncing with Core...", "Acknowledged."];

function App() {
  const nova = useNova();

>>>>>>> sovereign-elite-v3-6
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
<<<<<<< HEAD
  const [alwaysListen, setAlwaysListen] = useState(false);
  const [mirrorTone, setMirrorTone] = useState(true);
  const [lastResponse, setLastResponse] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
=======
>>>>>>> sovereign-elite-v3-6

  const [completedFeatures, setCompletedFeatures] = useState<string[]>([
    "Read local files", "Online weather/news", "Basic memory", "Interference resistance",
    "Tone Matching", "System Integration", "Task Automation (OODAR)",
    "Emotional Intelligence", "Cognitive Mirroring (Ray)", "Intent Parsing",
<<<<<<< HEAD
    "Schooling Agent (6h Cycle)", "Sovereign Mind Hub Sync", "Sovereign Scribe (Local)",
    "Solutions Vault", "Self-Correction Log", "Cloud-Native Relay"
=======
    "Schooling Agent (6h Cycle)", "Sovereign Mind Hub Sync", "Sovereign Scribe (Local)"
>>>>>>> sovereign-elite-v3-6
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
<<<<<<< HEAD
    { level: 11, title: "Sovereign Singularity", status: "Locked", attributes: ["Doctorate reasoning", "Neural Mirror sync", "Autonomous evolution"] }
=======
    { level: 11, title: "Sovereign Singularity", status: "Locked", attributes: ["Doctorate reasoning", "Neural Mirror sync", "Autonomous evolution"] },
    { level: 12, title: "Wharton Strategic Hub", status: "Locked", attributes: ["Deep Market Modeling", "Enterprise De-risking"] },
    { level: 13, title: "Predictive Sovereignty", status: "Locked", attributes: ["Anomaly Pre-emption", "Market Foresight"] },
    { level: 14, title: "Global Intelligence Mesh", status: "Locked", attributes: ["Cross-Latitude Sync", "Collective Wisdom Context"] },
    { level: 15, title: "Cognitive Legacy", status: "Locked", attributes: ["Full Existence Continuity", "Autonomous Asset Authority"] }
>>>>>>> sovereign-elite-v3-6
  ];

  const speakRef = useRef<((text: string, vol?: number, pitch?: number, rate?: number) => void) | null>(null);

  const checkForRelay = useCallback(async () => {
<<<<<<< HEAD
    // 1. Direct WebSocket Check
    if (nova.connections?.brain === 'online') {
      setRelayAlive(true);
      return;
    }

    // 2. Cloud Heartbeat Fallback (v7.1 Recovery for Vercel/HTTPS)
    try {
      const { data } = await supabase
        .from('agent_architect_comms')
        .select('created_at')
        .eq('sender', 'vps_heartbeat')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data[0]) {
        const lastPulse = new Date(data[0].created_at).getTime();
        const diff = Date.now() - lastPulse;
        if (diff < 120000) { // 2 minute threshold to match NovaCore v7.2
          setRelayAlive(true);
          return;
        }
      }
    } catch (e) {
      console.warn("⚠️ Heartbeat check failed:", e);
    }

    setRelayAlive(false);
=======
    setRelayAlive(nova.connections?.brain === 'online');
>>>>>>> sovereign-elite-v3-6
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
<<<<<<< HEAD
    const timer = setInterval(() => checkForRelay(), 15000); // 🕒 RELAXED INTERVAL: 15s instead of 10s
=======
    const timer = setInterval(checkForRelay, 10000);
>>>>>>> sovereign-elite-v3-6
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
<<<<<<< HEAD

          // v7.0 FIX: If the bridge is Offline OR if highGain is active, we lead with Browser TTS for reliability
          const useBrowserTTS = !isDesktop || !relayAlive || highGain;

          if (speakRef.current && useBrowserTTS) {
            // 🔊 SAFELY STAGED VOLUME (v6.7 FIX): Clamp to 0-1 for browser compliance
            const browserVolume = highGain ? Math.min(1.0, (volume / 100) * 1.5) : (volume / 100);
            const msgText = typeof receipt === 'string' ? receipt : (receipt?.message || JSON.stringify(receipt));

            // Cognitive Firewall: Strip technical leakage from vocalization
            const cleanText = msgText.replace(/I'm standing by\.|My cloud-link is a bit hazy\.|standing by\./gi, '').trim();
            setLastResponse(cleanText);

            if (cleanText.length > 0) {
              console.log("🔊 [v7.0]: Triggering Proactive Browser TTS...");
              speakRef.current(cleanText, browserVolume);
            }
=======
          const useBrowserTTS = !isDesktop || !relayAlive;

          if (speakRef.current && useBrowserTTS) {
            const scaledVolume = highGain ? Math.min(8.0, (volume / 5)) : (volume / 20);
            const msgText = typeof receipt === 'string' ? receipt : (receipt?.message || JSON.stringify(receipt));
            const cleanText = msgText.replace(/I'm standing by\.|My cloud-link is a bit hazy\.|standing by\./gi, '').trim();
            if (cleanText.length > 0) speakRef.current(cleanText, scaledVolume);
>>>>>>> sovereign-elite-v3-6
          }
        }
      });
    } catch (err) {
      console.error('Nova Processing Error:', err);
    } finally {
      setIsThinking(false);
    }
  }, [nova, volume, relayAlive, highGain]);

<<<<<<< HEAD
  const { isListening, toggleListening, speak, unlockAudio, pauseListening, resumeListening, reinitialize } = useSpeech(onProcessText);

  const handleManualUnlock = () => {
    console.log("🔓 [SYSTEM]: Manual Vocal Unlock Initiated.");
    unlockAudio();
    reinitialize();

    // Play a tiny beep to confirm unlock
    const audioResumer = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioResumer.state === 'suspended') audioResumer.resume();
    const osc = audioResumer.createOscillator();
    const gain = audioResumer.createGain();
    osc.connect(gain);
    gain.connect(audioResumer.destination);
    gain.gain.value = 0.01;
    osc.start();
    osc.stop(audioResumer.currentTime + 0.1);
  };
=======
  const { isListening, toggleListening, speak, unlockAudio, pauseListening, resumeListening } = useSpeech(onProcessText);
>>>>>>> sovereign-elite-v3-6

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

<<<<<<< HEAD
  useEffect(() => {
    if (activeTab === 'knowledge' && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [nova.messages, activeTab]);

=======
>>>>>>> sovereign-elite-v3-6
  const triggerEvolution = async () => {
    const proposal = await nova.core.evolve();
    nova.addBotMessage('nova_core', proposal);
  };

  return (
<<<<<<< HEAD
    <div className="w-full h-[100dvh] relative flex flex-col bg-transparent text-slate-900 overflow-hidden" style={{ position: 'fixed', top: 0, left: 0 }}>
      {/* 🧬 PERSISTENCE PULSE (Keeps WebSocket + Audio Alive) */}
      <BackgroundPersistence onUnlock={handleManualUnlock} listening={isListening} />

      {/* 👑 VERSION STAMP (v6.7 Safety) */}
      <div className="fixed top-24 right-4 z-[999] opacity-40 pointer-events-none">
        <span className="text-[10px] font-black uppercase text-slate-900 tracking-tighter whitespace-nowrap leading-none transition-all">{CURRENT_VERSION}</span>
      </div>

      {/* 🔊 VOLUME MONITOR (Debug v6.7) */}
      <div className="fixed top-6 right-36 z-[1000] pointer-events-none">
        <span className="bg-slate-900/80 text-cyan-400 text-[10px] font-black px-2 py-1 rounded-md border border-cyan-500/50 shadow-md">
          VOICE: {Math.round((highGain ? Math.min(1.0, (volume / 100) * 2.0) : (volume / 100)) * 100)}% (RAW: {volume}%)
        </span>
      </div>

      <main className={`flex-1 relative z-10 flex flex-col pt-12 px-6 pb-6 ${activeTab === 'home' ? 'overflow-hidden' : 'overflow-y-auto'} no-scrollbar`}>
=======
    <div className="w-full h-[100dvh] relative flex flex-col bg-transparent text-white overflow-hidden select-none" style={{ position: 'fixed', top: 0, left: 0 }}>
      <main className="flex-1 relative z-10 flex flex-col pt-12 px-6 pb-6 overflow-y-auto no-scrollbar">
>>>>>>> sovereign-elite-v3-6

        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col items-center justify-between pb-24 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-full flex justify-between items-center px-4 mt-2">
              <h1 className="text-2xl font-black italic tracking-tighter text-white text-glow-cyan">NOVA ELITE</h1>
              <div className="flex items-center gap-2">
<<<<<<< HEAD
                <StatusBadge
                  label={`Brain: ${relayAlive ? 'Sovereign' : 'Offline'}`}
                  status={relayAlive ? 'online' : 'offline'}
                  className="shadow-glow-cyan"
                />
=======
                <StatusBadge label="BRAIN" status={nova.connections?.brain === 'online' ? 'online' : 'error'} />
                <StatusBadge label="CORE" status="online" />
>>>>>>> sovereign-elite-v3-6
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
<<<<<<< HEAD
              <div className="h-20 flex flex-col items-center justify-center mb-6 w-full px-8">
                {acknowledgment && <div className="text-cyan-600 font-black uppercase tracking-[0.2em]">{acknowledgment}</div>}
                {!acknowledgment && lastResponse && (
                  <div className="bg-white/95 border-2 border-cyan-500/50 p-4 rounded-3xl shadow-2xl max-w-xs animate-in fade-in slide-in-from-top-2 duration-500 relative">
                    <p className="text-slate-900 text-xs font-black uppercase tracking-tight line-clamp-3 text-center">
                      {lastResponse}
                    </p>
                    <button
                      onClick={() => speak(lastResponse, highGain ? Math.min(1.0, (volume / 100) * 2.0) : (volume / 100))}
                      className="absolute -right-2 -top-2 bg-cyan-600 text-white p-2 rounded-full shadow-lg active:scale-90"
                      title="Re-Talk"
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                )}
                {isThinking && !acknowledgment && <div className="flex gap-3 animate-pulse"><div className="w-3 h-3 bg-cyan-600 rounded-full" /><div className="w-3 h-3 bg-purple-600 rounded-full" /></div>}
              </div>

              <div className="ripple-container">
                {isListening && (
                  <>
                    <div className="ripple-ring" />
                    <div className="ripple-ring" />
                    <div className="ripple-ring" />
                  </>
                )}
                <button
                  onClick={() => {
                    if (!isListening) {
                      unlockAudio();
                      toggleListening();
                    } else {
                      toggleListening();
                    }
                  }}
                >
                  <Mic size={72} className={isListening ? 'text-white' : 'text-cyan-600'} />
                </button>
              </div>

              {/* 📝 EMERGENCY TEXT INPUT (v6.4) */}
              <div className="w-full max-w-sm px-6 mt-4 flex gap-2">
                <input
                  id="nova-text-input"
                  type="text"
                  placeholder="Type a message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      onProcessText(input.value);
                      input.value = '';
                    }
                  }}
                  className="flex-1 bg-white border-2 border-slate-300 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:border-cyan-500 outline-none shadow-xl"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('nova-text-input') as HTMLInputElement;
                    if (input && input.value) {
                      onProcessText(input.value);
                      input.value = '';
                    }
                  }}
                  className="bg-cyan-600 text-white p-3 rounded-2xl shadow-xl active:scale-95"
                >
                  <Database size={24} />
                </button>
              </div>

              <button onClick={handleHardRefresh} className="mb-4 mt-8 flex items-center gap-2 bg-rose-900 border-2 border-rose-600 px-8 py-4 rounded-full shadow-2xl transition-all font-black text-xs uppercase tracking-widest text-white hover:bg-rose-950 active:scale-95">
                <Trash2 size={16} /> EMERGENCY RESET
              </button>
            </div>

            <div className="w-full max-w-md grid grid-cols-3 gap-4 px-4 mt-auto mb-16 opacity-100">
              <div className="bg-white/90 border border-slate-300 p-6 rounded-[2.5rem] flex flex-col items-center status-hub-item shadow-xl backdrop-blur-xl">
                <Activity size={32} className="text-cyan-600 mb-3" />
                <span className="text-[12px] font-black uppercase text-slate-500 tracking-[0.2em]">Network</span>
                <span className="text-lg font-black text-slate-900">98%</span>
              </div>
              <div className="bg-white/90 border border-slate-300 p-6 rounded-[2.5rem] flex flex-col items-center status-hub-item shadow-xl backdrop-blur-xl">
                <Shield size={32} className="text-purple-600 mb-3" />
                <span className="text-[12px] font-black uppercase text-slate-500 tracking-[0.2em]">Sovereign</span>
                <span className="text-lg font-black text-slate-900">Active</span>
              </div>
              <div className="bg-white/90 border border-slate-300 p-6 rounded-[2.5rem] flex flex-col items-center status-hub-item shadow-xl backdrop-blur-xl">
                <Zap size={32} className="text-amber-600 mb-3" />
                <span className="text-[12px] font-black uppercase text-slate-500 tracking-[0.2em]">Mesh</span>
                <span className="text-lg font-black text-slate-900">Stable</span>
              </div>
            </div>
          </div>
        )
        }

        {
          activeTab === 'features' && (
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
          )
        }

        {
          activeTab === 'manifest' && (
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
          )
        }

        {
          activeTab === 'knowledge' && (
            <div className="p-4 h-full flex flex-col pt-12 overflow-hidden">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-6 text-white text-glow-cyan">Data Stream</h2>
              <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-4 no-scrollbar pb-48">
                {nova.messages.map((m: any) => (
                  <div key={m.id} className={`p-6 border-l-8 rounded-3xl ${m.from === 'user' ? 'border-rose-500 bg-white/5' : 'border-cyan-500 bg-cyan-900/40'}`}>
                    <p className="text-sm font-medium leading-relaxed">{m.content || m.text}</p>
                  </div>
                ))}
                <div id="scroll-anchor" className="h-2" />
              </div>
            </div>
          )
        }

        {
          activeTab === 'settings' && (
            <div className="flex-1 flex flex-col gap-10 py-8 px-4 animate-in fade-in slide-in-from-bottom-4 overflow-y-auto no-scrollbar pb-40">
              <div className="glass-card p-10 bg-[#0d1929] border-cyan-400/40 shadow-2xl">
                <h3 className="text-2xl font-black uppercase text-white text-glow-cyan mb-8">Calibration</h3>
                <div className="grid grid-cols-1 gap-6">
                  {/* 🔊 SOVEREIGN GAIN SLIDER (v5.6 moved to Settings) */}
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-black text-white/40 uppercase tracking-widest leading-loose">Sovereign Output Gain</span>
                      <span className="text-3xl font-black text-cyan-400">{volume}%</span>
                    </div>
                    <div className="py-4">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={volume}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          setVolume(v);
                          (window as any).NOVA_VOLUME = v / 100;
                          localStorage.setItem('nova_saved_vol', (v / 100).toString());
                        }}
                        className="w-full h-8 bg-white/5 rounded-full appearance-none accent-cyan-400 cursor-pointer"
                      />
                    </div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest mt-2">
                      30% Baseline | 100% Extreme Road Boost (15x Gain)
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                    <span className="text-xs font-black text-cyan-400 uppercase">Sovereign Boost</span>
                    <button onClick={() => setHighGain(!highGain)} className={`px-6 py-2 rounded-full font-black text-xs transition-all ${highGain ? 'bg-cyan-500 text-white shadow-glow-cyan' : 'bg-white/5 text-white/40'}`}>
                      {highGain ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                    <span className="text-xs font-black text-purple-400 uppercase">Always Listen</span>
                    <button onClick={() => setAlwaysListen(!alwaysListen)} className={`px-6 py-2 rounded-full font-black text-xs transition-all ${alwaysListen ? 'bg-purple-500 text-white' : 'bg-white/5 text-white/40'}`}>
                      {alwaysListen ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <span className="text-xs font-black text-amber-400 uppercase">Mirror Tone</span>
                    <button onClick={() => setMirrorTone(!mirrorTone)} className={`px-6 py-2 rounded-full font-black text-xs transition-all ${mirrorTone ? 'bg-amber-500 text-white' : 'bg-white/5 text-white/40'}`}>
                      {mirrorTone ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 bg-rose-500/5 border-rose-500/20 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black uppercase text-rose-400">Memory Management</h4>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Wipe local cognitive cache</p>
                  </div>
                  <button onClick={handleHardRefresh} className="p-3 bg-rose-500/20 text-rose-400 rounded-xl hover:bg-rose-500 transition-all hover:text-white">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="glass-card p-6 bg-[#0d1929] border-purple-400/20">
                <SovereignDashboard status={nova.status} onToggleHalt={() => nova.core.toggleHalt()} />
              </div>
            </div>
          )
        }
      </main >

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[320px] z-[999]">
        <div className="bg-slate-900 px-3 py-2.5 flex justify-between items-center border border-cyan-500/30 rounded-full shadow-2xl">
          <button onClick={() => setActiveTab('home')} className={`p-3 rounded-full transition-all ${activeTab === 'home' ? 'bg-cyan-400 text-black shadow-lg scale-110' : 'text-cyan-100/60 hover:text-white'}`}><Home size={20} /></button>
          <button onClick={() => setActiveTab('features')} className={`p-3 rounded-full transition-all ${activeTab === 'features' ? 'bg-cyan-400 text-black shadow-lg scale-110' : 'text-cyan-100/60 hover:text-white'}`}><Briefcase size={20} /></button>
          <button onClick={() => setActiveTab('manifest')} className={`p-3 rounded-full transition-all ${activeTab === 'manifest' ? 'bg-cyan-400 text-black shadow-lg scale-110' : 'text-cyan-100/60 hover:text-white'}`}><Shield size={20} /></button>
          <button onClick={() => setActiveTab('knowledge')} className={`p-3 rounded-full transition-all ${activeTab === 'knowledge' ? 'bg-cyan-400 text-black shadow-lg scale-110' : 'text-cyan-100/60 hover:text-white'}`}><Database size={20} /></button>
          <button onClick={() => setActiveTab('settings')} className={`p-3 rounded-full transition-all ${activeTab === 'settings' ? 'bg-cyan-400 text-black shadow-lg scale-110' : 'text-cyan-100/60 hover:text-white'}`}><SettingsIcon size={20} /></button>
        </div>
      </nav>
    </div >
=======
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
>>>>>>> sovereign-elite-v3-6
  );
}

export default App;

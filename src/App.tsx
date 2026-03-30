import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNova } from './hooks/useNova';
import { SelfAuditAgent } from './core/agents/SelfAuditAgent';
import { DiscoveryAgent } from './core/agents/DiscoveryAgent';
import { useSpeech } from './hooks/useSpeech';
import {
  Home, Shield, Database, Settings as SettingsIcon, Mic,
  AlertTriangle, Check, Brain, Wrench,
  Briefcase, Activity, RotateCw, Trash2, ShieldAlert, Zap, Volume2
} from 'lucide-react';
import { StatusBadge } from './components/StatusBadge';
import { SovereignDashboard } from './components/SovereignDashboard';

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
      <button
        onClick={onUnlock}
        className="fixed top-4 right-4 z-[1000] px-4 py-3 bg-slate-950 border-2 border-cyan-500 rounded-full text-[10px] font-black uppercase tracking-widest text-cyan-400 animate-pulse transition-all active:scale-95 shadow-2xl"
      >
        Unlock Pulse
      </button>

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

  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'manifest' | 'knowledge' | 'settings'>('home');
  const [volume, setVolume] = useState(30);
  const [relayAlive, setRelayAlive] = useState(false);
  const selfAudit = useMemo(() => new SelfAuditAgent(), []);
  const discovery = useMemo(() => new DiscoveryAgent(), []);
  const [isThinking, setIsThinking] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('NOVA_CEREBRAS_KEY') || '');
  const [acknowledgment, setAcknowledgment] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [highGain, setHighGain] = useState(true);
  const [alwaysListen, setAlwaysListen] = useState(false);
  const [mirrorTone, setMirrorTone] = useState(true);
  const [lastResponse, setLastResponse] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [completedFeatures, setCompletedFeatures] = useState<string[]>([
    "Read local files", "Online weather/news", "Basic memory", "Interference resistance",
    "Tone Matching", "System Integration", "Task Automation (OODAR)",
    "Emotional Intelligence", "Cognitive Mirroring (Ray)", "Intent Parsing",
    "Schooling Agent (6h Cycle)", "Sovereign Mind Hub Sync", "Sovereign Scribe (Local)",
    "Solutions Vault", "Self-Correction Log", "Cloud-Native Relay"
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
    { level: 11, title: "Sovereign Singularity", status: "Locked", attributes: ["Doctorate reasoning", "Neural Mirror sync", "Autonomous evolution"] }
  ];

  const speakRef = useRef<((text: string, vol?: number, pitch?: number, rate?: number) => void) | null>(null);

  const checkForRelay = useCallback(async () => {
    if (nova.connections?.brain === 'online') {
      setRelayAlive(true);
      return;
    }

    try {
      const { data } = await nova.core.supabase
        .from('agent_architect_comms')
        .select('created_at')
        .eq('sender', 'vps_heartbeat')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data[0]) {
        const lastPulse = new Date(data[0].created_at).getTime();
        const diff = Date.now() - lastPulse;
        if (diff < 120000) {
          setRelayAlive(true);
          return;
        }
      }
    } catch (e) {
      console.warn("⚠️ Heartbeat check failed:", e);
    }

    setRelayAlive(false);
  }, [nova.connections, nova.core.supabase]);

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

  useEffect(() => {
    // 🧠 SOVEREIGN SYNC: Local state mirrors the Core Engine status
    const syncRelay = () => {
      const isOnline = nova.connections?.brain === 'online';
      if (isOnline !== relayAlive) setRelayAlive(isOnline);
    };
    const timer = setInterval(syncRelay, 2000);
    return () => clearInterval(timer);
  }, [nova.connections?.brain, relayAlive]);

  const onProcessText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsThinking(true);
    try {
      await nova.processWithNova(text, {
        onReceipt: (receipt: any) => {
          setAcknowledgment(null);
          const isDesktop = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

          // 🔊 AUDIO LOGIC (v7.2-HYBRID):
          // If the Bridge is alive, we use the high-fidelity Mirror (Bridge)
          // ONLY use Browser TTS if we are in High Gain mode or if the Bridge is offline
          const useBrowserTTS = (!relayAlive || highGain);

          if (speakRef.current && useBrowserTTS) {
            const browserVolume = highGain ? Math.min(1.0, (volume / 100) * 1.5) : (volume / 100);
            const msgText = typeof receipt === 'string' ? receipt : (receipt?.message || JSON.stringify(receipt));
            const cleanText = msgText.replace(/I'm standing by\.|My cloud-link is a bit hazy\.|standing by\./gi, '').trim();
            setLastResponse(cleanText);

            if (cleanText.length > 0) {
              speakRef.current!(cleanText, browserVolume);
            }
          }
        }
      });
    } catch (err) {
      console.error('Nova Processing Error:', err);
    } finally {
      setIsThinking(false);
    }
  }, [nova, volume, relayAlive, highGain]);

  const { isListening, toggleListening, speak, unlockAudio, pauseListening, resumeListening, reinitialize } = useSpeech(onProcessText);

  const handleManualUnlock = () => {
    unlockAudio();
    reinitialize();
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

  useEffect(() => {
    speakRef.current = speak;
    (window as any).NOVA_PAUSE_LISTENING = () => pauseListening();
    (window as any).NOVA_RESUME_LISTENING = () => resumeListening();

    const interval = setInterval(() => {
      onProcessText("ACTIVATE DOCTORAL MANDATE: Check progress and study.");
    }, 6 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [speak, pauseListening, resumeListening, onProcessText]);

  useEffect(() => {
    if (activeTab === 'knowledge' && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [nova.messages, activeTab]);

  return (
    <div className="w-full h-[100dvh] relative flex flex-col bg-transparent text-slate-900 overflow-hidden" style={{ position: 'fixed', top: 0, left: 0 }}>
      <BackgroundPersistence onUnlock={handleManualUnlock} listening={isListening} />

      <div className="fixed top-24 right-4 z-[999] opacity-40 pointer-events-none">
        <span className="text-[10px] font-black uppercase text-slate-900 tracking-tighter whitespace-nowrap leading-none transition-all">{CURRENT_VERSION}</span>
      </div>

      <div className="fixed top-6 right-36 z-[1000] pointer-events-none">
        <span className="bg-slate-900/80 text-cyan-400 text-[10px] font-black px-2 py-1 rounded-md border border-cyan-500/50 shadow-md">
          VOICE: {Math.round((highGain ? Math.min(1.0, (volume / 100) * 2.0) : (volume / 100)) * 100)}%
        </span>
      </div>

      <main className={`flex-1 relative z-10 flex flex-col pt-12 px-6 pb-6 ${activeTab === 'home' ? 'overflow-hidden' : 'overflow-y-auto'} no-scrollbar`}>
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col items-center justify-between pb-24 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-full flex justify-between items-center px-4 mt-2">
              <h1 className="text-2xl font-black italic tracking-tighter text-white text-glow-cyan">NOVA ELITE</h1>
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={`Brain: ${relayAlive ? 'Sovereign' : 'Offline'}`}
                  status={relayAlive ? 'online' : 'offline'}
                  className="shadow-glow-cyan"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full relative">
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
                    >
                      <Volume2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="ripple-container">
                {isListening && <div className="ripple-ring" />}
                <button
                  onClick={() => {
                    if (!isListening) unlockAudio();
                    toggleListening();
                  }}
                  className={`w-40 h-40 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-cyan-500 shadow-glow-cyan' : 'bg-slate-900 border-2 border-cyan-500'}`}
                >
                  <Mic size={64} className={isListening ? 'text-white' : 'text-cyan-400'} />
                </button>
              </div>

              <div className="w-full max-w-sm px-6 mt-12 flex gap-2">
                <input
                  id="nova-text-input"
                  type="text"
                  placeholder="Type a message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onProcessText(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                  className="flex-1 bg-white border-2 border-slate-300 rounded-2xl px-4 py-3 text-slate-900 font-bold outline-none shadow-xl"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('nova-text-input') as HTMLInputElement;
                    if (input && input.value) {
                      onProcessText(input.value);
                      input.value = '';
                    }
                  }}
                  className="bg-cyan-600 text-white p-3 rounded-2xl shadow-xl"
                >
                  <Database size={24} />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="flex-1 flex flex-col gap-6 py-12 px-8 overflow-y-auto no-scrollbar pb-40">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white">System Inventory</h2>
            <div className="flex flex-col gap-8">
              {autonomyLevels.map(lvl => (
                <div key={lvl.level} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-white/20 uppercase">Level {lvl.level}</span>
                    <div className="h-[1px] flex-1 bg-white/10" />
                    <span className="text-[10px] font-black text-cyan-400/60 uppercase">{lvl.title}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {lvl.attributes.map(feat => (
                      <div key={feat} className={`p-4 flex items-center justify-between border-2 rounded-2xl ${completedFeatures.includes(feat) ? 'bg-cyan-700/40 border-cyan-400/30' : 'bg-white/5 border-white/5 opacity-40'}`}>
                        <span className="text-[12px] font-black uppercase text-white">{feat}</span>
                        {completedFeatures.includes(feat) && <Check size={14} className="text-cyan-400" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="p-4 h-full flex flex-col pt-12">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-6 text-white">Data Stream</h2>
            <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col gap-4 no-scrollbar pb-48">
              {nova.messages.map((m: any) => (
                <div key={m.id} className={`p-6 border-l-8 rounded-3xl ${m.from === 'user' ? 'border-rose-500 bg-white/5' : 'border-cyan-500 bg-cyan-900/40'}`}>
                  <p className="text-sm font-medium leading-relaxed text-white">{m.content || m.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col gap-10 py-8 px-4 overflow-y-auto no-scrollbar pb-40">
            <div className="p-10 bg-[#0d1929] rounded-[2.5rem] border-2 border-cyan-400/40 shadow-2xl">
              <h3 className="text-2xl font-black uppercase text-white mb-8">Calibration</h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-black text-white/40 uppercase">Output Gain</span>
                    <span className="text-3xl font-black text-cyan-400">{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-full h-8 bg-white/5 rounded-full appearance-none accent-cyan-400 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                  <span className="text-xs font-black text-cyan-400 uppercase">Sovereign Boost</span>
                  <button onClick={() => setHighGain(!highGain)} className={`px-6 py-2 rounded-full font-black text-xs transition-all ${highGain ? 'bg-cyan-500 text-white shadow-glow-cyan' : 'bg-white/5 text-white/40'}`}>
                    {highGain ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
            <button onClick={handleHardRefresh} className="p-6 bg-rose-900/40 border-2 border-rose-500 rounded-3xl flex items-center justify-between">
              <div className="text-left">
                <h4 className="text-sm font-black uppercase text-rose-400">Nuclear Reset</h4>
                <p className="text-[10px] text-white/40 uppercase">Wipe local cache</p>
              </div>
              <Trash2 className="text-rose-400" />
            </button>
            <SovereignDashboard status={nova.status} onToggleHalt={() => nova.core.toggleHalt()} />
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[320px] z-[999]">
        <div className="bg-slate-900/90 px-3 py-2.5 flex justify-between items-center border border-cyan-500/30 rounded-full backdrop-blur-xl shadow-2xl">
          <button onClick={() => setActiveTab('home')} className={`p-3 rounded-full ${activeTab === 'home' ? 'bg-cyan-400 text-black' : 'text-cyan-100/60'}`}><Home size={20} /></button>
          <button onClick={() => setActiveTab('features')} className={`p-3 rounded-full ${activeTab === 'features' ? 'bg-cyan-400 text-black' : 'text-cyan-100/60'}`}><Briefcase size={20} /></button>
          <button onClick={() => setActiveTab('manifest')} className={`p-3 rounded-full ${activeTab === 'manifest' ? 'bg-cyan-400 text-black' : 'text-cyan-100/60'}`}><Shield size={20} /></button>
          <button onClick={() => setActiveTab('knowledge')} className={`p-3 rounded-full ${activeTab === 'knowledge' ? 'bg-cyan-400 text-black' : 'text-cyan-100/60'}`}><Database size={20} /></button>
          <button onClick={() => setActiveTab('settings')} className={`p-3 rounded-full ${activeTab === 'settings' ? 'bg-cyan-400 text-black' : 'text-cyan-100/60'}`}><SettingsIcon size={20} /></button>
        </div>
      </nav>
    </div>
  );
}

export default App;

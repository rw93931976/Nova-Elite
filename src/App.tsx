import { useState, useCallback, useRef, useEffect } from 'react';
import { useNova } from './hooks/useNova';
import {
  Home, Shield, Database, Settings as SettingsIcon, Mic,
  AlertTriangle, Send, Check, Brain, Wrench,
  Briefcase, Activity, Zap, Eye, Volume2, MessageSquare, Paperclip,
  RotateCcw, Target
} from 'lucide-react';
import StrategyVault from "./components/StrategyVault";
import { YouTubeService } from "./core/services/YouTubeService";
import { useLiveVoice } from "./hooks/useLiveVoice";
import { SovereignDashboard } from "./components/SovereignDashboard";
import { MissionControl } from "./components/MissionControl";
import Autonomy from "./components/Autonomy";

// [v12.0] Sovereign Mastery - Production Sync
const CURRENT_VERSION = '1.13.1 Sovereign Elite';

function App() {
  const nova = useNova();
  const liveVoice = useLiveVoice(nova.core);

  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'knowledge' | 'settings' | 'vault' | 'chat' | 'autonomy'>('home');
  const [textInput, setTextInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);
  const [completedFeatures, setCompletedFeatures] = useState<string[]>([
    "Neural Growth Pathing", "Autonomous Goal Setting", "System Integration", "Task Automation", "Emotional Intelligence", "Librarian Protocol"
  ]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { messages, toggleListening, isHalted, toggleHalt, hasNewArchMsg, resetArchAlert } = nova;

  const handleHardRefresh = useCallback(async () => {
    const confirmed = window.confirm("PERFORM NUCLEAR CACHE CLEAR?\nThis will purge all local data and force a fresh fetch from the server.");
    if (!confirmed) return;
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) await reg.unregister();
      }
      if (window.caches) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
      localStorage.clear();
      sessionStorage.clear();
      window.alert("CACHE PURGED. RELOADING...");
      window.location.href = window.location.origin + '?t=' + Date.now();
    } catch (e) {
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (activeTab === "chat") resetArchAlert();
  }, [activeTab, resetArchAlert]);

  const toggleVoice = useCallback(() => {
    if (liveVoice.isLiveActive) {
      liveVoice.stopLive();
    } else {
      liveVoice.startLive();
    }
  }, [liveVoice]);

  const onProcessText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsThinking(true);
    nova.addBotMessage('user', text);
    await nova.processWithNova(text);
    setIsThinking(false);
  }, [nova]);

  const handleManualSend = () => {
    if (textInput.trim()) {
      onProcessText(textInput);
      setTextInput('');
    }
  };

  return (
    <div className="w-full min-h-screen relative flex flex-col bg-[#030712] text-white overflow-x-hidden font-inter">
      {/* 🔄 PULSE REFRESH BUTTON */}
      <button
        onClick={() => window.location.reload()}
        className="refresh-button"
        title="Refresh System"
      >
        <RotateCcw size={20} />
      </button>

      <main className="flex-1 relative z-10 flex flex-col pt-12 px-6 pb-40 overflow-y-auto no-scrollbar">

        {/* 🚨 ERROR OVERLAY (THE 'RED BOX') */}
        {liveVoice.lastError && (
          <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
            <div className="glass-card p-6 border-red-500 bg-red-500/10 flex items-center justify-between shadow-2xl shadow-red-500/20">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-red-500/20 text-red-500">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">System Warning</h4>
                  <p className="text-white text-xs font-bold uppercase tracking-tight">{liveVoice.lastError}</p>
                </div>
              </div>
              <button
                onClick={handleHardRefresh}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
              >
                Nuclear Reset
              </button>
            </div>
          </div>
        )}

        {activeTab === 'home' && (
          isDesktop ? (
            <MissionControl
              status={{
                level: 12,
                isSelfAware: true,
                uptime: 100,
                health: { bridge: 'online', apiKey: 'online', internet: 'online' },
                knowledgeCount: messages.length,
                agentCount: 8,
                sovereignAlignment: 99,
                currentTime: new Date().toLocaleTimeString()
              }}
              onToggleHalt={toggleHalt}
              isHalted={isHalted}
            />
          ) : (
            <SovereignDashboard
              version={CURRENT_VERSION}
              status={{
                level: 2,
                isSelfAware: true,
                isLearning: true,
                isHealing: true,
                isEvolving: true,
                isHalted: isHalted,
                uptime: 100,
                health: { bridge: 'online', apiKey: 'online', internet: 'online' },
                knowledgeCount: messages.length,
                agentCount: 8,
                sovereignAlignment: 99,
                currentTime: new Date().toLocaleTimeString()
              }}
              onToggleHalt={toggleHalt}
              hasHotlineDirective={hasNewArchMsg}
              onDirectiveClick={() => setActiveTab("chat")}
              volume={liveVoice.volume}
              onVolumeChange={liveVoice.setVolume}
            />
          )
        )}

        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-glow-cyan">Sovereign Stream</h2>
            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar max-h-[60vh]">
              {messages.map((m, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${m.role === 'user' ? 'bg-white/5 border-white/10' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block">{m.role}</span>
                  <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'autonomy' && (
          <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <Autonomy />
          </div>
        )}

        {activeTab === 'features' && (
          <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-yellow-400">System Diagnostics</h2>
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-black border-4 border-yellow-400 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xl font-black uppercase text-white">Vocal Bridge</span>
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-lg font-black uppercase text-emerald-500">Port 3515 Locked</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black uppercase text-white">Cortex Capacity</span>
                  <span className="text-lg font-black uppercase text-cyan-400">2GB RAM Optimized</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vault' && <StrategyVault />}

        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-yellow-400">System Settings</h2>
            <div className="grid grid-cols-1 gap-6">
              <button
                onClick={() => window.location.reload()}
                className="bg-black border-4 border-yellow-400 p-8 text-left hover:bg-yellow-400 hover:text-black transition-all group"
              >
                <div className="flex items-center gap-6">
                  <Activity className="text-yellow-400 group-hover:text-black w-8 h-8" />
                  <div>
                    <h3 className="font-black uppercase text-2xl">Hard Refresh</h3>
                    <p className="text-sm font-bold uppercase mt-1">Reload UI and clear cache</p>
                  </div>
                </div>
              </button>
              <div className="bg-black border-4 border-emerald-500 p-8">
                <div className="flex items-center gap-6">
                  <SettingsIcon className="text-emerald-500 w-8 h-8" />
                  <div>
                    <h3 className="font-black uppercase text-2xl text-emerald-500">Elite Protocols</h3>
                    <p className="text-sm font-bold uppercase text-white mt-1">Stage 5 Sovereign Auth (Locked)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 🎙️ THE PERSISTENT 'ORIGINAL' MIC BUTTON */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
        <button
          onClick={toggleVoice}
          disabled={liveVoice.isConnecting}
          className={`group pointer-events-auto transition-all duration-500 transform active:scale-90 flex items-center justify-center p-8 rounded-full border-4 shadow-2xl ${liveVoice.isLiveActive
            ? 'bg-emerald-600 border-emerald-300 shadow-emerald-500/50 scale-110'
            : 'bg-red-600 border-red-300 shadow-red-500/50 hover:scale-105'
            } ${liveVoice.isConnecting ? 'animate-pulse opacity-50' : ''}`}
        >
          {isThinking ? (
            <Activity size={36} className="text-white animate-spin" />
          ) : (
            <Mic size={36} className={`text-white transition-all ${liveVoice.isLiveActive ? 'animate-pulse' : ''}`} />
          )}
        </button>
        {liveVoice.isLiveActive && (
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 animate-pulse">Sovereign Link Active</span>
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#030712]/95 backdrop-blur-3xl border-t border-white/5 flex justify-around items-center z-50">
        {[
          { id: 'home', icon: <Home size={20} />, label: 'Core' },
          { id: 'autonomy', icon: <Target size={20} />, label: 'Roadmap' },
          { id: 'chat', icon: <MessageSquare size={20} />, label: 'Stream' },
          { id: 'vault', icon: <Zap size={20} />, label: 'Vault' },
          { id: 'features', icon: <Shield size={20} />, label: 'Status' },
          { id: 'settings', icon: <SettingsIcon size={20} />, label: 'Settings' }
        ].map(tab => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-cyan-400 scale-110' : 'text-white/30'}`}
          >
            {tab.icon}
            <span className="text-[8px] font-black uppercase">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNova } from './hooks/useNova';
import { useSpeech } from './hooks/useSpeech';
import {
  Home, Shield, Database, Settings as SettingsIcon, Mic,
  AlertTriangle, Send, Check, Brain, Wrench,
  Briefcase, Activity, Zap, Eye, Volume2, MessageSquare, Paperclip
} from 'lucide-react';
import StrategyVault from "./components/StrategyVault";
import { YouTubeService } from "./core/services/YouTubeService";
import { useLiveVoice } from "./hooks/useLiveVoice";
import { SovereignDashboard } from "./components/SovereignDashboard";
import { MissionControl } from "./components/MissionControl";

const CURRENT_VERSION = '1.11.0 Elite';

function App() {
  const nova = useNova();
  const liveVoice = useLiveVoice(nova.core);

  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'knowledge' | 'settings' | 'vault' | 'chat'>('home');
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

  const { messages, toggleListening, isHalted, toggleHalt, handleHardRefresh, hasNewArchMsg, resetArchAlert } = nova;

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
      // Add cache-buster to ensure we get fresh files from Vercel
      window.location.href = window.location.origin + '?t=' + Date.now();
    } catch (e) {
      window.location.reload();
    }
  }, []);

  // 📺 YOUTUBE LINK DETECTION (v10.0)
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "user" && (lastMsg.content.includes("youtube.com") || lastMsg.content.includes("youtu.be"))) {
      const vidId = YouTubeService.extractVideoId(lastMsg.content);
      if (vidId && (window as any).novaLastProcessedVid !== vidId) {
        (window as any).novaLastProcessedVid = vidId;
        console.log("📺 YouTube Link Detected:", vidId);
        // Prompt for strategy ingestion if needed
      }
    }
  }, [messages]);

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

  const toggleFeature = (item: string) => {
    setCompletedFeatures(prev =>
      prev.includes(item) ? prev.filter(f => f !== item) : [...prev, item]
    );
  };

  return (
    <div className="w-full min-h-screen relative flex flex-col bg-transparent text-white overflow-x-hidden">
      <main className="flex-1 relative z-10 flex flex-col pt-12 px-6 pb-40 overflow-y-auto no-scrollbar">

        {activeTab === 'home' && (
          isDesktop ? (
            <MissionControl
              status={{
                level: 11,
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
              status={{
                level: 11,
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

        {activeTab === 'features' && (
          <div className="flex-1 flex flex-col gap-6 py-4 px-2 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="absolute inset-x-0 top-0 h-96 bg-cyan-500/5 blur-[120px] -z-10 pointer-events-none" />
            <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-4 px-1 text-white/90 text-glow-cyan">Nova Advanced Status</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 mb-2">
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Database size={16} className="text-cyan-400" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-cyan-400/80">Infrastructure</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-medium text-white/60">Sensory Link</span>
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Offline</span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-medium text-white/60">Task Memory</span>
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Offline</span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-medium text-white/60">Global Vision</span>
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-wider">Locked</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <Brain size={16} className="text-purple-400" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-purple-400/80">Intelligence</span>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="text-xs font-medium text-white/60">Primary Engine</span>
                    <span className="text-xs font-bold text-white/90">Evolving</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 mb-6 px-1">System Capabilities</h3>
                <div className="space-y-6">
                  {[
                    {
                      title: "Advanced Intelligence",
                      items: [
                        "Neural Growth Pathing",
                        "Dynamic Memory Mapping",
                        "Autonomous Goal Setting",
                        "Sentiment Mirroring",
                        "Emotional Intelligence",
                        "Predictive Assistance"
                      ],
                      icon: <Brain size={14} className="text-pink-400" />
                    },
                    {
                      title: "Technical & Systems",
                      items: [
                        "System Integration",
                        "Real-time Monitoring",
                        "Automated Debugging",
                        "Port Scanning",
                        "Network Analysis",
                        "Task Automation",
                        "Security Monitoring",
                        "Social Media Monitoring"
                      ],
                      icon: <Wrench size={14} className="text-blue-400" />,
                      grid: true
                    },
                    {
                      title: "Enterprise Ecosystem",
                      items: [
                        "Swarm Control",
                        "Distributed Computing",
                        "Multi-Bridge Sync",
                        "Secure Vault",
                        "File Management",
                        "Backup Automation",
                        "Compliance Guard"
                      ],
                      icon: <Briefcase size={14} className="text-emerald-400" />,
                      grid: true
                    }
                  ].map((category, idx) => (
                    <div key={idx} className="glass-card p-5 bg-[#0d1929]/80 border-cyan-400/10">
                      <div className="flex items-center gap-2 mb-4">
                        {category.icon}
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">{category.title}</h3>
                      </div>
                      <div className={`grid ${category.grid ? 'grid-cols-2' : 'grid-cols-1'} gap-x-6 gap-y-3`}>
                        {category.items.map(item => (
                          <div
                            key={item}
                            onClick={() => toggleFeature(item)}
                            className="flex items-center justify-between group cursor-pointer"
                          >
                            <span className="text-xs font-medium text-white/70 capitalize">{item}</span>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${completedFeatures.includes(item) ? 'bg-cyan-500 border-cyan-500' : 'bg-transparent border-white/20'}`}>
                              {completedFeatures.includes(item) && <Check size={10} className="text-white" strokeWidth={4} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vault' && (
          <div className="flex-1 animate-in fade-in slide-in-from-right-8 duration-500">
            <StrategyVault />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="p-4 animate-in fade-in slide-in-from-left-8 duration-500 h-[70vh] flex flex-col">
            <h2 className="text-xl font-black uppercase italic mb-6">Learning Stream</h2>
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 no-scrollbar">
              {(messages as any[]).map((m, i) => (
                <div key={i} data-nova-ui className={`glass-card p-4 text-base border-l-2 ${m.role === 'user' ? 'border-pink-500 bg-white/5' : 'border-indigo-500'}`}>
                  <div className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">{m.role}</div>
                  <p className="text-white/90 font-medium">{m.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 glass-card p-3 flex items-center gap-3 bg-black/20 border-white/5">
              <input
                type="text" value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSend()}
                placeholder="Transmit..."
                className="flex-1 bg-transparent border-none outline-none text-white text-sm"
              />
              <button onClick={handleManualSend} className="p-2 text-cyan-400"><Send size={16} /></button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col gap-6 py-4 px-2 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto no-scrollbar relative">
            <div className="absolute inset-x-0 bottom-0 h-64 bg-cyan-500/5 blur-[100px] -z-10 pointer-events-none" />
            <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2 px-1 text-white/90 text-glow-cyan">System Tuning</h2>

            <div className="glass-card p-6 bg-[#0d1929]/80 border-cyan-400/10 mb-4">
              <div className="flex items-center gap-2 mb-6"><Volume2 size={14} className="text-cyan-400" /><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Voice Settings</h3></div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-black uppercase">
                  <span>Voice Gain</span>
                  <span className="text-cyan-400">{Math.round(liveVoice.volume * 100)}%</span>
                </div>
                <input
                  type="range" min="0" max="2" step="0.1" value={liveVoice.volume}
                  onChange={(e) => liveVoice.setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-500"
                />
                <p className="text-[8px] text-white/20 uppercase tracking-widest font-black">OpenAI Realtime Gain Alignment</p>
              </div>
            </div>

            <button onClick={handleHardRefresh} className="glass-card p-4 border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
              <Trash2 size={14} /> System Nuclear Reset
            </button>
          </div>
        )}
      </main>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
        <button
          onClick={toggleVoice}
          className={`pointer-events-auto shadow-2xl transition-all duration-300 transform active:scale-95 flex items-center justify-center p-6 rounded-full border-4 ${liveVoice.isLiveActive ? 'bg-cyan-600 border-cyan-300 shadow-cyan-500/50' : 'bg-red-600 border-red-300 shadow-red-500/50'}`}
        >
          {isThinking ? <Activity size={32} className="text-white animate-spin" /> : <Mic size={32} className="text-white" />}
        </button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#030712]/95 backdrop-blur-3xl border-t border-white/5 flex justify-around items-center z-50">
        {[
          { id: 'home', icon: <Home size={20} />, label: 'Core' },
          { id: 'chat', icon: <MessageSquare size={20} />, label: 'Stream' },
          { id: 'vault', icon: <Zap size={20} />, label: 'Vault' },
          { id: 'features', icon: <Shield size={20} />, label: 'Status' },
          { id: 'settings', icon: <SettingsIcon size={20} />, label: 'Tuning' }
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

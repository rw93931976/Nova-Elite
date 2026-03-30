import { useState, useCallback, useRef, useEffect } from 'react';
import { useNova } from './hooks/useNova';
import { useSpeech } from './hooks/useSpeech';
import {
  Home, Shield, Database, Settings as SettingsIcon, Mic,
  AlertTriangle, Send, Check, Brain, Wrench,
  Briefcase, Activity
} from 'lucide-react';
import { StatusBadge } from './components/StatusBadge';

const CURRENT_VERSION = "2.5.59-SOVEREIGN-MIND-v6.1.1";

function App() {
  const nova = useNova();
  // const { sendMessage, addBotMessage } = nova; // Commented out to fix TS6133

  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'knowledge' | 'settings'>('home');
  const [textInput, setTextInput] = useState('');
  const [volume, setVolume] = useState(30);
  const [isThinking, setIsThinking] = useState(false);
  const [completedFeatures, setCompletedFeatures] = useState<string[]>([
    "Neural Growth Pathing", "Autonomous Goal Setting", "System Integration", "Task Automation", "Emotional Intelligence", "Schooling Agent"
  ]);

  const speakRef = useRef<((text: string, vol?: number, pitch?: number, rate?: number) => void) | null>(null);

  const handleHardRefresh = useCallback(() => {
    // Normal refresh for stability
    window.location.reload();
  }, []);

  const onProcessText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setIsThinking(true);
    // Use the correctly typed destination
    nova.sendMessage('swarm' as 'swarm' | 'antigravity' | 'windsurf' | 'bridge', text);

    const thought = await nova.processWithNova(text, (receipt) => {
      nova.addBotMessage('nova_core', receipt);
      // Voice acknowledgment - speak the receipt immediately
      if (speakRef.current && !isListening) {
        const scaledVolume = Math.min(3.33, volume / 30);
        // Small delay to ensure user is done
        setTimeout(() => speakRef.current?.(receipt, scaledVolume), 300);
      }
    });
    setIsThinking(false);

    if (thought?.response) {
      if (thought.diagnostic) {
        console.warn('🧠 NOVA DIAGNOSTIC PAYLOAD:', thought.diagnostic);
        if (thought.recommendations) console.table(thought.recommendations);
      }
      // Volume calculation: 30% visual = 1.0 (max normal). 
      const scaledVolume = Math.min(3.33, volume / 30);
      const pitch = thought.tone?.pitch || 1.0;
      const rate = thought.tone?.rate || 1.0;

      if (speakRef.current) speakRef.current(thought.response, scaledVolume, pitch, rate);
      nova.addBotMessage('nova_core', thought.response);
    }
  }, [nova, volume]);

  const { isListening, toggleListening, speak } = useSpeech(onProcessText);

  useEffect(() => {
    speakRef.current = speak;
    console.info(`%c NOVA ELITE %c ${CURRENT_VERSION} `, 'background: #0f172a; color: #fff; padding: 2px 4px; border-radius: 4px;', 'background: #3b82f6; color: #fff; padding: 2px 4px; border-radius: 4px;');
  }, [speak]);

  const parseContext = (input: string) => {
    const text = input.toLowerCase();
    return {
      wantsDeepDiscovery: text.includes('search') || text.includes('find') || text.includes('look up') || text.includes('news') || text.includes('story') || text.includes('headline'),
      wantsWeather: text.includes('weather') || text.includes('temperature'),
      wantsOnlineSearch: text.includes('news') || text.includes('internet') || text.includes('live data') || text.includes('story') || text.includes('ai news') || text.includes('headline') || text.includes('latest')
    };
  }

  const handleManualSend = () => {
    if (textInput.trim()) {
      nova.addBotMessage('user', textInput);
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
          <div className="flex-1 flex flex-col items-center justify-start gap-6 py-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* COMPACT HEADER & STATUS (AT-A-GLANCE) */}
            <div className="w-full max-w-sm flex flex-col gap-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                <div className="flex flex-col gap-4 w-full max-w-xs">
                  <div className="flex flex-col">
                    <h1 className="text-6xl font-black italic tracking-tighter text-white leading-none mb-1 text-glow-cyan">
                      NOVA
                    </h1>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black tracking-[0.3em] text-cyan-400/80 uppercase">Elite v2.5.59-v6.1.1</span>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-400/30 to-transparent" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <StatusBadge label="Tier 2 Readiness" status="online" />
                    <StatusBadge label="L3 Autonomy" status="online" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="glass-card p-4 flex flex-col items-center bg-[#0d1929]/80 border-cyan-400/10 hover:border-cyan-400/30 transition-colors">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.15em] mb-1">Bridge Hub</span>
                      <span className={`text-lg font-black uppercase ${nova.connections?.bridge === 'online' ? 'text-cyan-400 shadow-glow-cyan' : 'text-rose-500'}`}>
                        {nova.connections?.bridge || 'OFFLINE'}
                      </span>
                    </div>
                    <div className="glass-card p-4 flex flex-col items-center bg-[#0d1929]/80 border-purple-400/20 hover:border-purple-400/40 transition-colors">
                      <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.15em] mb-1">Intelligence</span>
                      <span className="text-lg font-black text-purple-400 uppercase tracking-widest shadow-glow-purple">NOVA ELITE</span>
                    </div>
                  </div>
                </div>

                {/* GIANT CENTERED MIC - DRIVING SAFE */}
                <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-sm">
                  <button
                    onClick={toggleListening}
                    className={`relative w-56 h-56 md:w-64 md:h-64 rounded-full flex items-center justify-center transition-all duration-500 overflow-visible ${isListening ? 'bg-cyan-500 shadow-[0_0_100px_rgba(6,182,212,0.6)]' : 'bg-white/[0.03] shadow-inner hover:bg-white/10'}`}
                  >
                    {isThinking ? (
                      <Activity size={80} className="text-cyan-400 animate-spin" />
                    ) : (
                      <>
                        {isListening && (
                          <>
                            <div className="absolute inset-0 rounded-full border-4 border-cyan-400 animate-ping opacity-30" />
                            <div className="absolute inset-[-30px] rounded-full border-2 border-cyan-400/20 animate-pulse" />
                          </>
                        )}
                        <Mic size={80} className={isListening ? 'text-white' : 'text-white/20'} />
                      </>
                    )}
                  </button>
                  <div className="text-sm font-black uppercase tracking-[0.4em] text-white/40 animate-pulse">
                    {isThinking ? 'Thinking...' : (isListening ? 'Listening' : 'Ready')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'features' && (
          <div className="flex-1 flex flex-col gap-6 py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="absolute inset-x-0 top-0 h-96 bg-cyan-500/10 blur-[120px] -z-10 pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white text-glow-cyan">Nova Status Hub</h2>
              <div className="flex items-center gap-2 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                <Brain size={12} className="text-cyan-400" />
                <span className="text-[10px] font-black uppercase text-cyan-400">L3 Autonomy Ready</span>
              </div>
            </div>

            <div className="space-y-8">
              {/* Category: Advanced Intelligence */}
              <div>
                <h3 className="text-xs font-black uppercase text-cyan-400/60 tracking-[0.3em] mb-4">Advanced Intelligence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: "Emotional Intelligence", active: true },
                    { label: "Sentient Reasoning", active: true },
                    { label: "Predictive Assistance", active: false },
                    { label: "Multi-Modal Processing", active: false },
                    { label: "Business Intelligence", active: true }
                  ].map(f => (
                    <div key={f.label} className={`glass-card p-3 flex items-center justify-between border-white/10 ${f.active ? 'bg-white/[0.05]' : 'bg-white/[0.01] opacity-40'}`}>
                      <span className="text-xs font-black uppercase text-white/80">{f.label}</span>
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${f.active ? 'bg-cyan-500 shadow-glow-cyan' : 'bg-transparent border border-white/10'}`}>
                        {f.active ? <Check size={12} className="text-white" strokeWidth={4} /> : <div className="w-1 h-1 bg-white/20 rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category: Technical & Connectivity */}
              <div>
                <h3 className="text-xs font-black uppercase text-purple-400/60 tracking-[0.3em] mb-4">Core Systems & Expansion</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: "Code Generation", active: true },
                    { label: "Task Automation", active: true },
                    { label: "Security Monitoring", active: true },
                    { label: "Schooling Agent", active: true },
                    { label: "Web Scraping", active: true },
                    { label: "Email Integration", active: false },
                    { label: "Calendar Management", active: false },
                    { label: "Multi-Language Support", active: true },
                    { label: "API Integrations", active: false },
                    { label: "Social Media Monitoring", active: false }
                  ].map(f => (
                    <div key={f.label} className={`glass-card p-3 flex items-center justify-between border-white/10 ${f.active ? 'bg-white/[0.05]' : 'bg-white/[0.01] opacity-40'}`}>
                      <span className="text-xs font-black uppercase text-white/80">{f.label}</span>
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${f.active ? 'bg-purple-500 shadow-glow-purple' : 'bg-transparent border border-white/10'}`}>
                        {f.active ? <Check size={12} className="text-white" strokeWidth={4} /> : <div className="w-1 h-1 bg-white/20 rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category: Enterprise & Mobile */}
              <div>
                <h3 className="text-xs font-black uppercase text-emerald-400/60 tracking-[0.3em] mb-4">Enterprise & Mobile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { label: "File Management", active: true },
                    { label: "Backup Automation", active: true },
                    { label: "Multi-User Support", active: false },
                    { label: "Compliance Tools", active: false },
                    { label: "PWA Installation", active: true },
                    { label: "Offline Capabilities", active: false },
                    { label: "Push Notifications", active: false },
                    { label: "Glassmorphism UI", active: true },
                    { label: "System Integration", active: true },
                    { label: "Real-time Monitoring", active: true }
                  ].map(f => (
                    <div key={f.label} className={`glass-card p-3 flex items-center justify-between border-white/10 ${f.active ? 'bg-white/[0.05]' : 'bg-white/[0.01] opacity-40'}`}>
                      <span className="text-xs font-black uppercase text-white/80">{f.label}</span>
                      <div className={`w-5 h-5 rounded flex items-center justify-center ${f.active ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-transparent border border-white/10'}`}>
                        {f.active ? <Check size={12} className="text-white" strokeWidth={4} /> : <div className="w-1 h-1 bg-white/20 rounded-full" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="p-4 animate-in fade-in slide-in-from-left-8 duration-500 h-full flex flex-col">
            <h2 className="text-xl font-black uppercase italic mb-6">Learning Stream</h2>
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 no-scrollbar">
              {(nova.messages as any[]).slice(-20).map(m => (
                <div key={m.id} data-nova-ui className={`glass-card p-4 text-base border-l-2 ${m.from === 'user' ? 'border-pink-500 bg-white/5' : 'border-indigo-500'}`}>
                  <p className="text-white/90 font-medium">{m.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 flex flex-col gap-8 py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto no-scrollbar relative">
            <div className="absolute inset-x-0 bottom-0 h-96 bg-purple-500/10 blur-[120px] -z-10 pointer-events-none" />
            <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-2 text-white text-glow-cyan">System Tuning</h2>

            <div className="glass-card p-6 bg-[#0d1929]/90 border-cyan-400/20 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <Mic size={20} className="text-cyan-400" />
                <h3 className="text-base font-black uppercase tracking-widest text-white">Voice Calibration</h3>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black text-white/90 uppercase">VOLUME</span>
                  <span className="text-2xl font-black text-cyan-400 tracking-tighter">{volume}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="volume-slider h-4"
                />
                <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black text-center italic">Optimal road noise calibration (30% MAX Recommended)</p>
              </div>
            </div>

            <div className="glass-card p-6 bg-[#0d1929]/90 border-purple-400/20 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <Activity size={20} className="text-purple-400" />
                <h3 className="text-base font-black uppercase tracking-widest text-white">Sovereign Info</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-sm font-black text-white/50 uppercase">Core</span>
                  <span className="text-sm font-black text-purple-400 ml-4">{CURRENT_VERSION}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-white/5">
                  <span className="text-sm font-black text-white/50 uppercase">Identity</span>
                  <span className="text-sm font-black text-cyan-400 uppercase tracking-tighter ml-4">Nova Elite</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm font-black text-white/50 uppercase">Storage</span>
                  <span className="text-sm font-black text-emerald-400 flex items-center gap-2 uppercase ml-4"><Check size={16} strokeWidth={4} /> VPS SVRN</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
        <div className="glass-card px-6 py-2 border-white/10 bg-black/40 flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${nova.connections?.swarm === 'online' ? 'bg-cyan-400 shadow-glow-cyan' : 'bg-white/20'}`} />
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">SWRM</span>
          </div>
          <div className="w-[1px] h-4 bg-white/10" />
          <div className="flex flex-col items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${nova.connections?.antigravity === 'online' ? 'bg-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.6)]' : 'bg-white/20'}`} />
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">ANTI</span>
          </div>
          <div className="w-[1px] h-4 bg-white/10" />
          <div className="flex flex-col items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${nova.connections?.windsurf === 'online' ? 'bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.6)]' : 'bg-white/20'}`} />
            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">WNDS</span>
          </div>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#030712]/95 backdrop-blur-3xl border-t border-white/5 flex justify-around items-center z-50">
        {[
          { id: 'home', icon: <Home size={20} />, label: 'Home' },
          { id: 'features', icon: <Shield size={20} />, label: 'Features' },
          { id: 'knowledge', icon: <Database size={20} />, label: 'Data' },
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

      {nova.pendingAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
          <div className="glass-card-heavy p-8 flex flex-col items-center gap-6 max-w-sm w-full">
            <AlertTriangle className="text-amber-500 w-16 h-16" />
            <h2 className="text-xl font-black text-white uppercase">Safety Interlock</h2>
            <div className="flex gap-4 w-full">
              <button onClick={() => nova.handleApproval(false)} className="flex-1 p-4 bg-white/5 rounded-xl text-xs uppercase font-black">Deny</button>
              <button onClick={() => nova.handleApproval(true)} className="flex-1 p-4 bg-amber-600 rounded-xl text-xs uppercase font-black">Allow</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

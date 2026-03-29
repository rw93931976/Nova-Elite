import { useState, useCallback, useRef, useEffect } from 'react';
import { useNova } from './hooks/useNova';
import { useSpeech } from './hooks/useSpeech';
import {
  Home, Shield, Database, Settings as SettingsIcon, Mic,
  AlertTriangle, Send, Check, Brain, Wrench,
  Briefcase, Activity
} from 'lucide-react';

const CURRENT_VERSION = '2.5.59-SOVEREIGN-MIND-v6.0';

function App() {
  const nova = useNova();
  // const { sendMessage, addBotMessage } = nova; // Commented out to fix TS6133

  const [activeTab, setActiveTab] = useState<'home' | 'features' | 'knowledge' | 'settings'>('home');
  const [textInput, setTextInput] = useState('');
  const [volume, setVolume] = useState(30);
  const [isThinking, setIsThinking] = useState(false);
  const [completedFeatures, setCompletedFeatures] = useState<string[]>([
    "Neural Growth Pathing", "Autonomous Goal Setting", "System Integration", "Task Automation", "Emotional Intelligence"
  ]);

  const speakRef = useRef<((text: string, vol?: number) => void) | null>(null);

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
      if (speakRef.current) speakRef.current(thought.response, scaledVolume);
      nova.addBotMessage('nova_core', thought.response);
    }
  }, [nova, volume]);

  const { isListening, toggleListening, speak } = useSpeech(onProcessText);

  useEffect(() => {
    speakRef.current = speak;
    console.info(`%c NOVA ELITE %c ${CURRENT_VERSION} `, 'background: #0f172a; color: #fff; padding: 2px 4px; border-radius: 4px;', 'background: #3b82f6; color: #fff; padding: 2px 4px; border-radius: 4px;');
  }, [speak]);

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
              <div className="flex justify-between items-end px-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-[0.2em] text-white/30 uppercase leading-none mb-1">Elite V{CURRENT_VERSION}</span>
                  <div className="flex items-center gap-2">
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white text-glow-cyan text-blue-400 shadow-glow-blue">T1</h1>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Sovereign Core v6.1</span>
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Tier 1 Readiness</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="glass-card p-4 flex flex-col items-center bg-[#0d1929]/80 border-cyan-400/10">
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.15em] mb-1">Bridge</span>
                  <span className={`text-lg font-black uppercase ${nova.connections?.bridge === 'online' ? 'text-cyan-400 shadow-glow-cyan' : 'text-rose-500'}`}>
                    {nova.connections?.bridge || 'OFFLINE'}
                  </span>
                </div>
                <div className="glass-card p-4 flex flex-col items-center bg-[#0d1929]/80 border-purple-400/20">
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.15em] mb-1">Memory</span>
                  <span className="text-lg font-black text-purple-400 uppercase tracking-widest">SOVEREIGN</span>
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
                      <span className="text-xs font-medium text-white/60">Sovereign Mind</span>
                      <span className={`text-[10px] font-black uppercase tracking-wider \${nova.connections?.bridge === 'online' ? 'text-cyan-400 shadow-glow-cyan' : 'text-rose-500'}`}>
                        {nova.connections?.bridge === 'online' ? 'Active' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-medium text-white/60">Task Memory</span>
                      <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">VPS-Native</span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-medium text-white/60">Global Vision</span>
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Backbone</span>
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
          <div className="flex-1 flex flex-col gap-6 py-4 px-2 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto no-scrollbar relative">
            <div className="absolute inset-x-0 bottom-0 h-64 bg-cyan-500/5 blur-[100px] -z-10 pointer-events-none" />
            <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2 px-1 text-white/90 text-glow-cyan">System Tuning</h2>
            <div className="glass-card p-6 bg-[#0d1929]/80 border-cyan-400/10">
              <div className="flex items-center gap-2 mb-6"><Mic size={14} className="text-cyan-400" /><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Voice Settings</h3></div>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-black uppercase">
                  <span>Voice Volume</span>
                  <span className="text-cyan-400">{volume}%</span>
                </div>
                <input
                  type="range" min="0" max="100" value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-cyan-500"
                />
                <p className="text-[8px] text-white/20 uppercase tracking-widest font-black">Road Noise Calibration (30%=MAX)</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4">
        <div className="flex gap-2 items-center bg-black/40 px-4 py-1.5 rounded-full border border-white/10">
          <div className={`w-1.5 h-1.5 rounded-full ${nova.connections?.swarm === 'online' ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-white/20'}`} />
          <div className={`w-1.5 h-1.5 rounded-full ${nova.connections?.antigravity === 'online' ? 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]' : 'bg-white/20'}`} />
          <div className={`w-1.5 h-1.5 rounded-full ${nova.connections?.windsurf === 'online' ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-white/20'}`} />
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

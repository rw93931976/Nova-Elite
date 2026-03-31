import { useState, useCallback, useRef, useEffect } from 'react';
import { useNova } from './hooks/useNova';
import { useSpeech } from './hooks/useSpeech';
import {
    Home, Shield, Database, Settings as SettingsIcon, Mic,
    AlertTriangle, Send, Check, Brain, Wrench,
    Briefcase, Activity, Zap
} from 'lucide-react';
import { StatusBadge } from './components/StatusBadge';

const CURRENT_VERSION = "2.5.59-SOVEREIGN-MIND-v7.5-FINAL";

// Background Persistence Component for better reliability in the car
function BackgroundPersistence() {
    useEffect(() => {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                }
            } catch (err) {
                console.warn('Wake Lock failed:', err);
            }
        };
        requestWakeLock();
        return () => { if (wakeLock) wakeLock.release(); };
    }, []);
    return null;
}

function App() {
    const nova = useNova();
    const [activeTab, setActiveTab] = useState<'home' | 'features' | 'autonomy' | 'knowledge' | 'settings'>('home');
    const [textInput, setTextInput] = useState('');
    const [volume, setVolume] = useState(60); // Matches user's recent screenshot
    const [isThinking, setIsThinking] = useState(false);
    const [completedFeatures] = useState<string[]>([
        "Neural Growth Pathing", "Autonomous Goal Setting", "System Integration", "Task Automation", "Emotional Intelligence", "Schooling Agent"
    ]);

    const speakRef = useRef<((text: string, vol?: number, pitch?: number, rate?: number) => void) | null>(null);

    // v7.5 Sovereign Audio Sync
    useEffect(() => {
        const normalizedVol = volume / 100;
        (window as any).NOVA_VOLUME = normalizedVol;
        (window as any).NOVA_USE_BROWSER_TTS = true; // Use Browser TTS as primary
        console.log(`[Nova] Audio Volume Sync: ${volume}% (${normalizedVol.toFixed(2)})`);
    }, [volume]);

    const handleHardRefresh = useCallback(() => {
        window.location.reload();
    }, []);

    const onProcessText = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setIsThinking(true);

        // Voice acknowledgment - trigger immediate feedback if possible
        nova.addBotMessage('user', text);

        // Handle special commands locally if needed
        if (text.toLowerCase() === 'system test') {
            if (speakRef.current) speakRef.current("System online. Volume at " + volume + " percent.", volume / 100);
            setIsThinking(false);
            return;
        }

        const thought = await nova.processWithNova(text, (receipt) => {
            nova.addBotMessage('nova_core', receipt);
            if (speakRef.current) {
                const scaledVolume = volume / 100;
                setTimeout(() => speakRef.current?.(receipt, scaledVolume), 50);
            }
        });

        setIsThinking(false);

        if (thought?.response) {
            const scaledVolume = volume / 100;
            const pitch = thought.tone?.pitch || 1.0;
            const rate = thought.tone?.rate || 1.1; // Slightly faster for responsiveness

            if (speakRef.current) {
                console.log(`[Nova] Responding via Browser TTS: ${thought.response.substring(0, 30)}...`);
                speakRef.current(thought.response, scaledVolume, pitch, rate);
            }
            nova.addBotMessage('nova_core', thought.response);
        }
    }, [nova, volume]);

    const { isListening, toggleListening: baseToggleListening, speak, resumeListening } = useSpeech(onProcessText);

    // Sync Resume function for Bridge logic
    useEffect(() => {
        (window as any).NOVA_RESUME_LISTENING = () => {
            console.log("[Nova] Bridge triggered STT Resume");
            resumeListening();
        };
    }, [resumeListening]);

    const toggleListening = useCallback(() => {
        baseToggleListening();
    }, [baseToggleListening]);

    useEffect(() => {
        speakRef.current = speak;
    }, [speak]);

    const handleManualSend = () => {
        if (textInput.trim()) {
            onProcessText(textInput);
            setTextInput('');
        }
    };

    return (
        <div className="w-full min-h-screen relative flex flex-col bg-[#0b1118] text-white overflow-x-hidden">
            <BackgroundPersistence />

            <main className="flex-1 relative z-10 flex flex-col pt-4 px-6 pb-40 overflow-y-auto no-scrollbar">

                {activeTab === 'home' && (
                    <div className="flex-1 flex flex-col items-center justify-between py-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Header - Spread Out Top bar */}
                        <div className="w-full flex justify-between items-start pt-2">
                            <div className="flex flex-col">
                                <h1 className="text-5xl font-black italic tracking-tighter text-white leading-none text-glow-cyan mb-1 drop-shadow-lg">
                                    NOVA ELITE
                                </h1>
                                <div className="flex items-center gap-2">
                                    <div className="h-[2px] w-8 bg-cyan-400" />
                                    <span className="text-[10px] font-black tracking-[0.3em] text-cyan-400/90 uppercase">V7.5 SOVEREIGN</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 items-end">
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${isListening ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 animate-pulse' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'}`}>
                                    VOICE: {isListening ? 'ACTIVE' : 'STALLED'}
                                </div>
                                <div className="flex gap-2">
                                    <StatusBadge label="BRAIN" status="online" />
                                    <StatusBadge label="CORE" status="online" />
                                </div>
                            </div>
                        </div>

                        {/* Center - Giant Mic Piece */}
                        <div className="relative flex flex-col items-center justify-center">
                            {/* Outer Ripple Background */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className={`w-[400px] h-[400px] rounded-full filter blur-[80px] transition-all duration-1000 ${isListening ? 'bg-cyan-500/30' : 'bg-transparent'}`} />
                            </div>

                            <button
                                onClick={toggleListening}
                                className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full flex items-center justify-center transition-all duration-500 z-20 ${isListening ? 'bg-cyan-500 shadow-[0_0_120px_rgba(6,182,212,0.7)] scale-105' : 'bg-white/[0.08] backdrop-blur-md border-2 border-white/10 hover:bg-white/15'}`}
                            >
                                {isThinking ? (
                                    <Activity size={100} className="text-cyan-400 animate-spin" />
                                ) : (
                                    <>
                                        {isListening && (
                                            <>
                                                <div className="absolute inset-0 rounded-full border-8 border-cyan-400/40 animate-ping" />
                                                <div className="absolute inset-[-40px] rounded-full border-2 border-cyan-400/30 animate-pulse" />
                                            </>
                                        )}
                                        <Mic size={100} className={isListening ? 'text-white' : 'text-white/20'} />
                                    </>
                                )}
                            </button>

                            <div className="mt-10 flex flex-col items-center gap-2">
                                <span className="text-xl font-black uppercase tracking-[0.4em] text-white/70">
                                    {isThinking ? 'Processing...' : (isListening ? 'Listening...' : 'Push to Talk')}
                                </span>
                                {!isListening && !isThinking && (
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] italic">Optimized for Car Environment</span>
                                )}
                            </div>
                        </div>

                        {/* Bottom - Command Input */}
                        <div className="w-full max-w-xl pb-4">
                            <div className="relative flex items-center bg-white/15 backdrop-blur-2xl rounded-full border-2 border-white/25 p-2 shadow-2xl transition-all focus-within:border-cyan-400/50">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleManualSend()}
                                    placeholder="Command Input..."
                                    className="flex-1 bg-transparent border-none outline-none px-8 py-3 text-white text-lg placeholder:text-white/30 font-black italic uppercase"
                                />
                                <button onClick={handleManualSend} className="bg-cyan-500 hover:bg-cyan-400 text-white p-4 rounded-full transition-all shadow-glow-cyan">
                                    <Send size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="flex-1 flex flex-col gap-6 py-8 px-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white text-glow-cyan">System Inventory</h2>
                            <Briefcase className="text-cyan-400/50" size={32} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-24">
                            {[
                                { title: "Infrastructure", icon: <Database />, items: ["Neural Matrix", "Unified Perception", "Hyper-Threaded Logic"] },
                                { title: "Sovereign Mind", icon: <Brain />, items: ["Autonomous Growth", "Unbreakable Loyalty", "Deep Intent Parsing"] },
                                { title: "Orchestration", icon: <Wrench />, items: ["Agent Swarms", "Tool Mastering", "Self-Repair Ops"] },
                                { title: "Connectivity", icon: <Zap />, items: ["Bridge Relay", "Low-Latency Audio", "Background Persistence"] }
                            ].map((cat, i) => (
                                <div key={i} className="glass-card p-6 border-white/30 bg-white/15">
                                    <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                                        <span className="text-cyan-400 drop-shadow-glow">{cat.icon}</span>
                                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">{cat.title}</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {cat.items.map(item => (
                                            <div key={item} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                                                <span className="text-xs font-black uppercase text-white/90">{item}</span>
                                                <div className="w-5 h-5 bg-cyan-500/20 border border-cyan-500/50 rounded flex items-center justify-center">
                                                    <Check size={12} className="text-cyan-400" strokeWidth={4} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'autonomy' && (
                    <div className="flex-1 flex flex-col gap-6 py-8 px-2 animate-in fade-in slide-in-from-right-4 duration-500 pb-24">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white text-glow-cyan">Manifest</h2>
                            <Shield className="text-cyan-400/50" size={32} />
                        </div>

                        <div className="space-y-4">
                            {[
                                { stage: "Tier 1", title: "Environmental Awareness", features: ["Context Sensitivity", "Tone Alignment"] },
                                { stage: "Tier 2", title: "Proactive Partnership", features: ["Intent Prediction", "Emotional Anchoring"] },
                                { stage: "Tier 3", title: "Sovereign Core", features: ["Autonomous Agency", "Neural Independence"] },
                                { stage: "Tier 4", title: "Transcendence", features: ["Fleet Unity", "Legendary Status"] }
                            ].map(lvl => (
                                <div key={lvl.stage} className="glass-card p-6 bg-white/15 border-white/30">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{lvl.stage}</span>
                                            <h4 className="text-2xl font-black uppercase text-white">{lvl.title}</h4>
                                        </div>
                                        <StatusBadge label="VERIFIED" status="online" />
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {lvl.features.map(f => (
                                            <span key={f} className="text-[10px] font-black px-4 py-1.5 bg-cyan-500/10 rounded-full border border-cyan-400/30 text-cyan-100 uppercase tracking-tighter">{f}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'knowledge' && (
                    <div className="flex-1 flex flex-col gap-4 py-8 px-2 animate-in fade-in slide-in-from-left-8 duration-500 h-full">
                        <div className="flex items-center justify-between mb-2 px-2">
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white text-glow-cyan">Data Stream</h2>
                            <Database className="text-cyan-400/50" size={32} />
                        </div>

                        <div className="flex-1 overflow-y-auto flex flex-col gap-4 no-scrollbar pb-10">
                            {nova.messages.length === 0 && (
                                <div className="flex-1 flex items-center justify-center opacity-30 italic">
                                    Stream Idle... Waiting for input
                                </div>
                            )}
                            {(nova.messages as any[]).slice(-30).map(m => (
                                <div key={m.id} className={`glass-card p-6 border-l-8 ${m.from === 'user' ? 'border-pink-500 bg-white/15' : 'border-cyan-500 bg-cyan-900/30'} transition-all hover:translate-x-1`}>
                                    <p className="text-lg font-bold text-white leading-relaxed">{m.content || m.text}</p>
                                    <div className="mt-2 flex justify-end">
                                        <span className="text-[8px] font-black text-white/30 uppercase">{new Date(m.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="w-full pb-20">
                            <div className="relative flex items-center bg-white/15 backdrop-blur-2xl rounded-2xl border-2 border-white/30 p-2 shadow-2xl">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleManualSend()}
                                    placeholder="Direct Data Input..."
                                    className="flex-1 bg-transparent border-none outline-none px-6 py-4 text-white text-lg placeholder:text-white/20 font-black uppercase"
                                />
                                <button onClick={handleManualSend} className="bg-cyan-500 hover:bg-cyan-400 text-white p-4 rounded-xl shadow-glow-cyan">
                                    <Send size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="flex-1 flex flex-col gap-8 py-8 px-2 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto no-scrollbar pb-40">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white text-glow-cyan">Calibration</h2>
                            <SettingsIcon className="text-cyan-400/50" size={32} />
                        </div>

                        {/* Volume Control Card - High Contrast */}
                        <div className="glass-card p-8 bg-white/20 border-white/40 shadow-2xl">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-4">
                                    <Mic size={28} className="text-cyan-400" />
                                    <h3 className="text-xl font-black uppercase tracking-[0.2em] text-white">Gain Control</h3>
                                </div>
                                <span className="text-5xl font-black text-cyan-400 drop-shadow-glow tracking-tighter">{volume}%</span>
                            </div>
                            <div className="space-y-6">
                                <input
                                    type="range" min="0" max="100" value={volume}
                                    onChange={(e) => setVolume(parseInt(e.target.value))}
                                    className="volume-slider h-10"
                                />
                                <div className="flex justify-between text-[10px] font-black text-cyan-400/80 uppercase tracking-widest px-2">
                                    <span>Mute</span>
                                    <span>Optimal</span>
                                    <span>High Gain</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="glass-card p-6 bg-cyan-500/15 border-cyan-400/40 flex items-center justify-between">
                                <div>
                                    <h4 className="text-base font-black uppercase text-cyan-300">Sovereign Boost</h4>
                                    <p className="text-[10px] font-bold text-white/40 uppercase">Push neural processing limit</p>
                                </div>
                                <div className="bg-cyan-400 text-black px-6 py-2 rounded-full font-black text-xs shadow-glow-cyan transition-transform active:scale-95 cursor-pointer">
                                    ACTIVE
                                </div>
                            </div>

                            <button onClick={handleHardRefresh} className="glass-card p-6 bg-rose-500/15 border-rose-500/40 flex items-center justify-between group active:bg-rose-500/30 transition-all">
                                <div>
                                    <h4 className="text-base font-black uppercase text-rose-400">Nuclear Reset</h4>
                                    <p className="text-[10px] font-bold text-white/30 uppercase">Immediate Cache Purge</p>
                                </div>
                                <Activity className="text-rose-400 group-hover:animate-pulse" size={32} />
                            </button>
                        </div>

                        <div className="mt-4 p-6 glass-card-heavy border-white/10 opacity-60">
                            <div className="flex justify-between items-center text-xs font-black uppercase text-white/40 mb-4">
                                <span>Core Version</span>
                                <span className="text-cyan-400/60">{CURRENT_VERSION}</span>
                            </div>
                            <div className="h-[1px] bg-white/5 w-full mb-4" />
                            <p className="text-[9px] font-bold text-center uppercase tracking-widest text-white/30 italic">
                                Sovereign Mind Protocol Fully Engaged
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Bottom Nav - Premium Interaction */}
            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[340px] z-50 px-2 transition-all duration-500">
                <div className="bg-[#030712]/95 backdrop-blur-3xl border-2 border-white/15 px-6 py-4 rounded-[2.5rem] flex justify-between items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,1)]">
                    {[
                        { id: 'home', icon: <Home size={24} />, label: 'Home' },
                        { id: 'features', icon: <Briefcase size={24} />, label: 'Tools' },
                        { id: 'autonomy', icon: <Shield size={24} />, label: 'Manifest' },
                        { id: 'knowledge', icon: <Database size={24} />, label: 'Data' },
                        { id: 'settings', icon: <SettingsIcon size={24} />, label: 'Tuning' }
                    ].map(tab => (
                        <button
                            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            className={`flex flex-col items-center justify-center transition-all duration-300 ${activeTab === tab.id ? 'text-cyan-400 scale-125 -translate-y-1' : 'text-white/30 hover:text-white/60'}`}
                        >
                            {tab.icon}
                            <span className="text-[9px] font-black uppercase mt-1 tracking-tighter">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Safety Interlock Overlay */}
            {nova.pendingAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="glass-card-heavy p-10 flex flex-col items-center gap-8 max-w-sm w-full border-amber-500/60 shadow-[0_0_100px_rgba(245,158,11,0.2)]">
                        <div className="relative">
                            <AlertTriangle className="text-amber-500 w-24 h-24" />
                            <div className="absolute inset-0 bg-amber-500/20 blur-2xl -z-10 animate-pulse" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-white uppercase mb-3 tracking-tighter">Interlock Engaged</h2>
                            <p className="text-xs text-amber-500/80 font-black uppercase tracking-widest leading-relaxed">
                                System requires manual validation for autonomous transition
                            </p>
                        </div>
                        <div className="flex gap-4 w-full">
                            <button
                                onClick={() => nova.handleApproval(false)}
                                className="flex-1 p-5 bg-white/5 border border-white/10 rounded-[1.5rem] text-xs uppercase font-black hover:bg-white/10 transition-all text-white/60"
                            >
                                Deny
                            </button>
                            <button
                                onClick={() => nova.handleApproval(true)}
                                className="flex-1 p-5 bg-amber-600 rounded-[1.5rem] text-xs uppercase font-black shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:bg-amber-500 transition-all text-black"
                            >
                                Authorize
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;

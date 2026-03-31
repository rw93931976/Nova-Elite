import { useState, useCallback, useRef, useEffect } from 'react';
import { useNova } from './hooks/useNova';
import { useSpeech } from './hooks/useSpeech';
import {
    Home, Shield, Database, Settings as SettingsIcon, Mic,
    AlertTriangle, Send, Check, Brain, Wrench,
    Briefcase, Activity, Zap
} from 'lucide-react';
import { StatusBadge } from './components/StatusBadge';

const CURRENT_VERSION = "2.5.60-SOVEREIGN-BRIGHT-v7.6";

function BackgroundPersistence() {
    useEffect(() => {
        let wakeLock: any = null;
        const requestWakeLock = async () => {
            try {
                if ('wakeLock' in navigator) wakeLock = await (navigator as any).wakeLock.request('screen');
            } catch (err) { }
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
    const [volume, setVolume] = useState(70); // Bumped default for better audibility
    const [isThinking, setIsThinking] = useState(false);

    const speakRef = useRef<((text: string, vol?: number, pitch?: number, rate?: number) => void) | null>(null);

    // v7.6 BRIGHT Audio Sync
    useEffect(() => {
        const normalizedVol = volume / 100;
        (window as any).NOVA_VOLUME = normalizedVol;
        (window as any).NOVA_USE_BROWSER_TTS = true;
        console.log(`[Nova] Audio Volume Sync: ${volume}%`);
    }, [volume]);

    const handleHardRefresh = useCallback(() => {
        window.location.reload();
    }, []);

    const onProcessText = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setIsThinking(true);

        // UI: Add User Message
        nova.addBotMessage('user', text);

        // 🚀 NO RECEIPT LOGGING: We speak the receipt but DO NOT add it to the message log (removes underscores)
        const thought = await nova.processWithNova(text, (receipt) => {
            if (speakRef.current) {
                const scaledVolume = volume / 100;
                // Optional: Speak a short "Working..." or the receipt
                setTimeout(() => speakRef.current?.("Acknowledged.", scaledVolume), 10);
            }
        });

        setIsThinking(false);

        if (thought?.response) {
            const scaledVolume = volume / 100;
            const pitch = thought.tone?.pitch || 1.0;
            const rate = thought.tone?.rate || 1.1;

            if (speakRef.current) {
                speakRef.current(thought.response, scaledVolume, pitch, rate);
            }
            nova.addBotMessage('nova_core', thought.response);
        }
    }, [nova, volume]);

    const { isListening, toggleListening: baseToggleListening, speak, resumeListening } = useSpeech(onProcessText);

    useEffect(() => {
        (window as any).NOVA_RESUME_LISTENING = () => resumeListening();
        speakRef.current = speak;
    }, [speak, resumeListening]);

    const toggleListening = useCallback(() => baseToggleListening(), [baseToggleListening]);

    const handleManualSend = () => {
        if (textInput.trim()) {
            onProcessText(textInput);
            setTextInput('');
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#0b0f1a] text-white overflow-y-auto pb-40">
            <BackgroundPersistence />

            <main className="max-w-4xl mx-auto px-6 pt-10">

                {activeTab === 'home' && (
                    <div className="flex flex-col items-center gap-16 py-8">
                        {/* Header */}
                        <div className="w-full flex justify-between items-start">
                            <div className="flex flex-col">
                                <h1 className="text-6xl font-black italic tracking-tighter text-white leading-none text-glow-cyan drop-shadow-xl">
                                    NOVA ELITE
                                </h1>
                                <span className="text-sm font-black tracking-[0.4em] text-cyan-400 uppercase mt-2">SOVEREIGN BRIGHT v7.6</span>
                            </div>
                            <div className="flex flex-col gap-4 items-end">
                                <div className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border-4 transition-all ${isListening ? 'bg-cyan-500 text-black border-white animate-pulse' : 'bg-rose-500/20 border-rose-500 text-rose-500'}`}>
                                    EARS: {isListening ? 'LIVE' : 'AUTO'}
                                </div>
                                <div className="flex gap-2">
                                    <StatusBadge label="BRAIN" status="online" />
                                </div>
                            </div>
                        </div>

                        {/* Mic Section */}
                        <div className="relative group">
                            <div className={`absolute inset-[-60px] rounded-full blur-3xl transition-opacity duration-1000 ${isListening ? 'bg-cyan-500/40 opacity-100' : 'bg-transparent opacity-0'}`} />
                            <button
                                onClick={toggleListening}
                                className={`relative w-72 h-72 md:w-96 md:h-96 rounded-full flex items-center justify-center transition-all duration-500 z-10 border-[10px] ${isListening ? 'bg-cyan-500 scale-105 border-white shadow-[0_0_100px_rgba(6,182,212,0.8)]' : 'bg-white/10 border-white/20 hover:bg-white/20'}`}
                            >
                                {isThinking ? (
                                    <Activity size={120} className="text-cyan-400 animate-spin" />
                                ) : (
                                    <Mic size={140} className={isListening ? 'text-black' : 'text-white/40'} />
                                )}
                            </button>
                        </div>

                        {/* Input Overlay */}
                        <div className="w-full max-w-2xl mt-8">
                            <div className="flex items-center bg-white rounded-[3rem] p-3 shadow-2xl border-8 border-cyan-500">
                                <input
                                    type="text"
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleManualSend()}
                                    placeholder="COMMAND INPUT..."
                                    className="flex-1 bg-transparent border-none outline-none px-8 py-4 text-2xl text-black placeholder:text-gray-400 font-black italic uppercase"
                                />
                                <button onClick={handleManualSend} className="bg-cyan-500 hover:bg-cyan-400 text-black p-5 rounded-full shadow-xl transition-all active:scale-90">
                                    <Send size={32} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="flex flex-col gap-8 pb-24">
                        <h2 className="text-5xl font-black italic uppercase tracking-tighter text-glow-cyan text-center">System Tools</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: "Infrastructure", icon: <Database />, items: ["Neural Growth", "Global Perception", "Unmatched Proxy"] },
                                { title: "Core Logic", icon: <Brain />, items: ["Deep Intent", "Emotional Resonance", "Auto-Heal"] },
                                { title: "Connectivity", icon: <Zap />, items: ["Low-Latency", "Bridge Stabilization", "V7.6 Sync"] },
                                { title: "Sovereignty", icon: <Shield />, items: ["Absolute Autonomy", "Compliance Guard", "Legendary Node"] }
                            ].map((cat, i) => (
                                <div key={i} className="bright-card flex flex-col gap-6">
                                    <div className="flex items-center gap-4 border-b-4 border-cyan-500 pb-4">
                                        <span className="text-cyan-600">{cat.icon}</span>
                                        <h3 className="text-xl uppercase tracking-tighter">{cat.title}</h3>
                                    </div>
                                    <div className="space-y-4">
                                        {cat.items.map(item => (
                                            <div key={item} className="flex justify-between items-center bg-gray-100 p-4 rounded-2xl border-2 border-gray-200">
                                                <span className="text-sm font-black uppercase">{item}</span>
                                                <Check size={20} className="text-cyan-600" strokeWidth={4} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'knowledge' && (
                    <div className="flex flex-col gap-6 pb-24">
                        <h2 className="text-5xl font-black italic uppercase text-glow-cyan text-center">Data Stream</h2>
                        <div className="flex flex-col gap-6">
                            {(nova.messages as any[]).slice(-20).map(m => (
                                <div key={m.id} className={`bright-card border-l-[16px] ${m.from === 'user' ? 'border-l-pink-500' : 'border-l-cyan-600'}`}>
                                    <p className="text-2xl font-bold leading-tight">{m.content || m.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10">
                            <div className="flex items-center bg-white rounded-3xl p-3 shadow-2xl border-8 border-cyan-500">
                                <input
                                    type="text" value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleManualSend()}
                                    placeholder="TYPE MESSAGE..."
                                    className="flex-1 bg-transparent px-6 py-4 text-xl text-black font-black uppercase"
                                />
                                <button onClick={handleManualSend} className="bg-cyan-500 p-5 rounded-2xl text-black transform active:scale-95 transition-all">
                                    <Send size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="flex flex-col gap-10 pb-24">
                        <h2 className="text-5xl font-black italic uppercase text-glow-cyan text-center">Tuning</h2>
                        <div className="bright-card space-y-12 py-12">
                            <div className="flex justify-between items-end">
                                <h3 className="text-2xl uppercase tracking-widest">Master Gain</h3>
                                <span className="text-8xl font-black text-cyan-600">{volume}%</span>
                            </div>
                            <input
                                type="range" min="0" max="100" value={volume}
                                onChange={(e) => setVolume(parseInt(e.target.value))}
                                className="volume-slider"
                            />
                            <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-400">
                                <span>Mute</span>
                                <span>Optimal</span>
                                <span>Max Gain</span>
                            </div>
                        </div>

                        <button onClick={handleHardRefresh} className="cyan-card flex items-center justify-between group active:translate-y-2 transition-all">
                            <div>
                                <h4 className="text-3xl font-black uppercase text-white">Nuclear Reset</h4>
                                <p className="text-sm font-bold text-white/70 uppercase">Wipe System Memory</p>
                            </div>
                            <Activity size={48} className="text-white group-hover:animate-spin" />
                        </button>
                    </div>
                )}

            </main>

            {/* High-Contrast Floating Nav */}
            <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm px-6">
                <div className="bg-white border-8 border-cyan-500 rounded-[3rem] px-8 py-6 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                    {[
                        { id: 'home', icon: <Home size={32} />, label: 'Home' },
                        { id: 'features', icon: <Briefcase size={32} />, label: 'Tools' },
                        { id: 'knowledge', icon: <Database size={32} />, label: 'Data' },
                        { id: 'settings', icon: <SettingsIcon size={32} />, label: 'Tuning' }
                    ].map(tab => (
                        <button
                            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-cyan-600 scale-125' : 'text-gray-300 hover:text-gray-500'}`}
                        >
                            {tab.icon}
                            <span className="text-[10px] font-black uppercase mt-1">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Safety Overlays */}
            {nova.pendingAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/90 backdrop-blur-3xl animate-in fade-in duration-300">
                    <div className="bright-card max-w-md w-full flex flex-col items-center gap-10 border-amber-500 border-[12px] p-12">
                        <AlertTriangle className="text-amber-600 w-32 h-32 animate-bounce" />
                        <div className="text-center">
                            <h2 className="text-4xl font-black text-black uppercase mb-4">Interlock</h2>
                            <p className="text-sm font-bold uppercase tracking-widest text-gray-600">Manual Authorization Required</p>
                        </div>
                        <div className="flex gap-4 w-full">
                            <button onClick={() => nova.handleApproval(false)} className="flex-1 p-6 bg-gray-200 rounded-3xl text-xs uppercase font-black">Deny</button>
                            <button onClick={() => nova.handleApproval(true)} className="flex-1 p-6 bg-amber-500 rounded-3xl text-sm uppercase font-black text-white shadow-xl">Authorize</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;

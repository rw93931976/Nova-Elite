import { useState, useCallback, useRef, useEffect } from 'react';
import { useNova } from './hooks/useNova';
import { useSpeech } from './hooks/useSpeech';
import {
    Home, Shield, Database, Settings as SettingsIcon, Mic,
    AlertTriangle, Send, Check, Brain, Wrench,
    Briefcase, Activity, Zap, Info, User
} from 'lucide-react';
import { StatusBadge } from './components/StatusBadge';

const CURRENT_VERSION = "2.5.77-SOVEREIGN-BRIGHT";

function App() {
    const nova = useNova();
    const [activeTab, setActiveTab] = useState<'home' | 'tools' | 'data' | 'tuning' | 'about'>('home');
    const [textInput, setTextInput] = useState('');
    const [volume, setVolume] = useState(75);
    const [isThinking, setIsThinking] = useState(false);

    const speakRef = useRef<((text: string, vol?: number, pitch?: number, rate?: number) => void) | null>(null);

    // v7.7 SOVEREIGN Audio Sync
    useEffect(() => {
        (window as any).NOVA_VOLUME = volume / 100;
        (window as any).NOVA_USE_BROWSER_TTS = true;
    }, [volume]);

    const onProcessText = useCallback(async (text: string) => {
        if (!text.trim()) return;
        setIsThinking(true);
        nova.addBotMessage('user', text);

        const thought = await nova.processWithNova(text, (receipt) => {
            // Voice-only acknowledgment (silent in chat)
            if (speakRef.current) speakRef.current("...", volume / 100);
        });

        setIsThinking(false);

        if (thought?.response) {
            if (speakRef.current) {
                speakRef.current(thought.response, volume / 100, thought.tone?.pitch || 1.1, thought.tone?.rate || 1.05);
            }
            nova.addBotMessage('nova_core', thought.response);
        }
    }, [nova, volume]);

    const { isListening, toggleListening, speak, resumeListening } = useSpeech(onProcessText);

    useEffect(() => {
        (window as any).NOVA_RESUME_LISTENING = () => resumeListening();
        speakRef.current = speak;
    }, [speak, resumeListening]);

    return (
        <div className="w-full min-h-screen bg-[#0b0f1a] text-white overflow-y-auto no-scrollbar pb-32">

            {/* HEADER: Ultra Minimalist High-Contrast */}
            <header className="fixed top-0 left-0 w-full z-[100] px-6 py-8 bg-gradient-to-b from-[#0b0f1a] to-transparent">
                <div className="flex justify-between items-center max-w-lg mx-auto">
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black italic tracking-tighter text-white drop-shadow-lg text-glow">
                            NOVA ELITE
                        </h1>
                        <span className="text-[9px] font-black tracking-[0.4em] text-cyan-400 mt-1 uppercase">v7.7 Sovereign</span>
                    </div>
                    <StatusBadge label="BRAIN" status={isThinking ? 'connecting' : 'online'} />
                </div>
            </header>

            <main className="main-content px-6 pt-32">

                {activeTab === 'home' && (
                    <div className="flex flex-col items-center gap-10">
                        {/* The Mic Interaction - Circle Restore */}
                        <div className="mt-10 flex flex-col items-center gap-8">
                            <button
                                onClick={() => toggleListening()}
                                className={`mic-button ${isListening ? 'active' : ''}`}
                            >
                                {isThinking ? (
                                    <Activity size={60} className="text-cyan-400 animate-spin-slow" />
                                ) : (
                                    <Mic size={80} className={isListening ? 'text-black' : 'text-white/30'} />
                                )}
                            </button>
                            <div className="flex flex-col items-center gap-1">
                                <p className={`text-xs font-black uppercase tracking-widest ${isListening ? 'text-cyan-400 animate-pulse' : 'text-white/20'}`}>
                                    {isListening ? 'Nova is Listening...' : 'Tap Mic to Command'}
                                </p>
                            </div>
                        </div>

                        {/* Main Command Input */}
                        <div className="w-full max-w-sm mt-4">
                            <div className="flex items-center bg-white rounded-full p-2 border-4 border-cyan-500 shadow-2xl">
                                <input
                                    type="text" value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (onProcessText(textInput), setTextInput(''))}
                                    placeholder="COMMAND INPUT..."
                                    className="flex-1 bg-transparent px-6 py-3 text-lg text-black font-black uppercase placeholder:text-gray-300 outline-none"
                                />
                                <button
                                    onClick={() => (onProcessText(textInput), setTextInput(''))}
                                    className="bg-cyan-500 p-4 rounded-full text-black hover:bg-cyan-400 active:scale-90 transition-all"
                                >
                                    <Send size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Context Cards (Mobile Home) */}
                        <div className="w-full space-y-4 mt-4">
                            <div className="bright-card flex items-center gap-4">
                                <div className="p-3 bg-cyan-100 rounded-2xl text-cyan-600"><AlertTriangle size={24} /></div>
                                <div>
                                    <h3>Security Status</h3>
                                    <p>Sovereign encryption active. Node stabilized at 99.9%.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tools' && (
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black italic text-center mb-6 uppercase tracking-tighter">System Tools</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { t: "Logic Pathing", i: <Brain /> },
                                { t: "Data Crawling", i: <Database /> },
                                { t: "Sync Control", i: <Zap /> },
                                { t: "Encryption", i: <Shield /> }
                            ].map(tool => (
                                <div key={tool.t} className="bright-card flex items-center gap-4 border-l-[12px] border-l-cyan-500">
                                    <div className="text-cyan-600">{tool.i}</div>
                                    <span className="font-black uppercase tracking-tighter">{tool.t}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'data' && (
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black italic text-center mb-6 uppercase tracking-tighter text-glow">Data Stream</h2>
                        <div className="flex flex-col gap-4">
                            {(nova.messages as any[]).slice(-10).map(m => (
                                <div key={m.id} className={`bright-card ${m.from === 'user' ? 'border-pink-500' : 'border-cyan-500'}`}>
                                    <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">{m.from === 'user' ? 'USER' : 'NOVA'}</span>
                                    <p className="text-lg leading-tight">{m.content || m.text}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 flex items-center bg-white rounded-2xl p-2 border-4 border-cyan-500">
                            <input
                                type="text" value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                className="flex-1 bg-transparent px-4 py-2 text-black font-bold uppercase outline-none"
                            />
                            <button onClick={() => (onProcessText(textInput), setTextInput(''))} className="bg-cyan-500 px-4 py-2 rounded-xl text-black"><Send size={20} /></button>
                        </div>
                    </div>
                )}

                {activeTab === 'tuning' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black italic text-center mb-6 uppercase tracking-tighter">System Tuning</h2>
                        <div className="bright-card flex flex-col items-center gap-8 py-10">
                            <span className="text-7xl font-black text-cyan-600">{volume}%</span>
                            <input
                                type="range" min="0" max="100" value={volume}
                                onChange={(e) => setVolume(parseInt(e.target.value))}
                                className="w-full accent-cyan-500 h-4 rounded-full"
                            />
                            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Master Gain Adjustment</p>
                        </div>
                        <button
                            onClick={handleHardRefresh}
                            className="w-full bg-rose-600 p-6 rounded-[2rem] flex justify-between items-center border-4 border-white shadow-xl active:translate-y-1 transition-all"
                        >
                            <div className="text-left">
                                <h4 className="font-black uppercase text-xl">Core Reset</h4>
                                <p className="text-xs font-bold text-white/60 uppercase">Manual State Purge</p>
                            </div>
                            <AlertTriangle size={32} />
                        </button>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-black italic text-center mb-6 uppercase tracking-tighter">About Nova</h2>
                        <div className="bright-card">
                            <h3>Sovereign Elite v7.7</h3>
                            <p>The first fully autonomous AI partner designed for seamless high-performance environments.</p>
                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between text-xs font-bold uppercase text-gray-500 border-b pb-2"><span>Kernel</span><span>v7.7.2</span></div>
                                <div className="flex justify-between text-xs font-bold uppercase text-gray-500 border-b pb-2"><span>Neural Load</span><span>Optimal</span></div>
                                <div className="flex justify-between text-xs font-bold uppercase text-gray-500"><span>Architecture</span><span>Sovereign Bridge</span></div>
                            </div>
                        </div>
                        <div className="bright-card border-l-[12px] border-l-pink-500">
                            <h3>Credits</h3>
                            <p>Built for the Elite. Powered by the Sovereign Mind.</p>
                        </div>
                    </div>
                )}

            </main>

            {/* FIXED FOOTER NAV: Standard Mobile Reach */}
            <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[200]">
                <div className="nav-bar flex justify-around items-center h-20">
                    {[
                        { id: 'home', i: <Home />, l: 'Home' },
                        { id: 'tools', i: <Wrench />, l: 'Tools' },
                        { id: 'data', i: <Database />, l: 'Stream' },
                        { id: 'tuning', i: <SettingsIcon />, l: 'Tune' },
                        { id: 'about', i: <Info />, l: 'About' }
                    ].map(tab => (
                        <button
                            key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            {tab.i}
                            <span>{tab.l}</span>
                        </button>
                    ))}
                </div>
            </footer>
        </div>
    );
}

export default App;

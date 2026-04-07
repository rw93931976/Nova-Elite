import { useState, useEffect, useRef, useCallback } from "react";
import {
    Mic,
    MessageSquare,
    Settings,
    Shield,
    Home,
    Trash2,
    CheckCircle2,
    Database,
    Brain,
    Activity
} from "lucide-react";
import { useNova } from "./hooks/useNova";
import { useLiveVoice } from "./hooks/useLiveVoice";
import { StatusBadge } from "./components/StatusBadge";
import { Manifest } from "./components/Manifest";
import { Inventory } from "./components/Inventory";
import Features from "./components/Features";
import Autonomy from "./components/Autonomy";

function App() {
    const nova = useNova();
    const liveVoice = useLiveVoice(nova.core);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const {
        isListening,
        messages,
        toggleListening,
        isHalted,
        toggleHalt,
        handleHardRefresh,
        hasNewArchMsg,
        resetArchAlert,
        unlockAudio,
        version
    } = nova;

    const [currentView, setCurrentView] = useState<"home" | "features" | "autonomy" | "manifest" | "chat" | "inventory" | "settings">("home");
    const [gain, setGain] = useState(30);

    useEffect(() => {
        if (currentView === "chat") {
            resetArchAlert();
        }

        // 🛡️ ARCHITECT VOICE ALERT: Vocalize when a new message arrives and we aren't looking at the chat
        if (hasNewArchMsg && currentView !== "chat") {
            const utteranceClass = (window as any).SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance;
            if (window.speechSynthesis && utteranceClass) {
                const utterance = new utteranceClass("Ray, you have a new directive from the Architect.");
                utterance.pitch = 1.1;
                utterance.rate = 1.0;
                window.speechSynthesis.speak(utterance);
            }
        }
    }, [currentView, hasNewArchMsg, resetArchAlert]);

    // ✨ UI UX Polish (v9.7.1s): Auto-Scroll
    useEffect(() => {
        if (currentView === "chat") {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, currentView]);

    const renderContent = () => {
        switch (currentView) {
            case "features":
                return <Features />;
            case "autonomy":
                return <Autonomy />;
            case "manifest":
                return <Manifest />;
            case "inventory":
                return <Inventory />;
            case "chat":
                return (
                    <div className="flex flex-col h-[70vh]">
                        <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-4 no-scrollbar">
                            {messages.map((m: any, i: number) => (
                                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[90%] p-5 rounded-3xl shadow-2xl transition-all ${m.role === "user"
                                        ? "bg-[#0BF9EA] text-[#121212] rounded-tr-none border-2 border-white/40"
                                        : "bg-[#0BF9EA] text-[#121212] rounded-tl-none border-2 border-white/20 shadow-[0_10px_30px_rgba(11,249,234,0.4)]"
                                        }`}>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-[#121212]/60 mb-1">
                                            {m.role === "user" ? "Ray" : m.role === "architect" ? "Architect" : "Nova"}
                                        </div>
                                        <div className="text-base font-black leading-tight">{m.content}</div>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                    </div>
                );
            case "settings":
                return (
                    <div className="space-y-8 pb-32">
                        <section className="bg-[#121212]/60 backdrop-blur-3xl border-2 border-[#0BF9EA]/40 rounded-2xl p-6">
                            <h3 className="text-[#0BF9EA] font-black uppercase tracking-widest mb-6">Voice Calibration</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-black text-white/80">Input Gain</span>
                                    <span className="text-[#0BF9EA] font-black text-lg">{gain}dB</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={gain}
                                    onChange={(e) => setGain(parseInt(e.target.value))}
                                    className="w-full accent-[#0BF9EA] bg-white/10 h-3 rounded-full cursor-pointer"
                                />
                            </div>
                        </section>

                        <section className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-red-500 font-black uppercase tracking-widest">Nuclear Reset</h3>
                                <p className="text-red-500/60 text-[10px] font-bold">Clear all local memory and cache</p>
                            </div>
                            <button
                                onClick={handleHardRefresh}
                                className="p-4 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95"
                            >
                                <Trash2 size={24} />
                            </button>
                        </section>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] py-4">
                        <div className="relative flex justify-center mb-12">
                            <div className={`absolute inset-0 bg-[#0BF9EA]/20 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 ${isListening || liveVoice.isLiveActive ? "scale-150 animate-pulse" : "scale-75"}`}></div>
                            <button
                                onClick={() => {
                                    if (liveVoice.isLiveActive) {
                                        liveVoice.stopLive();
                                    } else {
                                        toggleListening();
                                        if (typeof (nova as any).unlockAudio === 'function') {
                                            (nova as any).unlockAudio();
                                        }
                                    }
                                }}
                                className={`mic-button relative z-10 ${isListening || liveVoice.isLiveActive ? "active" : ""}`}
                            >
                                <Mic size={48} />
                                {liveVoice.isLiveActive && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-[8px] font-black px-2 py-1 rounded-full animate-bounce">LIVE</span>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6 w-full max-w-[280px]">
                            <div
                                onClick={() => setCurrentView("inventory")}
                                className="sovereign-card group flex flex-col items-center justify-center p-8 text-center mb-0 after:hidden cursor-pointer hover:scale-105 transition-all relative overflow-hidden active:scale-95"
                            >
                                {/* 🛡️ LEVEL BADGE */}
                                <div className="absolute top-2 right-2 bg-[#121212] border border-[#0BF9EA]/30 px-2 py-0.5 rounded-full">
                                    <span className="text-[8px] font-black tracking-tighter text-[#0BF9EA]">LEVEL 6</span>
                                </div>

                                <span className="text-[11px] font-black uppercase tracking-widest mb-4 group-hover:text-[#0BF9EA] transition-colors">Elite Status</span>
                                <div className="w-20 h-20 bg-[#121212]/10 rounded-2xl flex items-center justify-center border-2 border-[#121212]/10 relative">
                                    <div className="absolute inset-0 bg-[#0BF9EA]/5 rounded-2xl animate-pulse"></div>
                                    <CheckCircle2 size={42} className="text-[#121212] relative z-10" />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#121212]/40 mt-4">Tap to View Inventory</span>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="h-[100dvh] bg-[#121212] flex flex-col items-center overflow-hidden">
            <div className="main-content h-full flex flex-col overflow-hidden">
                <header className="flex justify-between items-center mb-6 pt-4 px-2">
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black italic tracking-tighter text-[#0BF9EA] uppercase drop-shadow-[0_0_25px_rgba(11,249,234,0.6)]">Nova Sovereign</h1>
                        <span className="text-[10px] font-black text-[#0BF9EA]/60 tracking-[0.6em] uppercase mt-1">Elite {nova.version}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => liveVoice.isLiveActive ? liveVoice.stopLive() : liveVoice.startLive()}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all border-2 font-black text-[10px] uppercase tracking-widest ${liveVoice.isLiveActive
                                ? "bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                                : "bg-[#121212]/40 text-[#0BF9EA]/60 border-[#0BF9EA]/20"}`}
                        >
                            <Activity size={16} className={liveVoice.isLiveActive ? "animate-pulse" : ""} />
                            {liveVoice.isLiveActive ? "Live Mode" : "Go Live"}
                        </button>
                        <button
                            onClick={toggleHalt}
                            className={`p-3 rounded-xl transition-all border-2 ${isHalted
                                ? "bg-[#0BF9EA] text-[#121212] border-[#0BF9EA] animate-pulse shadow-[0_0_15px_rgba(11,249,234,0.8)]"
                                : "bg-[#121212]/40 text-[#0BF9EA]/60 border-[#0BF9EA]/20"}`}
                        >
                            <Shield size={24} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden relative">
                    {renderContent()}
                </main>

                <nav className="nav-bar">
                    <button
                        onClick={() => setCurrentView("home")}
                        className={`nav-item p-3 ${currentView === "home" ? "active bg-[#0BF9EA] text-[#121212] shadow-[0_0_20px_rgba(11,249,234,0.6)]" : "text-[#0BF9EA]/70"}`}
                    >
                        <Home size={24} />
                    </button>
                    <button
                        onClick={() => setCurrentView("chat")}
                        className={`nav-item p-3 relative ${currentView === "chat" ? "active bg-[#0BF9EA] text-[#121212] shadow-[0_0_20px_rgba(11,249,234,0.6)]" : "text-[#0BF9EA]/70"}`}
                    >
                        <MessageSquare size={24} />
                        {hasNewArchMsg && (
                            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping border-2 border-[#121212]"></span>
                        )}
                        {hasNewArchMsg && (
                            <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-[#121212]"></span>
                        )}
                    </button>
                    <button
                        onClick={() => setCurrentView("features")}
                        className={`nav-item p-3 ${currentView === "features" ? "active bg-[#0BF9EA] text-[#121212] shadow-[0_0_20px_rgba(11,249,234,0.6)]" : "text-[#0BF9EA]/70"}`}
                    >
                        <Brain size={24} />
                    </button>
                    <button
                        onClick={() => setCurrentView("autonomy")}
                        className={`nav-item p-3 ${currentView === "autonomy" ? "active bg-[#0BF9EA] text-[#121212] shadow-[0_0_20px_rgba(11,249,234,0.6)]" : "text-[#0BF9EA]/70"}`}
                    >
                        <Activity size={24} />
                    </button>
                    <button
                        onClick={() => setCurrentView("inventory")}
                        className={`nav-item p-3 ${currentView === "inventory" ? "active bg-[#0BF9EA] text-[#121212] shadow-[0_0_20px_rgba(11,249,234,0.6)]" : "text-[#0BF9EA]/70"}`}
                    >
                        <Database size={24} />
                    </button>
                    <button
                        onClick={() => setCurrentView("settings")}
                        className={`nav-item p-3 ${currentView === "settings" ? "active bg-[#0BF9EA] text-[#121212] shadow-[0_0_20px_rgba(11,249,234,0.6)]" : "text-[#0BF9EA]/70"}`}
                    >
                        <Settings size={24} />
                    </button>
                </nav>
            </div>
        </div>
    );
}

export default App;
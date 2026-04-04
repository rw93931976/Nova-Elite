import { useState, useEffect } from "react";
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
import { StatusBadge } from "./components/StatusBadge";
import { Manifest } from "./components/Manifest";
import { Inventory } from "./components/Inventory";
import Features from "./components/Features";
import Autonomy from "./components/Autonomy";

function App() {
    const nova = useNova();
    const {
        isListening,
        messages,
        toggleListening,
        isHalted,
        toggleHalt,
        handleHardRefresh,
        hasNewArchMsg,
        resetArchAlert
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
                    <div className="flex flex-col items-center justify-center min-h-[65vh] py-8">
                        <div className="relative flex justify-center mb-16">
                            <div className={`absolute inset-0 bg-[#0BF9EA]/20 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 ${isListening ? "scale-150 animate-pulse" : "scale-75"}`}></div>
                            <button
                                onClick={() => {
                                    toggleListening();
                                    if (typeof (nova as any).unlockAudio === 'function') {
                                        (nova as any).unlockAudio();
                                    }
                                }}
                                className={`mic-button relative z-10 ${isListening ? "active" : ""}`}
                            >
                                <Mic size={48} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 w-full">
                            <div className="sovereign-card flex flex-col items-center justify-center p-6 text-center">
                                <span className="text-[11px] font-black uppercase tracking-widest mb-3">System Halt</span>
                                <button
                                    onClick={toggleHalt}
                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isHalted ? "bg-[#121212] text-[#0BF9EA] shadow-xl" : "bg-black/10 border-2 border-[#121212]/20"
                                        }`}
                                >
                                    <Shield size={28} />
                                </button>
                            </div>
                            <div className="sovereign-card flex flex-col items-center justify-center p-6 text-center">
                                <span className="text-[11px] font-black uppercase tracking-widest mb-3">Elite Status</span>
                                <div className="w-16 h-16 bg-[#121212]/10 rounded-2xl flex items-center justify-center border-2 border-[#121212]/10">
                                    <CheckCircle2 size={36} className="text-[#121212]" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-[#121212] flex flex-col items-center">
            <div className="main-content">
                <header className="flex justify-between items-center mb-10 pt-6 px-4">
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black italic tracking-tighter text-[#0BF9EA] uppercase drop-shadow-[0_0_25px_rgba(11,249,234,0.6)]">Nova Sovereign</h1>
                        <span className="text-[10px] font-black text-[#0BF9EA]/60 tracking-[0.6em] uppercase mt-1">Elite {nova.version}</span>
                    </div>
                </header>

                <main>
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
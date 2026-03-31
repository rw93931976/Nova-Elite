import { useState, useEffect } from "react";
import {
    Mic,
    MessageSquare,
    Settings,
    Shield,
    Zap,
    Home,
    List,
    Trash2,
    Volume2,
    CheckCircle2,
    Database,
    Globe,
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
        isThinking,
        messages,
        toggleListening,
        sendMessage,
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
    }, [currentView, resetArchAlert]);

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
                        <div className="flex-1 overflow-y-auto space-y-6 px-4 pb-4 no-scrollbar">
                            {messages.map((m: any, i: number) => (
                                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-xl transition-all ${m.role === "user"
                                        ? "bg-[#0BF90A] text-[#121212] rounded-tr-none border-t-2 border-[#121212]/20"
                                        : m.role === "architect"
                                            ? "bg-[#121212] border-2 border-dashed border-[#0BF90A] text-[#0BF90A] rounded-tl-none shadow-[0_0_30px_rgba(11,249,10,0.2)]"
                                            : "bg-[#121212] border border-[#0BF90A]/30 text-[#0BF90A] rounded-tl-none shadow-[0_0_20px_rgba(11,249,10,0.1)]"
                                        }`}>
                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">
                                            {m.role === "user" ? "Ray" : m.role === "architect" ? "Architect" : "Nova"}
                                        </div>
                                        <div className="text-sm font-bold leading-relaxed">{m.content}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case "settings":
                return (
                    <div className="space-y-8 pb-32">
                        <section className="bg-[#121212]/40 backdrop-blur-2xl border border-[#0BF90A]/20 rounded-2xl p-6">
                            <h3 className="text-[#0BF90A] font-black uppercase tracking-widest mb-6">Voice Calibration</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white/60">Input Gain</span>
                                    <span className="text-[#0BF90A] font-black">{gain}dB</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={gain}
                                    onChange={(e) => setGain(parseInt(e.target.value))}
                                    className="w-full accent-[#0BF90A] bg-white/5 h-2 rounded-full cursor-pointer"
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
                            <div className={`absolute inset-0 bg-[#0BF90A]/20 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 ${isListening ? "scale-150 animate-pulse" : "scale-75"}`}></div>
                            <button
                                onClick={toggleListening}
                                className={`mic-button relative z-10 ${isListening ? "active" : ""}`}
                            >
                                <Mic size={48} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 w-full">
                            <div className="bg-[#0BF90A]/10 backdrop-blur-xl border border-[#0BF90A]/20 rounded-2xl p-6 flex flex-col items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[#0BF90A]">System Halt</span>
                                <button
                                    onClick={toggleHalt}
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isHalted ? "bg-[#0BF90A] shadow-[0_0_30px_rgba(11,249,10,0.4)]" : "bg-[#121212]/20 border border-[#0BF90A]/10"
                                        }`}
                                >
                                    <Shield size={24} className={isHalted ? "text-[#121212]" : "text-[#0BF90A]/40"} />
                                </button>
                            </div>
                            <div className="bg-[#0BF90A]/10 backdrop-blur-xl border border-[#0BF90A]/20 rounded-2xl p-6 flex flex-col items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-[#0BF90A]">Elite Status</span>
                                <div className="w-14 h-14 bg-[#121212]/20 rounded-2xl flex items-center justify-center">
                                    <CheckCircle2 size={32} className="text-[#0BF90A]/60" />
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
                <header className="flex justify-between items-center mb-8 pt-4">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black italic tracking-tighter text-[#0BF90A] uppercase">Nova Sovereign</h1>
                        <span className="text-[8px] font-bold text-[#0BF90A]/40 tracking-[0.5em] uppercase">Elite V8.2.0 [SOVEREIGN]</span>
                    </div>

                    <StatusBadge label="Sovereign" status="online" />
                </header>

                <main>
                    {renderContent()}
                </main>

                <nav className="nav-bar">
                    <button
                        onClick={() => setCurrentView("home")}
                        className={`nav-item p-3 ${currentView === "home" ? "active bg-[#0BF90A] text-[#121212]" : "text-[#0BF90A]/40"}`}
                    >
                        <Home size={24} />
                    </button>
                    <button
                        onClick={() => setCurrentView("chat")}
                        className={`nav-item p-3 relative ${currentView === "chat" ? "active bg-[#0BF90A] text-[#121212]" : "text-[#0BF90A]/40"}`}
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
                        className={`nav-item p-3 ${currentView === "features" ? "active bg-[#0BF90A] text-[#121212]" : "text-[#0BF90A]/40"}`}
                    >
                        <Brain size={24} />
                    </button>
                    <button
                        onClick={() => setCurrentView("autonomy")}
                        className={`nav-item p-3 ${currentView === "autonomy" ? "active bg-[#0BF90A] text-[#121212]" : "text-[#0BF90A]/40"}`}
                    >
                        <Activity size={24} />
                    </button>
                    <button
                        onClick={() => setCurrentView("inventory")}
                        className={`nav-item p-3 ${currentView === "inventory" ? "active bg-[#0BF90A] text-[#121212]" : "text-[#0BF90A]/40"}`}
                    >
                        <Database size={24} />
                    </button>
                    <button
                        onClick={() => setCurrentView("settings")}
                        className={`nav-item p-3 ${currentView === "settings" ? "active bg-[#0BF90A] text-[#121212]" : "text-[#0BF90A]/40"}`}
                    >
                        <Settings size={24} />
                    </button>
                </nav>
            </div>
        </div>
    );
}

export default App;
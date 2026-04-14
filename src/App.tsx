import { useState, useEffect, useRef, useCallback } from "react";
import {
    Mic,
    MessageSquare,
    Settings,
    Shield,
    Home,
    Trash2,
    Activity,
    Paperclip,
    Eye,
    Volume2,
    MapPin,
    Brain,
    Zap
} from "lucide-react";
import { Geolocation } from '@capacitor/geolocation';

export const NovaLogo = ({ size = 48, className = "" }: { size?: number, className?: string }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="2" strokeDasharray="10 4" className="animate-[spin_10s_linear_infinite]" opacity="0.4" />
        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1" opacity="0.2" />
        <path d="M30 70 V30 L70 70 V30" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="50" cy="50" r="4" fill="currentColor" className="animate-pulse" />
    </svg>
);

import { useNova } from "./hooks/useNova";
import { useLiveVoice } from "./hooks/useLiveVoice";
import { StatusBadge } from "./components/StatusBadge";
import { Manifest } from "./components/Manifest";
import { Inventory } from "./components/Inventory";
import { SovereignDashboard } from "./components/SovereignDashboard";
import DriveMode from './components/DriveMode';
import { triggerNavigation, parseLocationRequest } from './utils/NavigationUtils';
import StrategyVault from "./components/StrategyVault";
import { YouTubeService } from "./core/services/YouTubeService";
import Features from "./components/Features";
import Autonomy from "./components/Autonomy";

function App() {
    const nova = useNova();
    const liveVoice = useLiveVoice(nova.core);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const {
        isListening,
        isThinking,
        messages,
        toggleListening,
        isHalted,
        toggleHalt,
        handleHardRefresh,
        hasNewArchMsg,
        resetArchAlert,
        version
    } = nova;

    const [currentView, setCurrentView] = useState<"home" | "features" | "autonomy" | "manifest" | "chat" | "inventory" | "settings" | "vault">("home");

    // Expose setter for tiles/external triggers
    useEffect(() => {
        (window as any).novaSetView = setCurrentView;
    }, []);

    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [speed, setSpeed] = useState<number | null>(0);
    const [heading, setHeading] = useState<number | null>(null);
    const [isDriving, setIsDriving] = useState(false);
    const [forceZen, setForceZen] = useState(false);

    // 📺 YOUTUBE LINK DETECTION (v15.1)
    useEffect(() => {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.role === "user" && (lastMsg.content.includes("youtube.com") || lastMsg.content.includes("youtu.be"))) {
            const vidId = YouTubeService.extractVideoId(lastMsg.content);
            if (vidId && (window as any).novaLastProcessedVid !== vidId) {
                (window as any).novaLastProcessedVid = vidId;
                // Transition to vault or notify Nova
                console.log("📺 YouTube Link Detected:", vidId);
                // We could automatically show a "Process Strategy" button here
            }
        }
    }, [messages]);

    // 🏎️ SPEED DETECTION & SENSORY CONTEXT
    useEffect(() => {
        let watchId: string;

        const startWatching = async () => {
            try {
                const permission = await Geolocation.checkPermissions();
                if (permission.location !== 'granted') {
                    await Geolocation.requestPermissions();
                }

                watchId = await Geolocation.watchPosition({
                    enableHighAccuracy: true,
                    timeout: 10000
                }, (position) => {
                    if (position) {
                        const newCoords = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        setCoords(newCoords);
                        const s = position.coords.speed || 0;
                        setSpeed(s);
                        setHeading(position.coords.heading);

                        // Auto-toggle Drive mode if speed > 4.5 m/s (~10mph)
                        if (s > 4.5 && !isDriving && !forceZen) {
                            setIsDriving(true);
                        }

                        (window as any).novaSensoryContext = {
                            location: newCoords,
                            speed: s,
                            heading: position.coords.heading,
                            timestamp: new Date().toISOString()
                        };
                    }
                });
            } catch (e) {
                console.error("📍 [Sensory] GPS Error:", e);
            }
        };

        startWatching();
        return () => { if (watchId) Geolocation.clearWatch({ id: watchId }); };
    }, [isDriving, forceZen]);

    // 🗺️ NAVIGATION INTENT HANDLER
    useEffect(() => {
        const checkNav = () => {
            const lastResponse = (window as any).lastNovaResponse;
            if (lastResponse) {
                const dest = parseLocationRequest(lastResponse);
                if (dest) {
                    triggerNavigation(dest);
                    (window as any).lastNovaResponse = null;
                }
            }
        };
        const interval = setInterval(checkNav, 2000);
        return () => clearInterval(interval);
    }, []);

    // 🛡️ AUTHENTICATION SYSTEM
    const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("novaSovereignPin") === "3287");
    const [pinInput, setPinInput] = useState("");
    const [hasBiometricsRegistered, setHasBiometricsRegistered] = useState(() => !!localStorage.getItem("novaBiometricId"));
    const [biometricError, setBiometricError] = useState("");

    const triggerBiometricUnlock = useCallback(async () => {
        const biometricId = localStorage.getItem("novaBiometricId");
        if (!biometricId) return;
        try {
            const rawId = Uint8Array.from(atob(biometricId), c => c.charCodeAt(0));
            const challenge = window.crypto.getRandomValues(new Uint8Array(32));
            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge: challenge,
                    allowCredentials: [{ type: "public-key", id: rawId }],
                    userVerification: "required"
                }
            });
            if (assertion) {
                localStorage.setItem("novaSovereignPin", "3287");
                setIsAuthenticated(true);
            }
        } catch (e: any) {
            console.error("Biometric failed", e);
            setBiometricError("Biometric verification failed.");
        }
    }, []);

    const registerBiometrics = async () => {
        try {
            const challenge = window.crypto.getRandomValues(new Uint8Array(32));
            const userId = window.crypto.getRandomValues(new Uint8Array(16));
            const cred = await navigator.credentials.create({
                publicKey: {
                    challenge: challenge,
                    rp: { name: "Nova Sovereign", id: window.location.hostname },
                    user: { id: userId, name: "ray@nova-elite", displayName: "Ray Sovereign" },
                    pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
                    authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                    timeout: 60000,
                    attestation: "none"
                }
            }) as PublicKeyCredential;
            if (cred && cred.rawId) {
                localStorage.setItem("novaBiometricId", btoa(String.fromCharCode(...new Uint8Array(cred.rawId))));
                localStorage.setItem("novaSovereignPin", "3287");
                setHasBiometricsRegistered(true);
                setIsAuthenticated(true);
            }
        } catch (e: any) {
            console.error("Biometric registration failed", e);
            setBiometricError("Could not register biometrics.");
        }
    };

    useEffect(() => {
        if (!isAuthenticated && hasBiometricsRegistered) {
            triggerBiometricUnlock();
        }
    }, [isAuthenticated, hasBiometricsRegistered, triggerBiometricUnlock]);

    useEffect(() => {
        if (currentView === "chat") resetArchAlert();
    }, [currentView, resetArchAlert]);

    useEffect(() => {
        if (currentView === "chat") chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, currentView]);

    const renderContent = () => {
        switch (currentView) {
            case "features": return <Features />;
            case "autonomy": return <Autonomy />;
            case "manifest": return <Manifest />;
            case "inventory": return <Inventory />;
            case "vault": return <StrategyVault />;
            case "chat":
                return (
                    <div className="flex flex-col h-[70vh]">
                        <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-4 no-scrollbar">
                            {messages.map((m: any, i: number) => (
                                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[90%] p-5 rounded-3xl shadow-2xl transition-all ${m.role === "user" ? "bg-[#0BF9EA] text-[#121212] rounded-tr-none border-2 border-white/40" : "bg-[#0BF9EA] text-[#121212] rounded-tl-none border-2 border-white/20 shadow-[0_10px_30px_rgba(11,249,234,0.4)]"}`}>
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
                            <div className="flex items-center gap-3 mb-6">
                                <Volume2 className="text-[#0BF9EA]" size={20} />
                                <h3 className="text-[#0BF9EA] font-black uppercase tracking-widest">Voice Gain Control</h3>
                            </div>
                            <input
                                type="range"
                                min="0" max="2" step="0.05"
                                value={liveVoice.volume}
                                onChange={(e) => liveVoice.setVolume(parseFloat(e.target.value))}
                                className="w-full h-2 bg-[#121212] rounded-lg appearance-none cursor-pointer accent-[#0BF9EA] border border-[#0BF9EA]/20"
                            />
                            <div className="flex justify-between mt-2">
                                <span className="text-[9px] font-black text-[#0BF9EA] uppercase tracking-widest">{Math.round(liveVoice.volume * 100)}% Gain</span>
                                <span className="text-[9px] font-black text-[#0BF9EA]/40 uppercase tracking-widest">Active Drive Boost</span>
                            </div>
                        </section>

                        <section className="bg-[#121212]/60 backdrop-blur-3xl border-2 border-[#0BF9EA]/40 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <MapPin className="text-[#0BF9EA]" size={20} />
                                <h3 className="text-[#0BF9EA] font-black uppercase tracking-widest">Sovereign Sensory</h3>
                            </div>
                            <p className="text-[10px] text-white/40 uppercase font-mono">
                                {coords ? `📍 ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "🔍 Locating Sovereign Node..."}
                            </p>
                        </section>

                        <section className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between w-full">
                                <div>
                                    <h3 className="text-red-500 font-black uppercase tracking-widest">Nuclear Reset</h3>
                                    <p className="text-red-500/60 text-[10px] font-bold">Clear all local memory and cache</p>
                                </div>
                                <button onClick={() => { localStorage.clear(); handleHardRefresh(); }} className="p-4 bg-red-500/20 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95">
                                    <Trash2 size={24} />
                                </button>
                            </div>
                        </section>
                    </div>
                );
            default:
                return (
                    <SovereignDashboard
                        status={{
                            level: 6,
                            isSelfAware: true,
                            isLearning: true,
                            isHealing: true,
                            isEvolving: true,
                            isHalted: isHalted,
                            uptime: 100,
                            health: { bridge: 'online', apiKey: 'online', internet: 'online' },
                            knowledgeCount: 142,
                            agentCount: 12,
                            sovereignAlignment: 98,
                            currentTime: new Date().toLocaleTimeString()
                        }}
                        onToggleHalt={toggleHalt}
                        hasHotlineDirective={hasNewArchMsg}
                        onDirectiveClick={() => setCurrentView("chat")}
                        volume={liveVoice.volume}
                        onVolumeChange={liveVoice.setVolume}
                    />
                );
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="h-[100dvh] bg-[#121212] flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#121212] via-[#0a0a0a] to-black">
                <div className="flex flex-col items-center max-w-sm w-full mx-auto space-y-8 animate-in fade-in zoom-in duration-1000">
                    <Shield size={72} className="text-[#0BF9EA] mb-2 opacity-80 drop-shadow-[0_0_30px_rgba(11,249,234,0.6)] animate-pulse" />
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black uppercase tracking-widest text-white">Sovereign Protocol</h1>
                        <p className="text-[#0BF9EA]/60 text-xs font-bold uppercase tracking-[0.4em]">Connection Locked</p>
                    </div>
                    <div className="w-full space-y-4 pt-8">
                        {!hasBiometricsRegistered ? (
                            <>
                                <input type="password" value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full bg-[#121212]/50 border-2 border-[#0BF9EA]/30 rounded-2xl p-6 text-center text-3xl font-black tracking-[1em] text-white focus:outline-none focus:border-[#0BF9EA] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] transition-all" placeholder="••••" maxLength={4} autoFocus />
                                <button onClick={() => { if (pinInput === '3287') { if (window.PublicKeyCredential) registerBiometrics(); else { localStorage.setItem("novaSovereignPin", "3287"); setIsAuthenticated(true); } } else { setPinInput(""); setBiometricError("Invalid PIN."); } }} className="w-full bg-[#0BF9EA] text-[#121212] font-black uppercase tracking-widest p-5 rounded-2xl hover:bg-white hover:shadow-[0_0_30px_rgba(11,249,234,0.6)] transition-all active:scale-95">Authorize & Setup FaceID</button>
                                <p className="text-[9px] text-[#0BF9EA]/40 text-center uppercase tracking-widest mt-4">Enter 3287 to permanently link this device to your biometrics</p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center space-y-6">
                                <button onClick={triggerBiometricUnlock} className="w-24 h-24 rounded-full bg-[#121212] border-2 border-[#0BF9EA] text-[#0BF9EA] flex items-center justify-center hover:bg-[#0BF9EA]/10 transition-all shadow-[0_0_30px_rgba(11,249,234,0.3)] animate-pulse">
                                    <span className="text-4xl">🔐</span>
                                </button>
                                <p className="text-[10px] text-[#0BF9EA]/60 uppercase tracking-[0.2em] font-bold">Tap to unlock with Face ID</p>
                                <button onClick={() => { localStorage.removeItem("novaBiometricId"); setHasBiometricsRegistered(false); }} className="text-[9px] text-red-500/60 uppercase tracking-widest hover:text-red-500 underline underline-offset-4 mt-8">Reset Biometrics & Return to PIN</button>
                            </div>
                        )}
                        {biometricError && <div className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-bounce">{biometricError}</div>}
                    </div>
                </div>
            </div>
        );
    }

    // 🏎️ Drive Mode Conditional View
    if (isDriving && !forceZen) {
        return (
            <DriveMode
                isListening={isListening}
                isNovaThinking={isThinking}
                speed={speed}
                heading={heading}
                onToggleListen={toggleListening}
                onExit={() => { setForceZen(true); setIsDriving(false); }}
            />
        );
    }

    return (
        <div className="h-[100dvh] bg-[#121212] flex flex-col items-center overflow-hidden">
            <div className="main-content h-full flex flex-col overflow-hidden">
                {liveVoice.lastError && (
                    <div className="mx-4 mt-4 p-4 bg-red-500/20 border-2 border-red-500 rounded-2xl flex flex-col items-center gap-2 animate-bounce">
                        <div className="flex items-center gap-2 text-red-500 font-black uppercase text-[10px] tracking-widest"><Activity size={16} /> Connection Failure</div>
                        <div className="text-white text-xs font-bold text-center">{liveVoice.lastError}</div>
                        <button onClick={handleHardRefresh} className="mt-1 text-[10px] font-black uppercase text-red-500 underline decoration-2 underline-offset-4">Try Nuclear Reset</button>
                    </div>
                )}
                <header className="flex justify-between items-center mb-6 pt-4 px-2">
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black italic tracking-tighter text-[#0BF9EA] uppercase drop-shadow-[0_0_25px_rgba(11,249,234,0.6)]">Nova Sovereign</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black text-[#0BF9EA]/60 tracking-[0.6em] uppercase">Elite V15.0-SOVEREIGN</span>
                            <div className="bg-[#0BF9EA]/20 border border-[#0BF9EA]/40 px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(11,249,234,0.3)]">
                                <span className="text-[8px] font-black text-[#0BF9EA] uppercase tracking-widest">{isDriving ? 'DRIVING' : 'EYES ON ROAD'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setCurrentView("inventory")} className={`p-3 rounded-xl transition-all border-2 ${currentView === "inventory" ? "bg-[#0BF9EA] text-[#121212] border-[#0BF9EA] shadow-[0_0_15px_rgba(11,249,234,0.8)]" : "bg-[#121212]/40 text-[#0BF9EA]/60 border-[#0BF9EA]/20"}`}>
                            <Eye size={24} />
                        </button>
                        <button onClick={toggleListening} className={`p-3 rounded-xl transition-all border-2 ${isListening ? "bg-[#0BF9EA] text-[#121212] border-[#0BF9EA] animate-pulse shadow-[0_0_15px_rgba(11,249,234,0.8)]" : "bg-[#121212]/40 text-[#0BF9EA]/60 border-[#0BF9EA]/20"}`}>
                            <Mic size={24} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 w-full max-w-md mx-auto relative overflow-y-auto no-scrollbar pb-32">
                    {renderContent()}
                </main>

                <nav className="nav-bar">
                    <button onClick={() => { setCurrentView("home"); setForceZen(false); }} className={`nav-item p-3 ${currentView === "home" ? "active bg-[#0BF9EA] text-[#121212] shadow-[0_0_20px_rgba(11,249,234,0.6)]" : "text-[#0BF9EA]/70"}`}><Home size={24} /></button>
                    <button onClick={() => setCurrentView("chat")} className={`nav-item p-3 relative ${currentView === "chat" ? "active bg-[#0BF9EA] text-[#121212] shadow-[0_0_20px_rgba(11,249,234,0.6)]" : "text-[#0BF9EA]/70"}`}><MessageSquare size={24} />{hasNewArchMsg && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-ping border-2 border-[#121212]"></span>}{hasNewArchMsg && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-[#121212]"></span>}</button>
                    <button onClick={() => setCurrentView("vault")} className={`nav-item p-3 ${currentView === "vault" ? "active bg-[#0BF9EA] text-[#121212] shadow-[0_0_20px_rgba(11,249,234,0.6)]" : "text-[#0BF9EA]/70"}`}><Zap size={24} /></button>
                    <button onClick={() => setCurrentView("features")} className={`nav-item p-3 ${currentView === "features" ? "active bg-[#0BF9EA] text-[#121212] shadow-[0_0_20px_rgba(11,249,234,0.6)]" : "text-[#0BF9EA]/70"}`}><Brain size={24} /></button>
                    <button onClick={() => setCurrentView("inventory")} className={`nav-item p-3 ${currentView === "inventory" ? "active bg-[#0BF9EA] text-[#121212] shadow-[0_0_20px_rgba(11,249,234,0.6)]" : "text-[#0BF9EA]/70"}`}><Paperclip size={24} /></button>
                    <button onClick={() => setCurrentView("settings")} className={`nav-item p-3 ${currentView === "settings" ? "active bg-[#0BF9EA] text-[#121212] shadow-[0_0_20px_rgba(11,249,234,0.6)]" : "text-[#0BF9EA]/70"}`}><Settings size={24} /></button>
                </nav>
            </div>
        </div>
    );
}

export default App;
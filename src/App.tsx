import { useState } from 'react';
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
    CheckCircle2
} from 'lucide-react';
import { useNova } from './hooks/useNova';
import { StatusBadge } from './components/StatusBadge';
import { Manifest } from './components/Manifest';
import { Inventory } from './components/Inventory';

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
        handleHardRefresh
    } = nova;

    const [currentView, setCurrentView] = useState<'home' | 'manifest' | 'chat' | 'inventory' | 'settings'>('home');
    const [gain, setGain] = useState(30);

    const renderContent = () => {
        switch (currentView) {
            case 'manifest':
                return <Manifest />;
            case 'inventory':
                return <Inventory />;
            case 'chat':
                return (
                    <div className="flex flex-col h-[70vh]">
                        <div className="flex-1 overflow-y-auto space-y-6 px-4 pb-4 no-scrollbar">
                            {messages.map((m: any, i: number) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl shadow-xl transition-all ${m.role === 'user'
                                        ? 'bg-aqua text-charcoal rounded-tr-none border-t-2 border-white/20'
                                        : 'bg-charcoal border border-aqua/30 text-aqua rounded-tl-none shadow-[0_0_20px_rgba(11,249,234,0.1)]'
                                        }`}>
                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">
                                            {m.role === 'user' ? 'Ray' : 'Nova'}
                                        </div>
                                        <p className="text-sm font-bold leading-relaxed">{m.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isThinking && (
                                <div className="flex justify-start">
                                    <div className="bg-charcoal border border-aqua/20 p-4 rounded-2xl animate-pulse">
                                        <div className="flex gap-2">
                                            <div className="w-2 h-2 bg-aqua rounded-full"></div>
                                            <div className="w-2 h-2 bg-aqua rounded-full opacity-60"></div>
                                            <div className="w-2 h-2 bg-aqua rounded-full opacity-30"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="fixed bottom-28 left-0 w-full px-6 bg-transparent pointer-events-none">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const input = e.currentTarget.elements.namedItem('msg') as HTMLInputElement;
                                    if (input.value.trim()) {
                                        sendMessage(input.value);
                                        input.value = '';
                                    }
                                }}
                                className="relative max-w-lg mx-auto pointer-events-auto"
                            >
                                <input
                                    name="msg"
                                    placeholder="COMMAND NOVA..."
                                    className="w-full bg-charcoal/90 backdrop-blur-xl border-2 border-aqua/20 rounded-2xl px-6 py-5 text-aqua placeholder:text-aqua/10 font-black uppercase text-sm focus:border-aqua/50 outline-none transition-all shadow-2xl"
                                />
                                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-aqua hover:scale-110 transition-transform">
                                    <Zap size={24} fill="currentColor" />
                                </button>
                            </form>
                        </div>
                    </div>
                );
            case 'settings':
                return (
                    <div className="space-y-6 pb-20">
                        <section className="sovereign-card">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="flex items-center gap-2">
                                    <Volume2 size={24} />
                                    Calibration
                                </h3>
                                <span className="text-3xl font-black">{gain}%</span>
                            </div>
                            <div className="space-y-8">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 block">Output Gain (Sovereign Boost Active)</label>
                                    <input
                                        type="range"
                                        min="30"
                                        max="100"
                                        value={gain}
                                        onChange={(e) => setGain(parseInt(e.target.value))}
                                        className="w-full h-2 bg-charcoal/20 rounded-lg appearance-none cursor-pointer accent-charcoal"
                                    />
                                </div>
                                <div className="flex justify-between items-center bg-charcoal/10 p-4 rounded-xl border border-charcoal/5">
                                    <span className="text-[10px] font-black uppercase text-charcoal">Sovereign Boost</span>
                                    <div className="px-3 py-1 bg-charcoal text-aqua rounded-lg text-[9px] font-black uppercase">Active</div>
                                </div>
                            </div>
                        </section>

                        <section className="sovereign-card !bg-rose-600/10 !border-rose-600/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-rose-500 font-black uppercase text-sm italic">Nuclear Reset</h3>
                                <p className="text-[10px] text-rose-500/60 uppercase font-bold">Wipe Local Intelligence Cache</p>
                            </div>
                            <button
                                onClick={handleHardRefresh}
                                className="p-4 bg-rose-600/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                            >
                                <Trash2 size={24} />
                            </button>
                        </section>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center pt-8">
                        <div className="mb-12 relative flex justify-center">
                            <div className={`absolute inset-0 bg-[#0BF9EA]/20 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 ${isListening ? 'scale-150 animate-pulse' : 'scale-75'}`}></div>
                            <button
                                onClick={toggleListening}
                                className={`mic-button relative z-10 ${isListening ? 'active' : ''}`}
                            >
                                <Mic size={48} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 w-full">
                            <div className="sovereign-card py-6 flex flex-col items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">System Halt</span>
                                <button
                                    onClick={toggleHalt}
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isHalted ? 'bg-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.4)]' : 'bg-charcoal/20 border border-charcoal/10'
                                        }`}
                                >
                                    <Shield size={24} className={isHalted ? 'text-white' : 'text-charcoal/40'} />
                                </button>
                            </div>
                            <div className="sovereign-card py-6 flex flex-col items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Elite Status</span>
                                <div className="w-14 h-14 bg-charcoal/20 rounded-2xl flex items-center justify-center">
                                    <CheckCircle2 size={32} className="text-charcoal/60" />
                                </div>
                            </div>
                        </div>

                        {/* Status Footer */}
                        <div className="mt-16 text-center">
                            <p className={`text-[11px] font-black uppercase tracking-[0.4em] transition-all duration-700 ${isListening ? 'text-aqua' : 'text-aqua/10'}`}>
                                {isListening ? 'Nova is Listening...' : 'Tap Mic to Command'}
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full min-h-screen bg-[#121212] text-[#0BF9EA] overflow-y-auto no-scrollbar pb-32">

            {/* 👑 ELITE HEADER */}
            <header className="fixed top-0 left-0 w-full z-[100] px-6 py-8 bg-charcoal/90 backdrop-blur-2xl border-b border-white/5">
                <div className="flex justify-between items-center max-w-lg mx-auto">
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black italic tracking-tighter drop-shadow-[0_0_20px_rgba(11,249,234,0.3)] leading-none">
                            NOVA ELITE
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] font-black tracking-[0.4em] opacity-40 uppercase">v8.1 Sovereign</span>
                            <span className="h-[1px] w-6 bg-aqua/20"></span>
                            <StatusBadge label="EARS" status={isListening ? 'online' : 'offline'} />
                        </div>
                    </div>
                    <StatusBadge label="BRAIN" status={isThinking ? 'connecting' : 'online'} />
                </div>
            </header>

            <main className="max-w-lg mx-auto px-6 pt-32 h-full">
                {renderContent()}
            </main>

            {/* 🛸 SOVEREIGN NAV */}
            <nav className="nav-bar">
                <NavButton active={currentView === 'home'} onClick={() => setCurrentView('home')} icon={<Home size={22} />} />
                <NavButton active={currentView === 'manifest'} onClick={() => setCurrentView('manifest')} icon={<List size={22} />} />
                <NavButton active={currentView === 'chat'} onClick={() => setCurrentView('chat')} icon={<MessageSquare size={22} />} />
                <NavButton active={currentView === 'inventory'} onClick={() => setCurrentView('inventory')} icon={<Database size={22} />} />
                <NavButton active={currentView === 'settings'} onClick={() => setCurrentView('settings')} icon={<Settings size={22} />} />
            </nav>
        </div>
    );
}

function NavButton({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`nav-item p-3 flex flex-col items-center justify-center ${active ? 'active' : ''}`}
        >
            {icon}
        </button>
    );
}

export default App;

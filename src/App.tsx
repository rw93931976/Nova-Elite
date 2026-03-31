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

    const [activeTab, setActiveTab] = useState('home');
    const [gain, setGain] = useState(30);

    const renderContent = () => {
        switch (activeTab) {
            case 'manifest':
                return <Manifest />;
            case 'inventory':
                return <Inventory />;
            case 'chat':
                return (
                    <div className="flex flex-col h-[70vh]">
                        <div className="flex-1 overflow-y-auto space-y-4 px-4 pb-4 no-scrollbar">
                            {messages.map((m: any, i: number) => (
                                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === 'user'
                                            ? 'bg-aqua text-charcoal rounded-tr-none'
                                            : 'bg-white/5 border border-white/10 rounded-tl-none'
                                        }`}>
                                        <p className="text-sm font-bold leading-relaxed">{m.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isThinking && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 p-4 rounded-2xl animate-pulse">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-aqua rounded-full"></div>
                                            <div className="w-1.5 h-1.5 bg-aqua rounded-full"></div>
                                            <div className="w-1.5 h-1.5 bg-aqua rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="fixed bottom-24 left-0 w-full px-6 bg-charcoal/80 backdrop-blur-md py-4">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const input = e.currentTarget.elements.namedItem('msg') as HTMLInputElement;
                                    if (input.value.trim()) {
                                        sendMessage(input.value);
                                        input.value = '';
                                    }
                                }}
                                className="relative max-w-lg mx-auto"
                            >
                                <input
                                    name="msg"
                                    placeholder="COMMAND NOVA..."
                                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-aqua placeholder:text-aqua/20 font-black uppercase text-sm focus:border-aqua/50 outline-none transition-all"
                                />
                                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-aqua">
                                    <Zap size={20} fill="currentColor" />
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
                                    <span className="text-[10px] font-black uppercase">Sovereign Boost</span>
                                    <div className="px-3 py-1 bg-charcoal text-aqua rounded-lg text-[9px] font-black uppercase">Active</div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-rose-500/10 border-2 border-rose-500/20 rounded-2x1 p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-rose-500 font-black uppercase text-sm italic">Nuclear Reset</h3>
                                <p className="text-[10px] text-rose-500/60 uppercase font-bold">Wipe Local Intelligence Cache</p>
                            </div>
                            <button
                                onClick={handleHardRefresh}
                                className="p-3 bg-rose-500/20 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        </section>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center pt-8">
                        <div className="mb-12 relative">
                            <div className={`absolute inset-0 bg-aqua/20 blur-[60px] rounded-full transition-all duration-1000 ${isListening ? 'scale-150 animate-pulse' : 'scale-75'}`}></div>
                            <button
                                onClick={toggleListening}
                                className={`mic-button ${isListening ? 'active' : ''}`}
                            >
                                <Mic />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 w-full">
                            <div className="sovereign-card py-6 flex flex-col items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">System Halt</span>
                                <button
                                    onClick={toggleHalt}
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isHalted ? 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'bg-charcoal/10 border border-charcoal/10'
                                        }`}
                                >
                                    <Shield size={20} className={isHalted ? 'text-white' : 'text-charcoal/40'} />
                                </button>
                            </div>
                            <div className="sovereign-card py-6 flex flex-col items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Elite Status</span>
                                <div className="w-12 h-12 bg-charcoal/10 rounded-xl flex items-center justify-center">
                                    <CheckCircle2 size={24} className="text-charcoal" />
                                </div>
                            </div>
                        </div>

                        {/* Status Footer */}
                        <div className="mt-12 text-center">
                            <p className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${isListening ? 'text-aqua' : 'text-aqua/20'}`}>
                                {isListening ? 'Nova is Listening...' : 'Tap Mic to Command'}
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full min-h-screen bg-charcoal text-aqua overflow-y-auto no-scrollbar pb-32">

            {/* 👑 ELITE HEADER */}
            <header className="fixed top-0 left-0 w-full z-[100] px-6 py-8 bg-charcoal/90 backdrop-blur-xl">
                <div className="flex justify-between items-center max-w-lg mx-auto">
                    <div className="flex flex-col">
                        <h1 className="text-4xl font-black italic tracking-tighter drop-shadow-2xl leading-none">
                            NOVA ELITE
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] font-black tracking-[0.4em] opacity-40 uppercase">v8.0 Sovereign</span>
                            <span className="h-[2px] w-4 bg-aqua/20"></span>
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
            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-[101]">
                <div className="bg-charcoal/90 backdrop-blur-2xl border-2 border-aqua/10 rounded-3xl p-2 px-4 flex justify-between items-center shadow-2xl">
                    <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={<Home size={22} />} />
                    <NavButton active={activeTab === 'manifest'} onClick={() => setActiveTab('manifest')} icon={<List size={22} />} />
                    <NavButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare size={22} />} />
                    <NavButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Shield size={22} />} />
                    <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={22} />} />
                </div>
            </nav>
        </div>
    );
}

function NavButton({ active, onClick, icon }: { active: boolean, onClick: () => void, icon: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`p-3 rounded-2xl transition-all duration-300 ${active
                    ? 'bg-aqua text-charcoal shadow-[0_0_20px_rgba(11,249,234,0.4)] scale-110 -translate-y-2'
                    : 'text-aqua/40 hover:text-aqua/60'
                }`}
        >
            {icon}
        </button>
    );
}

export default App;

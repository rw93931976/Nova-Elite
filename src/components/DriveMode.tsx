import React from 'react';
import { Mic, MicOff, Navigation, Volume2, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DriveModeProps {
    isListening: boolean;
    isNovaThinking: boolean;
    speed: number | null;
    heading: number | null;
    onToggleListen: () => void;
    onExit: () => void;
}

const DriveMode: React.FC<DriveModeProps> = ({
    isListening,
    isNovaThinking,
    speed,
    heading,
    onToggleListen,
    onExit
}) => {
    // 🏎️ Convert speed to MPH (if in meters per second)
    const mph = speed ? Math.round(speed * 2.23694) : 0;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-between p-8 text-white">
            {/* 🔝 Top Header: Mission Critical Info */}
            <div className="w-full flex justify-between items-start pt-4">
                <div className="flex flex-col">
                    <div className="text-6xl font-black tracking-tighter text-blue-500 flex items-center gap-2">
                        {mph} <span className="text-xl text-gray-400">MPH</span>
                    </div>
                    <div className="text-gray-500 font-mono text-sm tracking-widest uppercase">
                        SENSORY FEED: {heading ? `${Math.round(heading)}°` : 'CALIBRATING'}
                    </div>
                </div>

                <button
                    onClick={onExit}
                    className="bg-red-900/20 border border-red-500/50 p-4 rounded-xl text-red-500 uppercase text-xs font-bold tracking-widest"
                >
                    Exit Zen
                </button>
            </div>

            {/* 🧠 Core: The Pulse */}
            <div className="flex-1 flex flex-col items-center justify-center relative w-full">
                <AnimatePresence>
                    {(isListening || isNovaThinking) && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: 0.2 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                            className={`absolute w-80 h-80 rounded-full blur-3xl ${isNovaThinking ? 'bg-blue-500' : 'bg-emerald-500'}`}
                        />
                    )}
                </AnimatePresence>

                <button
                    onClick={onToggleListen}
                    className={`relative z-10 w-64 h-64 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isListening
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_50px_rgba(16,185,129,0.3)]'
                            : 'border-gray-800 bg-gray-900/50 shadow-none'
                        }`}
                >
                    {isListening ? (
                        <Mic className="w-32 h-32 text-emerald-500" />
                    ) : (
                        <MicOff className="w-32 h-32 text-gray-600" />
                    )}
                </button>

                <div className="mt-12 text-center h-16">
                    <p className="text-2xl font-bold tracking-tight text-blue-400">
                        {isNovaThinking ? 'NOVA IS STRATEGIZING...' : isListening ? 'LISTENING TO ARCHITECT' : 'READY TO RECEIVE'}
                    </p>
                    <p className="text-gray-500 text-sm mt-2 font-mono uppercase tracking-[0.3em]">
                        Road Sensory Integration Active
                    </p>
                </div>
            </div>

            {/* 🦶 Bottom: Quick Actions */}
            <div className="w-full grid grid-cols-2 gap-4 pb-4">
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl flex flex-col items-center gap-2">
                    <Navigation className="text-blue-500 w-8 h-8" />
                    <span className="text-[10px] text-gray-500 tracking-widest uppercase font-bold">Nav Intents Active</span>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-2xl flex flex-col items-center gap-2">
                    <Shield className="text-emerald-500 w-8 h-8" />
                    <span className="text-[10px] text-gray-500 tracking-widest uppercase font-bold">Armor Hardened</span>
                </div>
            </div>

            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 -rotate-90 origin-left text-[10px] text-gray-700 tracking-[1em] uppercase">
                Sovereign Ascension v15.0
            </div>
        </div>
    );
};

export default DriveMode;

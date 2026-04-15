import React, { useRef, useEffect } from 'react';
import type { Message } from '../types/nova';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageListProps {
    messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
            <AnimatePresence initial={false}>
                {messages.map((msg) => (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 15, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
                    >
                        <div
                            className={`max-w-[85%] px-5 py-4 rounded-2xl shadow-2xl transition-all ${msg.from === 'user'
                                ? 'bg-aqua text-charcoal rounded-tr-none border-t-2 border-white/20'
                                : 'bg-charcoal border border-aqua/30 text-aqua rounded-tl-none shadow-[0_0_30px_rgba(11,249,234,0.1)]'
                                }`}
                        >
                            <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 mb-1.5">
                                {msg.from === 'user' ? 'Ray' : 'Nova'}
                            </div>
                            <div className="text-[14px] font-bold leading-relaxed tracking-tight font-inter">
                                {msg.content}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            <div ref={endRef} />
        </div>
    );
};

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
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed ${msg.from === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white/10 text-white/90 backdrop-blur-md border border-white/10 rounded-tl-none'
                                }`}
                        >
                            <div className="text-[10px] font-bold opacity-50 mb-0.5 uppercase tracking-tighter">
                                {msg.from}
                            </div>
                            {msg.content}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            <div ref={endRef} />
        </div>
    );
};

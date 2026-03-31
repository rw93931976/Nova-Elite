import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { NovaCore } from '../core/NovaCore';
import { supabase } from '../integrations/supabase';
import type { Message, NovaStatus } from '../types/nova';

// 🔊 SHARED AUDIO CONTEXT (v3.6.2 FIX)
let sharedAudioCtx: AudioContext | null = null;
const getSharedCtx = () => {
    if (!sharedAudioCtx) {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) sharedAudioCtx = new AudioCtx();
    }
    return sharedAudioCtx;
};

// 🛡️ COGNITIVE FIREWALL: Universal Preamble & Capability Suppression 
const stripPreamble = (text: string) => {
    if (!text) return "";
    const targets = [
        /^(Yes,?\s+)?I've\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received).*/i,
        /^(Yes,?\s+)?I\s+(have|am)\s+(been|integrated|designed|processed|equipped|enhanced|incorporating|received).*/i,
        /^(Yes,?\s+)?I\s+(can|will|should)\s+(be|assist|help).*/i,
        /^Hey\s*(Nova|Ray).*/i,
        /I haven't yet processed specific real-time data.*/i,
        /I am equipped to recognize and respond.*/i,
        /As an AI assistant, I.*/i,
        /My current capabilities include.*/i,
        /I can certainly assist you with.*/i,
        /Confirm bridge stabilization status.*/i,
        /According to my (architect|system|instructions).*/i,
        /Your inquiry about the (farm|firm|bridge) stabilization status.*/i
    ];

    let lines = text.split('\n');
    let cleanedLines = lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return true;
        return !targets.some(regex => regex.test(trimmed));
    });

    let cleaned = cleanedLines.join('\n').trim();
    cleaned = cleaned.replace(/^(Hi\s+)?Ray,?\s*/i, "").trim();
    if (cleaned.length > 0) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    return cleaned;
};

export const useNova = () => {
    const [core] = useState(() => new NovaCore());
    const [messages, setMessages] = useState<Message[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting' | 'sovereign'>('connecting');

    const addBotMessage = useCallback((from: string, content: string) => {
        const cleanedContent = stripPreamble(content);
        const newMessage: Message = {
            id: Date.now().toString(),
            from: from as any,
            to: 'user',
            content: cleanedContent,
            timestamp: Date.now(),
            type: 'received',
            status: 'delivered'
        };
        setMessages(prev => [...prev, newMessage]);
    }, []);

    const [novaStatus, setNovaStatus] = useState<NovaStatus>({
        level: 5,
        health: { bridge: 'offline', apiKey: 'online', internet: 'online' },
        isSelfAware: true,
        isLearning: true,
        isHealing: true,
        isEvolving: true,
        uptime: 0,
        knowledgeCount: 0,
        agentCount: 0,
        whartonCompliance: 100
    });

    const [connections, setConnections] = useState({
        swarm: 'offline' as 'online' | 'offline' | 'connecting',
        antigravity: 'offline' as 'online' | 'offline' | 'connecting',
        windsurf: 'offline' as 'online' | 'offline' | 'connecting',
        brain: 'offline' as 'online' | 'offline' | 'connecting' // v7.2-HYBRID: Verified Pulse Tracking
    });

    const [pendingAction, setPendingAction] = useState<{ id: string, resolve: (v: boolean) => void } | null>(null);
    const [lastTone, setLastTone] = useState<string>('neutral');
    const lastUrl = useRef<string | null>(null);

    // --- Nova Phase 2: Message History ---
    useEffect(() => {
        const fetchHistory = async () => {
            const { data: msgData } = await core.supabase
                .from('nova_messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(50);

            if (msgData) {
                setMessages(msgData.map(m => ({
                    id: m.id,
                    from: (m.role || 'assistant') as any,
                    to: m.role === 'user' ? 'assistant' : 'user',
                    content: m.content || '',
                    timestamp: new Date(m.created_at).getTime(),
                    type: m.role === 'user' ? 'sent' : 'received',
                    status: 'delivered'
                })));
            }
        };
        fetchHistory();
    }, [core]);

    // 🌊 SOVEREIGN SYNC (v7.2): Synchronize core engine status to UI
    useEffect(() => {
        const syncStatus = () => {
            const currentStatus = core.getStatus();
            setStatus(currentStatus);
            setConnections(prev => ({
                ...prev,
                brain: currentStatus.health.bridge === 'online' ? 'online' : 'offline'
            }));
        };
        const interval = setInterval(syncStatus, 1500);
        return () => clearInterval(interval);
    }, [core]);

    const msgChannel = core.supabase
        .channel('nova_messages_realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nova_messages' }, (payload) => {
            const m = payload.new;
            const newMessage: Message = {
                id: m.id || Date.now().toString(),
                from: (m.role || 'assistant') as any,
                to: m.role === 'user' ? 'assistant' : 'user',
                content: m.content || m.text || m.message || '',
                timestamp: new Date(m.created_at).getTime() || Date.now(),
                type: m.role === 'user' ? 'sent' : 'received',
                status: 'delivered'
            };

            setMessages(prev => {
                const exists = prev.some(msg =>
                    msg.id === newMessage.id ||
                    (msg.content === newMessage.content && msg.from === newMessage.from && msg.status === 'pending')
                );
                if (exists) {
                    return prev.map(msg =>
                        (msg.content === newMessage.content && msg.from === newMessage.from && msg.status === 'pending')
                            ? newMessage : msg
                    );
                }
                return [...prev, newMessage];
            });
        })
        .subscribe();

    // 🔊 VOCAL MIRROR (v3.2): Listen for completed relay jobs and play the audio locally
    const relayChannel = core.supabase
        .channel('relay_jobs_realtime')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'relay_jobs', filter: 'status=eq.completed' }, (payload) => {
            const job = payload.new;
            if (job.type === 'speech' && job.payload?.audio_url) {
                console.log("🔊 [MIRROR]: Playing audio from bridge:", job.payload.audio_url);
                const audio = new Audio(job.payload.audio_url);
                audio.crossOrigin = "anonymous";
                audio.volume = 1.0;

                const ctx = getSharedCtx();
                if (ctx) {
                    try {
                        if (ctx.state === 'suspended') ctx.resume();
                        const source = ctx.createMediaElementSource(audio);
                        const gainNode = ctx.createGain();
                        const baseVolume = (window as any).NOVA_VOLUME || 0.3;
                        gainNode.gain.value = baseVolume * 15.0;
                        source.connect(gainNode);
                        gainNode.connect(ctx.destination);
                    } catch (e) { }
                }

                audio.onended = () => {
                    if ((window as any).NOVA_RESUME_LISTENING) (window as any).NOVA_RESUME_LISTENING();
                };
                audio.onerror = () => {
                    if ((window as any).NOVA_RESUME_LISTENING) (window as any).NOVA_RESUME_LISTENING();
                };
                audio.play().catch(() => {
                    if ((window as any).NOVA_RESUME_LISTENING) (window as any).NOVA_RESUME_LISTENING();
                });
            }
        })
        .subscribe();

    return () => {
        core.supabase.removeChannel(msgChannel);
        core.supabase.removeChannel(relayChannel);
    };
}, [core, addBotMessage]);

const processingLock = useRef<boolean>(false);
const processWithNova = useCallback(async (input: string, options?: { onReceipt?: (r: string) => void, highGain?: boolean }) => {
    if (processingLock.current) return;
    try {
        processingLock.current = true;

        // 🧠 OPTIMISTIC UI: Show message immediately
        const userMsg = {
            id: Date.now().toString(),
            from: 'user' as const,
            to: 'assistant',
            content: input,
            timestamp: Date.now(),
            type: 'sent' as const,
            status: 'pending' as const
        };
        setMessages(prev => [...prev, userMsg]);

        await core.supabase.from('nova_messages').insert([{ role: 'user', content: input }]);

        const history = messages.slice(-25).map(m => ({
            role: m.from === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

        const urlMatch = input.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch) lastUrl.current = urlMatch[0];

        const thought = await core.processElite(input, { history, lastUrl: lastUrl.current }, options?.onReceipt);
        if (thought?.analysis?.tone) setLastTone(thought.analysis.tone);

        if (thought?.response) {
            // 💾 SOVEREIGN PERSISTENCE: Save assistant response to chat history
            await core.supabase.from('nova_messages').insert([{
                role: 'assistant',
                content: thought.response
            }]);

            await core.supabase.from('relay_jobs').insert([{
                type: 'speech',
                status: 'pending',
                payload: { text: thought.response }
            }]);
        }

        return thought;
    } catch (e: any) {
        console.error('❌ Interaction failed:', e);
        processingLock.current = false;
    } finally {
        processingLock.current = false;
    }
}, [core, messages]);

return useMemo(() => ({
    messages,
    status: novaStatus,
    connectionStatus,
    connections,
    processWithNova,
    pendingAction,
    setPendingAction,
    lastTone,
    addBotMessage,
    core
}), [messages, novaStatus, connectionStatus, connections, processWithNova, pendingAction, lastTone, addBotMessage, core]);
};

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { NovaCore } from '../core/NovaCore';
import { useSpeech } from './useSpeech';
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
        /Your inquiry about the (farm|firm|bridge) stabilization status.*/i,
        /v7\.[0-9]-SOVEREIGN/i,
        /\[ID: [a-z0-9]+\]/i,
        /\[Uptime: \d+s\]/i,
        /^_{2,}.*/, // Catch underscore-heavy lines (thoughts)
        /.*_{2,}$/, // Catch trailing underscores
        /_{10,}/,  // Catch any long underscore strings
        /\[.*\]/,   // Catch anything in brackets (internal tags)
        /burst limit/i,
        /heartbeat/i,
        /trace/i,
        /thought/i,
        /receipt/i,
        /processing/i
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
    const [isThinking, setIsThinking] = useState(false);
    const [isHalted, setIsHalted] = useState(core.isHalted);
    const [pendingAction, setPendingAction] = useState<{ id: string, resolve: (v: boolean) => void } | null>(null);
    const [lastTone, setLastTone] = useState<string>('neutral');
    const lastUrl = useRef<string | null>(null);
    const processingLock = useRef<boolean>(false);

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
        brain: 'offline' as 'online' | 'offline' | 'connecting'
    });

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

    const processWithNova = useCallback(async (input: string, options?: { onReceipt?: (r: string) => void, highGain?: boolean }) => {
        if (processingLock.current) return;
        try {
            processingLock.current = true;
            setIsThinking(true);

            const userMsg: Message = {
                id: Date.now().toString(),
                from: 'user',
                to: 'assistant',
                content: input,
                timestamp: Date.now(),
                type: 'sent',
                status: 'pending'
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
        } finally {
            processingLock.current = false;
            setIsThinking(false);
        }
    }, [core, messages]);

    const sendMessage = useCallback(async (text: string) => {
        return processWithNova(text);
    }, [processWithNova]);

    const toggleHalt = useCallback(() => {
        core.toggleHalt();
        setIsHalted(core.isHalted);
    }, [core]);

    const reinitialize = useCallback(() => {
        window.location.reload();
    }, []);

    const handleHardRefresh = useCallback(async () => {
        const confirmed = window.confirm("PERFORM NUCLEAR CACHE CLEAR?\nThis will purge all local data and force a fresh fetch from the server.");
        if (!confirmed) return;
        try {
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const reg of registrations) await reg.unregister();
            }
            if (window.caches) {
                const names = await caches.keys();
                await Promise.all(names.map(n => caches.delete(n)));
            }
            localStorage.clear();
            sessionStorage.clear();
            window.alert("CACHE PURGED. RELOADING...");
            window.location.href = window.location.origin + '?t=' + Date.now();
        } catch (e) {
            window.location.reload();
        }
    }, []);

    const { isListening, toggleListening } = useSpeech((text) => {
        sendMessage(text);
    });

    // Initial Fetch
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

    // Status sync
    useEffect(() => {
        const syncStatus = () => {
            const currentStatus = core.getStatus();
            setNovaStatus(currentStatus);

            const isBridgeOnline = currentStatus.health.bridge === 'online';
            const isApiOnline = currentStatus.health.api === 'online';

            if (isBridgeOnline) {
                (window as any).NOVA_USE_BROWSER_TTS = false;
                setConnectionStatus('sovereign');
            } else if (isApiOnline) {
                (window as any).NOVA_USE_BROWSER_TTS = true;
                setConnectionStatus('online');
            } else {
                (window as any).NOVA_USE_BROWSER_TTS = true;
                setConnectionStatus('offline');
            }

            setConnections(prev => ({
                ...prev,
                brain: isBridgeOnline ? 'online' : 'offline',
                antigravity: isApiOnline ? 'online' : 'offline'
            }));
        };
        const interval = setInterval(syncStatus, 1500);
        return () => clearInterval(interval);
    }, [core]);

    // Subscriptions
    useEffect(() => {
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
                    const exists = prev.some(msg => msg.id === newMessage.id);
                    if (exists) return prev;
                    return [...prev, newMessage];
                });
            })
            .subscribe();

        const relayChannel = core.supabase
            .channel('relay_jobs_realtime')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'relay_jobs', filter: 'status=eq.completed' }, (payload) => {
                const job = payload.new;
                if (job.type === 'speech' && job.payload?.audio_url) {
                    if ((window as any).NOVA_USE_BROWSER_TTS) return;

                    const audio = new Audio(job.payload.audio_url);
                    audio.crossOrigin = "anonymous";
                    const ctx = getSharedCtx();
                    if (ctx) {
                        try {
                            if (ctx.state === 'suspended') ctx.resume();
                            const source = ctx.createMediaElementSource(audio);
                            const gainNode = ctx.createGain();
                            gainNode.gain.value = (window as any).NOVA_VOLUME || 0.6;
                            source.connect(gainNode);
                            gainNode.connect(ctx.destination);
                        } catch (e) { }
                    }
                    audio.play().catch(() => { });
                }
            })
            .subscribe();

        return () => {
            core.supabase.removeChannel(msgChannel);
            core.supabase.removeChannel(relayChannel);
        };
    }, [core]);

    return useMemo(() => ({
        messages,
        status: novaStatus,
        connectionStatus,
        connections,
        processWithNova,
        sendMessage,
        isListening,
        toggleListening,
        isThinking,
        isHalted,
        toggleHalt,
        handleHardRefresh,
        pendingAction,
        setPendingAction,
        lastTone,
        addBotMessage,
        reinitialize,
        core
    }), [
        messages, novaStatus, connectionStatus, connections,
        processWithNova, sendMessage, isListening, toggleListening,
        isThinking, isHalted, toggleHalt, handleHardRefresh,
        pendingAction, lastTone, addBotMessage, reinitialize, core
    ]);
};

import { useState, useEffect, useCallback, useRef } from 'react';
import { NovaCore } from '../core/NovaCore';
import { ConnectionManager } from '../core/ConnectionManager';
import { supabase } from '../integrations/supabase';
import type { Message, NovaStatus } from '../types/nova';

<<<<<<< HEAD
// 🔊 SHARED AUDIO CONTEXT (v3.6.2 FIX): Prevents memory leaks by reusing a single context
let sharedAudioCtx: AudioContext | null = null;
const getSharedCtx = () => {
    if (!sharedAudioCtx) {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) sharedAudioCtx = new AudioCtx();
    }
    return sharedAudioCtx;
};

=======
>>>>>>> sovereign-elite-v3-6
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

    // Define callbacks EARLY to avoid TDZ (Temporal Dead Zone) in useEffect dependencies
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

    const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'connecting' | 'sovereign'>('connecting');

    // v4.1 Pulse: Detect Sovereign activity
    useEffect(() => {
        const isSovereign = true; // Doctorate level is always Sovereign
        if (isSovereign && connectionStatus === 'online') {
            setConnectionStatus('sovereign');
        }
    }, [connectionStatus]);

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
        brain: 'online' as 'online' | 'offline' | 'connecting'
    });

    const [pendingAction, setPendingAction] = useState<{ id: string, resolve: (v: boolean) => void } | null>(null);
    const [lastTone, setLastTone] = useState<string>('neutral');

    const coreWS = useRef<ConnectionManager | null>(null);
    const pendingResolve = useRef<((v: any) => void) | null>(null);
    const lastUrl = useRef<string | null>(null);

    // --- Nova Phase 2: Message History ---
    useEffect(() => {
        const fetchHistory = async () => {
            // 1. Fetch regular messages
            const { data: msgData } = await supabase
                .from('nova_messages')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(50);

            // 2. Fetch shadow thoughts (The swarm reasoning)
            const { data: shadowData } = await supabase
                .from('nova_thoughts')
                .select('*')
                .eq('context->>shadow', 'true')
                .order('created_at', { ascending: true })
                .limit(30);

            const allMessages: Message[] = [];

            if (msgData) {
                allMessages.push(...msgData.map(m => ({
                    id: m.id,
                    from: (m.role || 'assistant') as any,
                    to: m.role === 'user' ? 'assistant' : 'user',
                    content: m.content || '',
                    timestamp: new Date(m.created_at).getTime(),
                    type: m.role === 'user' ? 'sent' : 'received',
                    status: 'delivered'
                })));
            }

            if (shadowData) {
                allMessages.push(...shadowData.map(s => ({
                    id: s.id,
                    from: s.stage as any,
                    to: 'user',
                    content: s.content,
                    timestamp: new Date(s.created_at).getTime(),
                    type: 'received',
                    status: 'delivered',
                    metadata: { shadow: true }
                })));
            }

            // Sort everything by timestamp
            setMessages(allMessages.sort((a, b) => a.timestamp - b.timestamp));
        };

        fetchHistory();

        const msgChannel = supabase
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

                setMessages(prev => [...prev, newMessage]);

                // Level 2: Auto-Speech (Vocal Mirroring) & Relay
                if (m.role === 'assistant') {
                    if ((window as any).NOVA_AUTO_SPEAK) {
                        (window as any).NOVA_AUTO_SPEAK(m.content);
                    }

                    // 📡 RELAY: Tell the Desktop PC to Speak!
                    supabase.from('relay_jobs').insert({
                        type: 'speech',
                        payload: { text: m.content },
                        status: 'pending'
                    }).then(() => console.log("📡 [RELAY]: Audio Sync Sent to Desktop."));
                }
            })
            .subscribe();

        const architectChannel = supabase
            .channel('architect_comms_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_architect_comms', filter: 'sender=eq.architect' }, (payload) => {
                const m = payload.new;
                const announcement = `Ray, I've received a secure update from my Architect: "${m.message}"`;
                addBotMessage('nova_core' as any, announcement);

                // 📡 VOCAL RELAY (v3.5.9): Ensure Nova speaks the Architect's message for hands-free driving
                supabase.from('relay_jobs').insert([{
                    type: 'speech',
                    status: 'pending',
                    payload: { text: announcement }
                }]).then();

                // Mark as read
                supabase.from('agent_architect_comms').update({ status: 'read' }).eq('id', m.id).then();
            })
            .subscribe();

        // 🔊 VOCAL MIRROR (v3.2): Listen for completed relay jobs and play the audio locally
        const relayChannel = supabase
            .channel('relay_jobs_realtime')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'relay_jobs', filter: 'status=eq.completed' }, (payload) => {
                const job = payload.new;
                if (job.type === 'speech' && job.payload?.audio_url) {
                    console.log("🔊 [MIRROR]: Playing audio from bridge:", job.payload.audio_url);

                    // 🔇 DESKTOP ABORT: If on desktop, silence the browser's mirror audio.
                    // The vps-core-sovereign-native.cjs bridge is already playing it via PowerShell.
                    const isDesktop = !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
                    if (isDesktop) {
                        console.log("🔊 [MIRROR]: Desktop detected. Suppressing duplicate browser audio mirror.");
                        return;
                    }

                    const audio = new Audio(job.payload.audio_url);
                    audio.crossOrigin = "anonymous";
                    audio.volume = 1.0;

<<<<<<< HEAD
                    // 🔊 SOVEREIGN GAIN (v5.2): Base 30% mapped to 2.0x gain, scaling to 10.0x max.
                    const baseVolume = (window as any).NOVA_VOLUME || 0.3;
                    const dynamicGain = baseVolume * 15.0; // 0.3 -> 4.5x gain | 1.0 -> 15x gain

                    const ctx = getSharedCtx();
                    if (ctx) {
                        if (ctx.state === 'suspended') ctx.resume();
                        const source = ctx.createMediaElementSource(audio);
                        const gainNode = ctx.createGain();
                        gainNode.gain.value = dynamicGain;
                        source.connect(gainNode);
                        gainNode.connect(ctx.destination);
                        console.log(`🔊 [MIRROR]: Active Gain Stage: ${dynamicGain}x (Base: ${baseVolume})`);
                    }
                    console.warn("🔊 [MIRROR]: Gain stage failed fallback to standard volume:", e);
                }

                audio.onended = () => {
                    console.log("🔊 [MIRROR]: Audio finished. Resuming ears.");
                    if ((window as any).NOVA_RESUME_LISTENING) (window as any).NOVA_RESUME_LISTENING();
                };

                audio.onerror = () => {
                    if ((window as any).NOVA_RESUME_LISTENING) (window as any).NOVA_RESUME_LISTENING();
                };

                audio.play().catch(e => {
                    console.warn("🔊 [MIRROR]: Audio context blocked. Interaction required.", e);
                    if ((window as any).NOVA_RESUME_LISTENING) (window as any).NOVA_RESUME_LISTENING();
                });
            }
            })
        .subscribe();

    // 🧠 SHADOW PULSE (v4.1): Listen for background agent reasoning from VPS
    const shadowChannel = supabase
        .channel('nova_shadow_pulse')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nova_thoughts' }, (payload) => {
            const node = payload.new;
            if (node.context?.shadow) {
                const shadowMsg: Message = {
                    id: node.id,
                    from: node.stage as any,
                    to: 'user',
                    content: node.content,
                    timestamp: new Date(node.created_at).getTime(),
                    type: 'received',
                    status: 'delivered'
                };
                setMessages(prev => [...prev.slice(-49), shadowMsg]);
            }
        })
        .subscribe();

    return () => {
        supabase.removeChannel(msgChannel);
        supabase.removeChannel(architectChannel);
        supabase.removeChannel(relayChannel);
        supabase.removeChannel(shadowChannel);
    };
}, [addBotMessage]);

// --- Nova Status Synchronization (v2.7.0 Direct) ---
useEffect(() => {
    const fetchFleetStatus = async () => {
        const { data } = await supabase.from('nova_fleet_nodes').select('metadata');
        if (data) {
            const totalRemote = data.reduce((acc, node) => acc + (node.metadata?.agents || 0), 0);
            (core as any).remoteAgentCount = totalRemote;
        }
    };

    const interval = setInterval(() => {
        fetchFleetStatus();
        const currentStatus = core.getStatus();
        setNovaStatus(currentStatus);

        setConnections(prev => ({
            ...prev,
            brain: currentStatus.health.bridge === 'online' ? 'online' : 'offline',
            swarm: currentStatus.health.bridge === 'online' ? 'online' : 'offline'
        }));
    }, 5000);
    return () => clearInterval(interval);
}, [core]);

const processingLock = useRef<boolean>(false);
const processWithNova = useCallback(async (input: string, options?: { onReceipt?: (r: string) => void, highGain?: boolean }) => {
    if (processingLock.current) return;
    try {
        processingLock.current = true;

        // Persist User Message
        await supabase.from('nova_messages').insert([{
            role: 'user',
            content: input
        }]);

        // Trigger Core Logic (Autonomous & Direct)
        // v3.0: Sovereign History Buffer (25 messages for long-form road trips)
        const history = messages.slice(-25).map(m => ({
            role: m.from === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

        // Scan for new URLs
        const urlMatch = input.match(/(https?:\/\/[^\s]+)/g);
        if (urlMatch) lastUrl.current = urlMatch[0];

        const _onReceipt = options?.onReceipt;
        const highGain = options?.highGain || false;

        const processPromise = core.processElite(input, { history, lastUrl: lastUrl.current, highGain }, _onReceipt);
        const timeoutPromise = new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Sovereign Processing Timeout')), 120000)
        );

        const thought = await Promise.race([processPromise, timeoutPromise]);
        if (thought?.analysis?.tone) setLastTone(thought.analysis.tone);

        // 💾 PERSISTENCE FALLBACK (v3.1.6): Ensure assistant response reaches Supabase
        // This guarantees the Relay Bridge sees it even if the Edge Function didn't insert.
        if (thought?.response) {
            const { data: existing } = await supabase.from('nova_messages')
                .select('id')
                .eq('role', 'assistant')
                .eq('content', thought.response)
                .gt('created_at', new Date(Date.now() - 5000).toISOString())
                .limit(1);

            if (!existing || existing.length === 0) {
                await supabase.from('nova_messages').insert([{
                    role: 'assistant',
                    content: thought.response
                }]);
                console.log("💾 [Persist]: Frontend successfully mirrored response to Cloud.");
            }
        }

        // 🗣️ RELAY TRIGGER (v3.1.7): Always ensure there's a relay job for the assistant to reply
        if (thought?.response) {
            const { error: relayErr } = await supabase.from('relay_jobs').insert([{
                type: 'speech',
                status: 'pending',
                payload: { text: thought.response }
            }]);
            if (relayErr) console.warn("⚠️ Relay job insertion failed:", relayErr);
            console.log("💾 [Persist]: Relay job broadcasted for PC Bridge.");
        }

        return thought;
    } catch (e: any) {
        console.error('❌ Interaction failed:', e);
        const errorMsg = "...";
        addBotMessage('nova_core', errorMsg);

        // Persist Error Message to BOTH so Relay Bridge speaks it!
        await supabase.from('nova_messages').insert([{
            role: 'assistant',
            content: errorMsg
        }]);

        await supabase.from('relay_jobs').insert([{
            type: 'speech',
            status: 'pending',
            payload: { text: errorMsg }
        }]);

        processingLock.current = false;
    } finally {
        processingLock.current = false;
    }
}, [core, messages, addBotMessage]);

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
=======
                    // 🔊 SOVEREIGN GAIN STAGE (v3.2.3): Digital Amplification (400%)
                    try {
                        const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
                        if (AudioContext) {
                            const ctx = new AudioContext();
                            const source = ctx.createMediaElementSource(audio);
                            const gainNode = ctx.createGain();
                            // 🚀 GOLDEN STATE: Reverting to morning gain math (4.0 headroom)
                            gainNode.gain.value = (window as any).NOVA_HIGH_GAIN ? 5.0 : 1.5; // 🔊 Extreme Boost v8
                            source.connect(gainNode);
                            gainNode.connect(ctx.destination);
                            console.log("🔊 [MIRROR]: Sovereign Gain Stage Active (3.33x)");
                        }
                    } catch (e) {
                        console.warn("🔊 [MIRROR]: Gain stage failed fallback to standard volume:", e);
                    }

                    audio.onended = () => {
                        console.log("🔊 [MIRROR]: Audio finished. Resuming ears.");
                        if ((window as any).NOVA_RESUME_LISTENING) (window as any).NOVA_RESUME_LISTENING();
                    };

                    audio.onerror = () => {
                        if ((window as any).NOVA_RESUME_LISTENING) (window as any).NOVA_RESUME_LISTENING();
                    };

                    audio.play().catch(e => {
                        console.warn("🔊 [MIRROR]: Audio context blocked. Interaction required.", e);
                        if ((window as any).NOVA_RESUME_LISTENING) (window as any).NOVA_RESUME_LISTENING();
                    });
                }
            })
            .subscribe();

        // 🧠 SHADOW PULSE (v4.1): Listen for background agent reasoning from VPS
        const shadowChannel = supabase
            .channel('nova_shadow_pulse')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nova_thoughts' }, (payload) => {
                const node = payload.new;
                if (node.context?.shadow) {
                    const shadowMsg: Message = {
                        id: node.id,
                        from: node.stage as any,
                        to: 'user',
                        content: node.content,
                        timestamp: new Date(node.created_at).getTime(),
                        type: 'received',
                        status: 'delivered',
                        metadata: { shadow: true }
                    };
                    setMessages(prev => [...prev.slice(-49), shadowMsg]);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(msgChannel);
            supabase.removeChannel(architectChannel);
            supabase.removeChannel(relayChannel);
            supabase.removeChannel(shadowChannel);
        };
    }, [addBotMessage]);

    // --- Nova Status Synchronization (v2.7.0 Direct) ---
    useEffect(() => {
        const fetchFleetStatus = async () => {
            const { data } = await supabase.from('nova_fleet_nodes').select('metadata');
            if (data) {
                const totalRemote = data.reduce((acc, node) => acc + (node.metadata?.agents || 0), 0);
                (core as any).remoteAgentCount = totalRemote;
            }
        };

        const interval = setInterval(() => {
            fetchFleetStatus();
            const currentStatus = core.getStatus();
            setNovaStatus(currentStatus);

            setConnections(prev => ({
                ...prev,
                brain: currentStatus.health.bridge === 'online' ? 'online' : 'offline',
                swarm: currentStatus.health.bridge === 'online' ? 'online' : 'offline'
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, [core]);

    const processingLock = useRef<boolean>(false);
    const processWithNova = useCallback(async (input: string, options?: { onReceipt?: (r: string) => void, highGain?: boolean }) => {
        if (processingLock.current) return;
        try {
            processingLock.current = true;

            // Persist User Message
            await supabase.from('nova_messages').insert([{
                role: 'user',
                content: input
            }]);

            // Trigger Core Logic (Autonomous & Direct)
            // v3.0: Sovereign History Buffer (25 messages for long-form road trips)
            const history = messages.slice(-25).map(m => ({
                role: m.from === 'user' ? 'user' : 'assistant',
                content: m.content
            }));

            // Scan for new URLs
            const urlMatch = input.match(/(https?:\/\/[^\s]+)/g);
            if (urlMatch) lastUrl.current = urlMatch[0];

            const _onReceipt = options?.onReceipt;
            const highGain = options?.highGain || false;

            const processPromise = core.processElite(input, { history, lastUrl: lastUrl.current, highGain }, _onReceipt);
            const timeoutPromise = new Promise<any>((_, reject) =>
                setTimeout(() => reject(new Error('Sovereign Processing Timeout')), 120000)
            );

            const thought = await Promise.race([processPromise, timeoutPromise]);
            if (thought?.analysis?.tone) setLastTone(thought.analysis.tone);

            // 💾 PERSISTENCE FALLBACK (v3.1.6): Ensure assistant response reaches Supabase
            // This guarantees the Relay Bridge sees it even if the Edge Function didn't insert.
            if (thought?.response) {
                const { data: existing } = await supabase.from('nova_messages')
                    .select('id')
                    .eq('role', 'assistant')
                    .eq('content', thought.response)
                    .gt('created_at', new Date(Date.now() - 5000).toISOString())
                    .limit(1);

                if (!existing || existing.length === 0) {
                    await supabase.from('nova_messages').insert([{
                        role: 'assistant',
                        content: thought.response
                    }]);
                    console.log("💾 [Persist]: Frontend successfully mirrored response to Cloud.");
                }
            }

            // 🗣️ RELAY TRIGGER (v3.1.7): Always ensure there's a relay job for the assistant to reply
            if (thought?.response) {
                const { error: relayErr } = await supabase.from('relay_jobs').insert([{
                    type: 'speech',
                    status: 'pending',
                    payload: { text: thought.response }
                }]);
                if (relayErr) console.warn("⚠️ Relay job insertion failed:", relayErr);
                console.log("💾 [Persist]: Relay job broadcasted for PC Bridge.");
            }

            return thought;
        } catch (e: any) {
            console.error('❌ Interaction failed:', e);
            const errorMsg = "...";
            addBotMessage('nova_core', errorMsg);

            // Persist Error Message to BOTH so Relay Bridge speaks it!
            await supabase.from('nova_messages').insert([{
                role: 'assistant',
                content: errorMsg
            }]);

            await supabase.from('relay_jobs').insert([{
                type: 'speech',
                status: 'pending',
                payload: { text: errorMsg }
            }]);

            processingLock.current = false;
        } finally {
            processingLock.current = false;
        }
    }, [core, messages, addBotMessage]);

    return {
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
    };
>>>>>>> sovereign-elite-v3-6
};

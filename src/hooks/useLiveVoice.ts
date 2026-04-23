import { useState, useCallback, useRef, useEffect } from 'react';
import type { NovaCore } from '../core/NovaCore';

/**
 * useLiveVoice Hook (v14.1)
 * Managed state and audio processing for the Sovereign Link.
 */
export const useLiveVoice = (core: NovaCore) => {
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [volume, setVolumeState] = useState(() => {
        const saved = localStorage.getItem("nova_voice_volume");
        return saved ? parseFloat(saved) : 1.0;
    });

    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const playbackQueueRef = useRef<Int16Array[]>([]);
    const playingRef = useRef(false);
    const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const interruptCooldownRef = useRef({ active: false, timer: null as any });

    const setVolume = useCallback((val: number) => {
        setVolumeState(val);
        localStorage.setItem("nova_voice_volume", val.toString());
        if (gainNodeRef.current && audioContextRef.current) {
            gainNodeRef.current.gain.setTargetAtTime(val, audioContextRef.current.currentTime, 0.05);
        }
    }, []);

    const playNextInQueue = () => {
        if (playbackQueueRef.current.length === 0) {
            playingRef.current = false;
            return;
        }

        playingRef.current = true;
        const chunk = playbackQueueRef.current.shift();
        if (!chunk || !audioContextRef.current) return;

        const buffer = audioContextRef.current.createBuffer(1, chunk.length, 24000);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < chunk.length; i++) {
            data[i] = chunk[i] / 32768;
        }

        const node = audioContextRef.current.createBufferSource();
        node.buffer = buffer;

        if (!gainNodeRef.current) {
            const context = audioContextRef.current;
            gainNodeRef.current = context.createGain();
            gainNodeRef.current.gain.value = volume;
            gainNodeRef.current.connect(context.destination);
        }

        node.connect(gainNodeRef.current);
        activeSourceRef.current = node;
        node.onended = () => {
            activeSourceRef.current = null;
            playNextInQueue();
        };
        node.start();
    };

    /**
     * START LIVE SESSION
     */
    const startLive = useCallback(async () => {
        try {
            setLastError(null);
            setIsConnecting(true);
            console.log("🎙️ [useLiveVoice] Initializing Hotfix Bridge...");

            // 1. Request Microphone
            try {
                streamRef.current = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                        sampleRate: 24000
                    }
                });
            } catch (e: any) {
                console.error("❌ Mic Denied:", e);
                throw new Error("Microphone Access Denied. Check permissions.");
            }

            // 2. Setup Audio Context
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 24000,
            });

            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            // 3. Persistent Gain Node
            gainNodeRef.current = audioContextRef.current.createGain();
            gainNodeRef.current.gain.value = volume;
            gainNodeRef.current.connect(audioContextRef.current.destination);

            // 4. Connect to Engine
            await core.startLiveSession();

            // 5. Setup Input Processor
            sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
                const input = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(input.length);
                for (let i = 0; i < input.length; i++) {
                    const s = Math.max(-1, Math.min(1, input[i]));
                    pcm16[i] = s < 0 ? s * 32768 : s * 32767;
                }

                const binary = String.fromCharCode(...new Uint8Array(pcm16.buffer));
                core.liveEngine.sendAudio(btoa(binary));
            };

            sourceRef.current.connect(processorRef.current);
            const silence = audioContextRef.current.createGain();
            silence.gain.value = 0;
            processorRef.current.connect(silence);
            silence.connect(audioContextRef.current.destination);

            // 6. Setup Output & Telemetry Listeners
            core.liveEngine.onAudio((base64) => {
                if (interruptCooldownRef.current.active) return;
                try {
                    const bin = atob(base64);
                    const bytes = new Uint8Array(bin.length);
                    for (let i = 0; i < bin.length; i++) {
                        bytes[i] = bin.charCodeAt(i);
                    }
                    const alignedLength = Math.floor(bytes.length / 2) * 2;
                    const finalBuffer = alignedLength === bytes.length ? bytes.buffer : bytes.buffer.slice(0, alignedLength);
                    playbackQueueRef.current.push(new Int16Array(finalBuffer));
                    if (!playingRef.current) playNextInQueue();
                } catch (e) { }
            });

            // 7. Barge-In Listener
            core.liveEngine.onInterrupt(() => {
                console.log("🛑 [useLiveVoice] Interrupt Signal! Flushing Audio...");
                playbackQueueRef.current = [];
                activeSourceRef.current?.stop();
                activeSourceRef.current = null;
                playingRef.current = false;
                interruptCooldownRef.current.active = true;
                if (interruptCooldownRef.current.timer) clearTimeout(interruptCooldownRef.current.timer);
                interruptCooldownRef.current.timer = setTimeout(() => {
                    interruptCooldownRef.current.active = false;
                }, 500);
            });

            // 8. Reconnection Logic
            core.liveEngine.onStatus((state) => {
                if (state === 'disconnected' && isLiveActive) {
                    console.log("🔄 [useLiveVoice] Link dropped. Reconnecting...");
                    startLive();
                } else if (state === 'error') {
                    setLastError("Sovereign Link encountered a cortex error.");
                }
            });

            setIsLiveActive(true);
            setIsConnecting(false);
            console.log("🚀 [useLiveVoice] Bridge Established. Gain:", volume);

        } catch (error: any) {
            console.error("❌ Fatal Voice Error:", error);
            setLastError(error.message || "Failed to establish Sovereign Link.");
            setIsConnecting(false);
            if (!isLiveActive) stopLive();
        }
    }, [core, volume, isLiveActive]);

    const stopLive = useCallback(() => {
        setIsLiveActive(false);
        core.liveEngine.disconnect();
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current.onaudioprocess = null;
        }
        if (sourceRef.current) sourceRef.current.disconnect();
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        processorRef.current = null;
        sourceRef.current = null;
        streamRef.current = null;
        audioContextRef.current = null;
        playbackQueueRef.current = [];
        playingRef.current = false;
    }, [core]);

    return {
        isLiveActive,
        isConnecting,
        lastError,
        volume,
        setVolume,
        startLive,
        stopLive
    };
};

import { useState, useCallback, useRef } from "react";
import { NovaCore } from "../core/NovaCore";

/**
 * useLiveVoice: SOVEREIGN LIVE BRIDGE (v15.0)
 * -----------------------------------------
 * Direct Web Audio implementation with Gain control for volume.
 */
export function useLiveVoice(core: NovaCore) {
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [volume, setVolumeState] = useState(() => {
        const saved = localStorage.getItem("nova_voice_volume");
        return saved ? parseFloat(saved) : 1.0;
    });

    // Engine Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    // State Refs
    const playbackQueueRef = useRef<Int16Array[]>([]);
    const playingRef = useRef(false);

    /**
     * UPDATE GAIN
     */
    const setVolume = useCallback((val: number) => {
        setVolumeState(val);
        localStorage.setItem("nova_voice_volume", val.toString());
        if (gainNodeRef.current && audioContextRef.current) {
            // Smooth volume transition (50ms) to avoid clicks
            gainNodeRef.current.gain.setTargetAtTime(val, audioContextRef.current.currentTime, 0.05);
        }
    }, []);

    /**
     * QUEUED AUDIO PLAYBACK
     */
    const playNextInQueue = () => {
        const context = audioContextRef.current;
        if (!context || playbackQueueRef.current.length === 0) {
            playingRef.current = false;
            return;
        }

        playingRef.current = true;
        const chunk = playbackQueueRef.current.shift()!;

        // Convert Int16 to Float32
        const float32 = new Float32Array(chunk.length);
        for (let i = 0; i < chunk.length; i++) {
            float32[i] = chunk[i] / 32768.0;
        }

        const buffer = context.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);

        const node = context.createBufferSource();
        node.buffer = buffer;

        // Ensure GainNode exists and is connected
        if (!gainNodeRef.current) {
            gainNodeRef.current = context.createGain();
            gainNodeRef.current.gain.value = volume;
            gainNodeRef.current.connect(context.destination);
        }

        node.connect(gainNodeRef.current);
        node.onended = () => playNextInQueue();
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
            streamRef.current = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 1,
                    sampleRate: 24000
                }
            });

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
            processorRef.current = audioContextRef.current.createScriptProcessor(512, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
                if (playingRef.current) return;

                const input = e.inputBuffer.getChannelData(0);
                const buf = new Int16Array(input.length);
                for (let i = 0; i < input.length; i++) {
                    const s = Math.max(-1, Math.min(1, input[i]));
                    buf[i] = s < 0 ? s * 32768 : s * 32767;
                }

                const uint8Arr = new Uint8Array(buf.buffer);
                let binary = "";
                for (let i = 0; i < uint8Arr.length; i++) {
                    binary += String.fromCharCode(uint8Arr[i]);
                }

                core.liveEngine.sendAudio(btoa(binary));
            };

            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            // 6. Setup Output Listener
            core.liveEngine.onAudio((base64) => {
                const bin = atob(base64);
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) {
                    bytes[i] = bin.charCodeAt(i);
                }
                playbackQueueRef.current.push(new Int16Array(bytes.buffer));

                if (!playingRef.current) {
                    playNextInQueue();
                }
            });

            setIsLiveActive(true);
            setIsConnecting(false);
            console.log("🚀 [useLiveVoice] Bridge Established. Gain:", volume);
        } catch (err: any) {
            console.error("❌ [useLiveVoice] Critical Failure:", err);
            setLastError(err.message || "Audio fail");
            setIsConnecting(false);
            stopLive();
        }
    }, [core, volume]);

    const stopLive = useCallback(() => {
        core.stopLiveSession();
        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        streamRef.current?.getTracks().forEach(t => t.stop());
        try { audioContextRef.current?.close(); } catch (e) { }
        gainNodeRef.current = null;
        playingRef.current = false;
        playbackQueueRef.current = [];
        setIsLiveActive(false);
    }, [core]);

    return { isLiveActive, isConnecting, lastError, startLive, stopLive, volume, setVolume };
}

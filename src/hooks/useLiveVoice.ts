import { useState, useEffect, useCallback, useRef } from "react";
import { NovaCore } from "../core/NovaCore";

/**
 * useLiveVoice: SOVEREIGN LIVE BRIDGE (v10.0)
 * -----------------------------------------
 * Low-latency, bidirectional audio streaming between the browser and 
 * Gemini 3.1 Flash Live. Bypasses standard STT/TTS.
 */
export function useLiveVoice(core: NovaCore) {
    const [isLiveActive, setIsLiveActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const playbackQueue = useRef<Int16Array[]>([]);
    const isPlaying = useRef(false);

    /**
     * START LIVE SESSION
     * Connects the engine and starts the mic capture.
     */
    const startLive = useCallback(async () => {
        try {
            setIsConnecting(true);
            console.log("🎙️ [useLiveVoice] Initializing Live session...");
            await core.startLiveSession();
            console.log("🎙️ [useLiveVoice] Core Session started. Initializing Audio Context...");

            // Setup Audio Context (16kHz Mono for Gemini Live)
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000,
            });

            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            console.log("🎙️ [useLiveVoice] Requesting Microphone permissions...");
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            console.log("🎙️ [useLiveVoice] Mic access granted.");
            sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);

            // Note: ScriptProcessor is deprecated but widely compatible for raw PCM mining.
            // In v10.1 we might transition to AudioWorklets.
            processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

            processorRef.current.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmData = convertFloat32ToInt16(inputData);
                core.liveEngine.sendAudio(new Uint8Array(pcmData.buffer));
            };

            sourceRef.current.connect(processorRef.current);
            processorRef.current.connect(audioContextRef.current.destination);

            // Handle Incoming Audio from Gemini
            core.liveEngine.onAudio((base64Chunk) => {
                const binary = atob(base64Chunk);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                const int16Array = new Int16Array(bytes.buffer);
                playbackQueue.current.push(int16Array);
                if (!isPlaying.current) playNextInQueue();
            });

            setIsLiveActive(true);
            setIsConnecting(false);
            console.log("🚀 [useLiveVoice] Live session ACTIVE.");
        } catch (err) {
            console.error("❌ [useLiveVoice] Failed to start Live:", err);
            setIsConnecting(false);
            stopLive();
        }
    }, [core]);

    const stopLive = useCallback(() => {
        console.log("💤 [useLiveVoice] Stopping Live session...");
        core.stopLiveSession();

        processorRef.current?.disconnect();
        sourceRef.current?.disconnect();
        streamRef.current?.getTracks().forEach(t => t.stop());
        audioContextRef.current?.close();

        setIsLiveActive(false);
    }, [core]);

    /**
     * QUEUED AUDIO PLAYBACK
     * Ensures smooth streaming without pops/clicks.
     */
    const playNextInQueue = () => {
        if (playbackQueue.current.length === 0 || !audioContextRef.current) {
            isPlaying.current = false;
            return;
        }

        isPlaying.current = true;
        const chunk = playbackQueue.current.shift()!;
        const float32 = convertInt16ToFloat32(chunk);

        const buffer = audioContextRef.current.createBuffer(1, float32.length, 16000);
        buffer.getChannelData(0).set(float32);

        const node = audioContextRef.current.createBufferSource();
        node.buffer = buffer;
        node.connect(audioContextRef.current.destination);
        node.onended = () => playNextInQueue();
        node.start();
    };

    return { isLiveActive, isConnecting, startLive, stopLive };
}

// -- UTILS --

function convertFloat32ToInt16(buffer: Float32Array): Int16Array {
    let l = buffer.length;
    const buf = new Int16Array(l);
    while (l--) {
        buf[l] = Math.min(1, buffer[l]) * 0x7FFF;
    }
    return buf;
}

function convertInt16ToFloat32(buffer: Int16Array): Float32Array {
    let l = buffer.length;
    const buf = new Float32Array(l);
    while (l--) {
        buf[l] = buffer[l] / 0x8000;
    }
    return buf;
}

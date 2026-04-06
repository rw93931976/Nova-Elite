import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useSpeech: LEVEL 3 Sovereign Recovery (v8.8.3)
 * Priority: Mobile Chrome Reliability + Hard-Barge Suppression
 */
export const useSpeech = (onResult: (text: string) => void, options?: { onBargeIn?: () => void }) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const isSpeakingRef = useRef(false);
    const shouldListenRef = useRef(false);
    const debounceTimerRef = useRef<any>(null);
    const onResultRef = useRef(onResult);
    const wakeLockRef = useRef<any>(null);
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    const initRecognition = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return null;

        const recognizer = new SpeechRecognition();
        recognizer.continuous = true;
        recognizer.interimResults = true;
        recognizer.lang = 'en-US';

        recognizer.onstart = () => {
            console.log('[useSpeech] Recognition Started');
            setIsListening(true);
            (window as any).isNovaListening = true;
        };

        recognizer.onresult = (event: any) => {
            const isSpeaking = (window as any).isNovaSpeaking || isSpeakingRef.current;
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

            const results = Array.from(event.results);
            const latestResult = results[event.resultIndex];
            const text = (latestResult as any)[0].transcript.trim();

            // 🛡️ ECHO GUARD (v8.8.4): Distinguish Ray from Nova
            const lastResponse = (window as any).lastNovaResponse?.toLowerCase() || "";
            const normalizedText = text.toLowerCase();
            const words = normalizedText.split(/\s+/);
            const lastResponseWords = lastResponse.split(/\s+/);
            const overlap = words.length > 0 ? (words.filter(w => lastResponseWords.includes(w)).length / words.length) : 0;

            // ⚡ EMERGENCY BARGE-IN (v8.8.4): Kill speech ONLY if it's NOT an echo
            if (isSpeaking && text.length > 0 && overlap < 0.6) {
                console.log('[useSpeech] ⚡ BARGE-IN DETECTED. Killing speech:', text);
                window.speechSynthesis.cancel();
                (window as any).lastNovaResponse = "";
                isSpeakingRef.current = false;
                (window as any).isNovaSpeaking = false;
                if (options?.onBargeIn) options.onBargeIn();
                return;
            } else if (isSpeaking && overlap >= 0.6) {
                console.log(`[useSpeech] Echo ignored [Overlap: ${(overlap * 100).toFixed(0)}%]:`, text);
                return;
            }

            if ((latestResult as any).isFinal) {
                console.log('[useSpeech] Final intent:', text);
                debounceTimerRef.current = setTimeout(() => {
                    const isStillSpeaking = (window as any).isNovaSpeaking || isSpeakingRef.current;
                    if (text.length > 1 && !isStillSpeaking) {
                        onResultRef.current(text);
                    }
                }, 1400);
            }
        };

        recognizer.onerror = (event: any) => {
            console.error('[useSpeech] Recognition Error:', event.error);
            if (event.error === 'no-speech' || event.error === 'network') {
                if (shouldListenRef.current) {
                    setTimeout(() => {
                        try { recognitionRef.current?.start(); } catch (e) { }
                    }, 200);
                }
            } else {
                setIsListening(false);
            }
        };

        recognizer.onend = () => {
            console.log('[useSpeech] Recognition Ended');
            setIsListening(false);
            (window as any).isNovaListening = false;

            if (shouldListenRef.current) {
                setTimeout(() => {
                    if (shouldListenRef.current) {
                        try { recognitionRef.current?.start(); } catch (e) { }
                    }
                }, 200);
            }
        };

        return recognizer;
    };

    // 🔋 BACKGROUND SOVEREIGNTY: Wake Lock & Silent Audio
    useEffect(() => {
        const handleWakeLock = async () => {
            if (shouldListenRef.current && 'wakeLock' in navigator) {
                try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (e) { }
            } else if (!shouldListenRef.current && wakeLockRef.current) {
                wakeLockRef.current.release().then(() => { wakeLockRef.current = null; });
            }
        };

        const handleSilentLoop = () => {
            if (shouldListenRef.current) {
                if (!silentAudioRef.current) {
                    const silentSrc = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQL6AAAAAAA=";
                    silentAudioRef.current = new Audio(silentSrc);
                    silentAudioRef.current.loop = true;
                    silentAudioRef.current.volume = 0.01;
                }
                silentAudioRef.current.play().catch(() => { });
            } else if (silentAudioRef.current) {
                silentAudioRef.current.pause();
            }
        };

        handleWakeLock();
        handleSilentLoop();

        const onVisibility = () => { if (document.visibilityState === 'visible') handleWakeLock(); };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            wakeLockRef.current?.release();
            if (silentAudioRef.current) {
                silentAudioRef.current.pause();
                silentAudioRef.current = null;
            }
        };
    }, [shouldListenRef.current]);

    // 🔬 STT PULSE (v8.9.9.6): Silenced Brute-Force
    // Removed setInterval pulse to stop browser beep spam. 
    // Restarts are now managed via the onend event for a silent, natural flow.
    useEffect(() => {
        if (shouldListenRef.current && !isListening && !isSpeakingRef.current) {
            try {
                if (!recognitionRef.current) recognitionRef.current = initRecognition();
                recognitionRef.current.start();
            } catch (e) { }
        }
    }, [isListening, shouldListenRef.current]);

    // 🛡️ CONTINUOUS MIC-LOCK (v8.9.9.9): Trick OS to prevent beep on restart
    const micStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const lockMic = async () => {
            if (shouldListenRef.current && !micStreamRef.current) {
                try {
                    micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                    console.log('[useSpeech] 🔒 Mic Lock Engaged (Sovereign Silence)');
                } catch (e) { console.error('[useSpeech] Mic Lock Failed:', e); }
            } else if (!shouldListenRef.current && micStreamRef.current) {
                micStreamRef.current.getTracks().forEach(t => t.stop());
                micStreamRef.current = null;
            }
        };

        lockMic();
        return () => {
            micStreamRef.current?.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
        };
    }, [shouldListenRef.current]);

    const toggleListening = useCallback(() => {
        shouldListenRef.current = !shouldListenRef.current;
        if (shouldListenRef.current) {
            if (!recognitionRef.current) recognitionRef.current = initRecognition();
            try { recognitionRef.current.start(); } catch (e) { }
        } else {
            try { recognitionRef.current?.stop(); } catch (e) { }
        }
    }, []);

    const speak = useCallback((text: string, vol = 0.5, pitch = 1.0, rate = 0.95) => {
        const synth = window.speechSynthesis;
        if (!synth) return;

        (window as any).lastNovaResponse = text;
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = vol;
        utterance.pitch = pitch;
        utterance.rate = rate;

        utterance.onstart = () => {
            isSpeakingRef.current = true;
            (window as any).isNovaSpeaking = true;
        };

        utterance.onend = () => {
            setTimeout(() => {
                isSpeakingRef.current = false;
                (window as any).isNovaSpeaking = false;
            }, 200);
        };

        const loadVoices = () => {
            const voices = synth.getVoices();
            const preferred = voices.find(v => v.name.includes("Google US English")) || voices[0];
            if (preferred) utterance.voice = preferred;
        };

        if (synth.getVoices().length === 0) {
            synth.onvoiceschanged = loadVoices;
        } else {
            loadVoices();
        }

        setTimeout(() => { synth.speak(utterance); }, 100);
    }, []);

    const unlockAudio = useCallback(() => {
        const synth = window.speechSynthesis;
        if (synth) {
            const ut = new SpeechSynthesisUtterance('');
            ut.volume = 0;
            synth.speak(ut);
        }
    }, []);

    return {
        isListening,
        toggleListening,
        speak,
        unlockAudio,
        pauseListening: () => recognitionRef.current?.stop(),
        resumeListening: () => recognitionRef.current?.start(),
        reinitialize: () => {
            recognitionRef.current = initRecognition();
            recognitionRef.current?.start();
        }
    };
};

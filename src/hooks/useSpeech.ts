import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useSpeech: LEVEL 3 Sovereign Recovery (v8.8.3)
 * Priority: Mobile Chrome Reliability + Hard-Barge Suppression
 */
export const useSpeech = (onResult: (text: string) => void, options?: { onBargeIn?: () => void }) => {
    const [isListening, setIsListening] = useState(false);
    const [shouldListen, setShouldListen] = useState(false);
    const recognitionRef = useRef<any>(null);
    const isSpeakingRef = useRef(false);
    const shouldListenRef = useRef(false);
    const debounceTimerRef = useRef<any>(null);
    const onResultRef = useRef(onResult);
    const wakeLockRef = useRef<any>(null);
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);

    // Sync ref for non-reactive access
    useEffect(() => { shouldListenRef.current = shouldListen; }, [shouldListen]);

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

            // ⚡ EMERGENCY BARGE-IN (v9.7-SOVEREIGN): Robust Noise Rejection
            const speechStartTime = (window as any).novaSpeechStartTime || 0;
            const timeInSpeech = Date.now() - speechStartTime;

            // Rejection Criteria:
            // 1. Grace Period: First 600ms of speech are noise-immune to prevent mic-click triggers.
            // 2. Fragment Filter: Ignore single words or fragments < 6 chars.
            // 3. Echo Check: Ensure it's not a hallucinated echo (overlap check).
            const isTooShort = text.length < 6 && !text.includes(" ");
            const inGracePeriod = timeInSpeech < 600;

            if (isSpeaking && !inGracePeriod && !isTooShort && overlap < 0.6) {
                console.log('[useSpeech] ⚡ GENUINE BARGE-IN DETECTED. Killing speech:', text);
                window.speechSynthesis.cancel();
                (window as any).lastNovaResponse = "";
                isSpeakingRef.current = false;
                (window as any).isNovaSpeaking = false;
                if (options?.onBargeIn) options.onBargeIn();
                return;
            } else if (isSpeaking) {
                // Log suppressed noise/echo for debugging
                if (inGracePeriod) console.log(`[useSpeech] Barge-in suppressed (Grace Period): ${text}`);
                else if (isTooShort) console.log(`[useSpeech] Barge-in suppressed (Length/Noise): ${text}`);
                else if (overlap >= 0.6) console.log(`[useSpeech] Echo ignored [Overlap: ${(overlap * 100).toFixed(0)}%]:`, text);
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
            // 🛡️ AGGRESSIVE RECOVERY (v9.7-SOVEREIGN): Never stay silent if shouldListen is true
            if (shouldListenRef.current) {
                setTimeout(() => {
                    try { recognitionRef.current?.start(); } catch (e) { }
                }, 400);
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

    // 🔋 BACKGROUND SOVEREIGNTY: Wake Lock & Prevent Screen Sleep
    useEffect(() => {
        const handleWakeLock = async () => {
            if (shouldListen && 'wakeLock' in navigator) {
                try { wakeLockRef.current = await (navigator as any).wakeLock.request('screen'); } catch (e) { }
            } else if (!shouldListen && wakeLockRef.current) {
                wakeLockRef.current.release().then(() => { wakeLockRef.current = null; });
            }
        };

        handleWakeLock();

        const onVisibility = () => { if (document.visibilityState === 'visible') handleWakeLock(); };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            document.removeEventListener('visibilitychange', onVisibility);
            wakeLockRef.current?.release();
        };
    }, [shouldListen]);

    // 🔬 STT PULSE (v8.9.9.6): Silenced Brute-Force
    useEffect(() => {
        if (shouldListen && !isListening && !isSpeakingRef.current) {
            try {
                if (!recognitionRef.current) recognitionRef.current = initRecognition();
                recognitionRef.current.start();
            } catch (e) { }
        }
    }, [isListening, shouldListen]);

    // 🛡️ NO MIC-LOCK (v9.3-SOVEREIGN): Removed failed persistent capture to resolve deadlock
    const toggleListening = useCallback(() => {
        const nextState = !shouldListenRef.current;
        setShouldListen(nextState);

        if (nextState) {
            if (!recognitionRef.current) recognitionRef.current = initRecognition();
            try {
                // Hard reset speech if starting to listen
                window.speechSynthesis.cancel();
                (window as any).isNovaSpeaking = false;
                isSpeakingRef.current = false;
                recognitionRef.current.start();
            } catch (e) { }
        } else {
            try { recognitionRef.current?.stop(); } catch (e) { }
        }
    }, []);


    const speak = useCallback((text: string, vol = 0.5, pitch = 1.0, rate = 0.95) => {
        const synth = window.speechSynthesis;
        if (!synth) return;

        // 🛡️ HANDOVER (v9.3-SOVEREIGN): Stop recognition BEFORE speaking to free hardware
        try { recognitionRef.current?.stop(); } catch (e) { }

        (window as any).lastNovaResponse = text;
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = vol;
        utterance.pitch = pitch;
        utterance.rate = rate;

        utterance.onstart = () => {
            isSpeakingRef.current = true;
            (window as any).isNovaSpeaking = true;
            (window as any).novaSpeechStartTime = Date.now();
        };

        utterance.onend = () => {
            setTimeout(() => {
                isSpeakingRef.current = false;
                (window as any).isNovaSpeaking = false;

                // 🛡️ HANDOVER (v9.3-SOVEREIGN): Resume recognition AFTER speaking
                if (shouldListenRef.current) {
                    try { recognitionRef.current?.start(); } catch (e) { }
                }
            }, 300); // 300ms safety pad for hardware transition
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

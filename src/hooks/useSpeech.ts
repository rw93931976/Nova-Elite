import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useSpeech: LEVEL 3 Sovereign Recovery
 * Priority: Mobile Chrome Reliability + Audio Unlock Gesture
 */
export const useSpeech = (onResult: (text: string) => void, options?: { onBargeIn?: () => void }) => {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const isSpeakingRef = useRef(false); // Global speaking gate
    const shouldListenRef = useRef(false);
    const debounceTimerRef = useRef<any>(null);
    const onResultRef = useRef(onResult);
    const wakeLockRef = useRef<any>(null);
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);

    // v4.5 Sync: External 'Speaking' state for Bridge/Relay support
    useEffect(() => {
        const checkSpeaking = () => {
            const isSpeaking = (window as any).isNovaSpeaking || isSpeakingRef.current;
            // Console spam removed (v8.3.7)
        };
        const interval = setInterval(checkSpeaking, 100);
        return () => clearInterval(interval);
    }, [isListening]);

    // Keep the callback fresh
    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    const initRecognition = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return null;

        const recognizer = new SpeechRecognition();
        recognizer.continuous = false; // Level 5 Mobile Sync: Switch to discrete mode for better Android accuracy
        recognizer.interimResults = true; // Still show interim for responsiveness
        recognizer.lang = 'en-US';

        recognizer.onstart = () => {
            console.log('[useSpeech] Recognition Started (Persistent)');
            setIsListening(true);
            (window as any).isNovaListening = true;
        };

        recognizer.onresult = (event: any) => {
            const isSpeaking = (window as any).isNovaSpeaking || isSpeakingRef.current;

            // Clear any pending debounce timer
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

            const results = Array.from(event.results);
            const latestResult = results[event.resultIndex];
            const text = (latestResult as any)[0].transcript.trim();

            // 🛡️ ECHO GUARD (v8.4.1): Nuclear Suppression
            const lastResponse = (window as any).lastNovaResponse?.toLowerCase() || "";
            const normalizedText = text.toLowerCase();

            // ⚡ EMERGENCY BARGE-IN (v8.8.2): Kill speech on ANY result (Interim or Final)
            if (isSpeaking && normalizedText.length > 0) {
                const words = normalizedText.split(/\s+/);
                const lastResponseWords = lastResponse.split(/\s+/);
                const overlap = words.filter(w => lastResponseWords.includes(w)).length / words.length;

                // Only suppress if it's a high-confidence echo, otherwise it's a Barge-In
                if (overlap < 0.6) {
                    console.log('[useSpeech] ⚡ BARGE-IN DETECTED (Interim). Killing speech:', text);
                    window.speechSynthesis.cancel();
                    (window as any).lastNovaResponse = ""; // Force clear echo guard
                    isSpeakingRef.current = false;
                    (window as any).isNovaSpeaking = false;
                    if (options?.onBargeIn) options.onBargeIn();
                    return; // Stop result processing until she's silent
                } else {
                    console.log(`[useSpeech] Echo ignored [Overlap: ${(overlap * 100).toFixed(0)}%]:`, text);
                    return;
                }
            }

            if ((latestResult as any).isFinal) {
                console.log('[useSpeech] Final intent detected:', text);

                // ⏳ SOVEREIGN DEBOUNCE (v8.3.4)
                debounceTimerRef.current = setTimeout(() => {
                    const isStillSpeaking = (window as any).isNovaSpeaking || isSpeakingRef.current;
                    if (text.length > 1 && !isStillSpeaking) {
                        onResultRef.current(text);
                    }
                }, 1400);
            }
            // Dialect support: "Pay Nova", "Hay Nova", "Hina"
            const isWakeWord = /^(hey|pay|hay|hi|hi\s*na)\s*nova/i.test(normalizedText);
            if (wordCount < 2 && !isWakeWord) {
                console.log('[useSpeech] Fragment ignored (v8.3.8):', text);
                return;
            }
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
    console.log('[useSpeech] Recognition Ended - Pulse check...');
    setIsListening(false);
    (window as any).isNovaListening = false;

    // AUTO-RESTART HEARTBEAT (v8.3.6): Always restart if shouldListen is true
    // Removed !isSpeaking requirement to allow Barge-In to recover if browser stops STT
    if (shouldListenRef.current) {
        setTimeout(() => {
            if (shouldListenRef.current) {
                try {
                    recognitionRef.current?.start();
                } catch (e) {
                    // Already active or error
                }
            }
        }, 200); // Level 5 Mobile Sync: 200ms restart for instant reactivity
    }
};

return recognizer;
    };

// 🔋 BACKGROUND SOVEREIGNTY (v5.8): Screen Wake Lock + Silent Audio Loop
useEffect(() => {
    const handleWakeLock = async () => {
        if (shouldListenRef.current && 'wakeLock' in navigator) {
            try {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            } catch (err) { }
        } else if (!shouldListenRef.current && wakeLockRef.current) {
            wakeLockRef.current.release().then(() => {
                wakeLockRef.current = null;
            });
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

    const onVisibility = () => {
        if (document.visibilityState === 'visible') handleWakeLock();
    };
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

// 🔬 STT PULSE (v5.8)
useEffect(() => {
    const pulse = setInterval(() => {
        const isSpeaking = (window as any).isNovaSpeaking || isSpeakingRef.current;
        if (shouldListenRef.current && !isListening && !isSpeaking) {
            try {
                if (!recognitionRef.current) recognitionRef.current = initRecognition();
                recognitionRef.current.start();
            } catch (e) { }
        }
    }, 5000);
    return () => clearInterval(pulse);
}, [isListening]);

const toggleListening = useCallback(() => {
    if (!shouldListenRef.current) setIsListening(true);
    shouldListenRef.current = !shouldListenRef.current;

    if (shouldListenRef.current) {
        if (!recognitionRef.current) recognitionRef.current = initRecognition();
        try {
            recognitionRef.current.start();
        } catch (e) { }
    } else {
        try {
            recognitionRef.current?.stop();
        } catch (e) { }
    }
}, []);

const reinitialize = useCallback(() => {
    try {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.stop();
        }
    } catch (e) { }

    recognitionRef.current = initRecognition();
    shouldListenRef.current = true;
    try {
        recognitionRef.current.start();
    } catch (e) { }
}, []);

const unlockAudio = useCallback(() => {
    const unlock = () => {
        try {
            const synth = window.speechSynthesis;
            const utteranceClass = (window as any).SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance;
            if (synth && utteranceClass) {
                const ut = new utteranceClass('');
                ut.volume = 0;
                synth.speak(ut);
            }

            if (!recognitionRef.current) recognitionRef.current = initRecognition();

            const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                if (ctx.state === 'suspended') ctx.resume();
            }
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
        } catch (e) { }
    };
    unlock();
}, []);

const speak = useCallback((text: string, vol = 0.5, pitch = 1.0, rate = 0.95) => {
    const synth = window.speechSynthesis;
    const utteranceClass = (window as any).SpeechSynthesisUtterance || (window as any).webkitSpeechSynthesisUtterance;

    if (!synth || !utteranceClass) {
        console.warn("🔇 [useSpeech] Native TTS or SpeechSynthesisUtterance not available. Sovereign Silence active.");
        return;
    }

    (window as any).lastNovaResponse = text; // Unified Echo Guard tracking

    const normalizedVol = Math.max(0.1, Math.min(1.0, vol));

    synth.cancel();
    const utterance = new utteranceClass(text);
    utterance.volume = normalizedVol;
    utterance.pitch = pitch;
    utterance.rate = rate;

    const wasListening = shouldListenRef.current;
    // v8.3.5: No longer stopping recognition for Barge-In

    utterance.onstart = () => {
        isSpeakingRef.current = true;
        (window as any).isNovaSpeaking = true;
    };

    const loadVoices = () => {
        let voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.name.includes("Google US English")) || voices.find(v => v.name.includes("Natural") || v.name.includes("Neural")) || voices.find(v => v.name.includes("Female"));
        if (preferredVoice) utterance.voice = preferredVoice;
    };

    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
        loadVoices();
    }

    utterance.onend = () => {
        // Level 5 Mobile Sync: Reduced buffer cooldown to 200ms to eliminate 'first word' suppression
        setTimeout(() => {
            isSpeakingRef.current = false;
            (window as any).isNovaSpeaking = false;
            console.log("🔇 [useSpeech] Browser TTS Cooldown complete.");
        }, 200);
    };

    setTimeout(() => {
        window.speechSynthesis.speak(utterance);
    }, 100);
}, []);

const pauseListening = useCallback(() => {
    if (shouldListenRef.current && isListening) {
        try {
            recognitionRef.current?.stop();
        } catch (e) { }
    }
}, [isListening]);

const resumeListening = useCallback(() => {
    if (shouldListenRef.current && !isListening) {
        try {
            recognitionRef.current?.start();
        } catch (e) { }
    }
}, [isListening]);

return { isListening, toggleListening, speak, unlockAudio, pauseListening, resumeListening, reinitialize };
};

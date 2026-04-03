import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useSpeech: LEVEL 3 Sovereign Recovery
 * Priority: Mobile Chrome Reliability + Audio Unlock Gesture
 */
export const useSpeech = (onResult: (text: string) => void) => {
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
        recognizer.continuous = true; // Continuous mode (v10): Maintains focus through pauses
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

            if (lastResponse && isSpeaking) {
                const words = normalizedText.split(/\s+/);
                const refWords = lastResponse.split(/\s+/);
                const overlap = words.filter(w => refWords.includes(w)).length / words.length;

                if (overlap > 0.8 || lastResponse.includes(normalizedText) || normalizedText.includes(lastResponse)) {
                    console.log(`[useSpeech] Echo caught (v8.4.1) [Overlap: ${(overlap * 100).toFixed(0)}%]:`, text);
                    return;
                }
            }

            if ((latestResult as any).isFinal) {
                console.log('[useSpeech] Final intent detected:', text);

                // ⚡ BARGE-IN TRIGGER: If Nova is talking, evaluate if we should kill her speech
                if (isSpeaking) {
                    // v8.3.8: Final catch for echoes that leaked past the interim filter
                    const isFinalEcho = lastResponse.includes(normalizedText) || normalizedText.includes(lastResponse.substring(0, 20));
                    if (isFinalEcho) {
                        console.log('[useSpeech] Final intent suppressed as echo (v8.3.8):', text);
                        return;
                    }

                    const wordCount = text.split(/\s+/).length;
                    if (wordCount >= 2) {
                        console.log('[useSpeech] ⚡ BARGE-IN DETECTED. Killing speech for new intent:', text);
                        window.speechSynthesis.cancel();
                        isSpeakingRef.current = false;
                        (window as any).isNovaSpeaking = false;
                        onResultRef.current(text);
                        return;
                    } else {
                        console.log('[useSpeech] Fragment during speech ignored:', text);
                        return;
                    }
                }

                // ⏳ SOVEREIGN DEBOUNCE (v8.3.4): 1.4s for non-interruption cases
                debounceTimerRef.current = setTimeout(() => {
                    const isStillSpeaking = (window as any).isNovaSpeaking || isSpeakingRef.current;
                    const wordCount = text.trim().split(/\s+/).length;

                    if (text.length > 1 && !isStillSpeaking) {
                        // 🚦 GATE (v8.3.8): Allow short intents like "Hey Nova" (2+ words or wake-words)
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
                }, 800); // Faster restart for better responsiveness
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
                const ut = new SpeechSynthesisUtterance('');
                ut.volume = 0;
                synth.speak(ut);

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
        if (!window.speechSynthesis) return;

        (window as any).lastNovaResponse = text; // Unified Echo Guard tracking

        const normalizedVol = Math.max(0.1, Math.min(1.0, vol));

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
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
            // v8.3.5: Buffer cooldown, recognition stays active
            setTimeout(() => {
                isSpeakingRef.current = false;
                (window as any).isNovaSpeaking = false;
            }, 800);
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

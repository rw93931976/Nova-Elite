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
            if (isSpeaking && isListening) {
                console.log('[useSpeech] Muting STT (Nova Is Speaking)');
            }
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
            if (isSpeaking) return;

            // Clear any pending debounce timer
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

            const results = Array.from(event.results);
            const latestResult = results[event.resultIndex];
            const text = (latestResult as any)[0].transcript.trim();

            if ((latestResult as any).isFinal) {
                console.log('[useSpeech] Final intent detected:', text);

                // ⏳ SOVEREIGN DEBOUNCE (v6.0): Only process if we have actual content
                debounceTimerRef.current = setTimeout(() => {
                    if (text.length > 1 && !isSpeakingRef.current) {
                        onResultRef.current(text);
                    }
                }, 800);
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

            // AUTO-RESTART HEARTBEAT (The Dallas Pulse)
            if (shouldListenRef.current) {
                setTimeout(() => {
                    if (shouldListenRef.current && !isSpeakingRef.current) {
                        try {
                            recognitionRef.current?.start();
                        } catch (e) {
                            // Already active or error
                        }
                    }
                }, 100);
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

        // SOVEREIGN GAIN SCALING (v8.0): Supporting the "20x Boost"
        // Since browser volume is capped at 1.0, we normalize the slider (30-100)
        // to ensure maximum clarity even at lower system settings.
        const normalizedVol = Math.max(0.1, Math.min(1.0, vol));

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = normalizedVol;
        utterance.pitch = pitch;
        utterance.rate = rate;

        const wasListening = shouldListenRef.current;
        if (wasListening) {
            try {
                recognitionRef.current?.stop();
            } catch (e) { }
        }

        utterance.onstart = () => {
            isSpeakingRef.current = true;
            (window as any).isNovaSpeaking = true;
        };

        const loadVoices = () => {
            let voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v =>
                (v.name.includes('Natural') || v.name.includes('Neural')) ||
                (v.name.includes('Google US English') && v.name.includes('Female')) ||
                v.name.includes('Microsoft Zira') ||
                v.name.includes('Samantha')
            );
            if (preferredVoice) utterance.voice = preferredVoice;
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        } else {
            loadVoices();
        }

        utterance.onend = () => {
            setTimeout(() => {
                isSpeakingRef.current = false;
                (window as any).isNovaSpeaking = false;
                if (wasListening && shouldListenRef.current) {
                    try {
                        recognitionRef.current?.start();
                    } catch (e) { }
                }
            }, 800); // Shorter tail for Elite responsiveness
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

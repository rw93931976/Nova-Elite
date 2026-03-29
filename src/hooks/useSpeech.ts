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
                console.log('[useSpeech] Potential final intent detected. Waiting for 1.5s silence pulse...', text);

                // ⏳ SOVEREIGN DEBOUNCE (v10): Wait 1.5s for further intent before processing
                debounceTimerRef.current = setTimeout(() => {
                    if (text.length > 1 && !isSpeakingRef.current) {
                        console.log('[useSpeech] 1.5s silence confirmed. Sending to Core:', text);
                        onResultRef.current(text);
                        // Force a fresh start for the next sentence
                        recognizer.stop();
                    }
                }, 1500);
            }
        };

        recognizer.onerror = (event: any) => {
            console.error('[useSpeech] Recognition Error:', event.error);
            if (event.error === 'no-speech' || event.error === 'network') {
                // Keep the alive on road trips
                if (shouldListenRef.current) {
                    setTimeout(() => recognitionRef.current?.start(), 100);
                }
            } else {
                setIsListening(false);
            }
        };

        recognizer.onend = () => {
            console.log('[useSpeech] Recognition Ended - Pulse check...');
            setIsListening(false);

            // AUTO-RESTART HEARTBEAT (The Dallas Pulse)
            if (shouldListenRef.current) {
                setTimeout(() => {
                    if (shouldListenRef.current) {
                        try {
                            recognitionRef.current?.start();
                        } catch (e) {
                            // Already active
                        }
                    }
                }, 100); // Reduced delay for instant responsiveness
            }
        };

        return recognizer;
    };

    const toggleListening = useCallback(() => {
        shouldListenRef.current = !shouldListenRef.current;
        console.log('[useSpeech] Toggle Listening:', shouldListenRef.current);

        if (shouldListenRef.current) {
            if (!recognitionRef.current) recognitionRef.current = initRecognition();
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.warn('[useSpeech] Start failed (likely already running):', e);
            }
        } else {
            try {
                recognitionRef.current?.stop();
            } catch (e) {
                console.warn('[useSpeech] Stop failed:', e);
            }
        }
    }, []);

    const unlockAudio = useCallback(() => {
        // Critical for Mobile Browsers: Unlock Audio Context on user gesture
        const unlock = () => {
            try {
                const synth = window.speechSynthesis;
                const ut = new SpeechSynthesisUtterance('');
                ut.volume = 0;
                synth.speak(ut);

                // Also wake up AudioContext if used
                const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
                if (AudioContext) {
                    const ctx = new AudioContext();
                    if (ctx.state === 'suspended') ctx.resume();
                }
                console.log('[useSpeech] Audio Unlocked via Gesture');
                window.removeEventListener('click', unlock);
                window.removeEventListener('touchstart', unlock);
            } catch (e) {
                console.warn('[useSpeech] Audio Unlock failed:', e);
            }
        };
        unlock();
    }, []);

    const speak = useCallback((text: string, vol = 0.5, pitch = 1.0, rate = 0.95) => {
        if (!window.speechSynthesis) return;

        // 🗣️ Vocal Attempt (v3.1.7)
        console.log(`[useSpeech] Attempting to speak: "${text.substring(0, 30)}..." (Vol: ${vol})`);

        // Interrupt current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = vol;
        utterance.pitch = pitch;
        utterance.rate = rate;

        // Auto-pause listening while speaking to avoid feedback loop
        const wasListening = shouldListenRef.current;
        if (wasListening) {
            try {
                recognitionRef.current?.stop();
            } catch (e) { }
        }

        utterance.onstart = () => {
            isSpeakingRef.current = true;
            console.log('[useSpeech] Speech actually started (Context Unlocked)');
        };

        // 👩‍💼 VOICE SELECTION: Preference for high-quality female voices
        let voices = window.speechSynthesis.getVoices();

        // If voices aren't loaded yet, try again (common in some browsers)
        if (voices.length === 0) {
            console.warn('[useSpeech] Voices not loaded yet, using default fallback mechanism');
        }

        const preferredVoice = voices.find(v =>
            (v.name.includes('Natural') || v.name.includes('Neural')) ||
            (v.name.includes('Google US English') && v.name.includes('Female')) ||
            v.name.includes('Google US English') ||
            v.name.includes('Microsoft Zira') ||
            v.name.includes('Samantha') ||
            v.name.includes('Victoria') ||
            (v.name.includes('Female') && v.lang.startsWith('en'))
        );
        if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.log('[useSpeech] Selected Voice:', preferredVoice.name);
        } else if (voices.length > 0) {
            // Fallback to any en-US voice if preferred not found
            const fallback = voices.find(v => v.lang.startsWith('en'));
            if (fallback) utterance.voice = fallback;
        }

        utterance.onerror = (e) => {
            console.warn('[useSpeech] Speech failed:', e);
        };

        utterance.onend = () => {
            console.log('[useSpeech] Speech finished. Cooling down...');
            setTimeout(() => {
                isSpeakingRef.current = false;
                if (wasListening && shouldListenRef.current) {
                    try {
                        recognitionRef.current?.start();
                    } catch (e) { }
                }
            }, 1200); // 🔊 1.2s Post-speech lockout for echo/noise decay
        };

        // Small delay to ensure audio context is ready on mobile
        setTimeout(() => {
            window.speechSynthesis.speak(utterance);
        }, 100);
    }, []);

    const pauseListening = useCallback(() => {
        if (shouldListenRef.current && isListening) {
            try {
                recognitionRef.current?.stop();
                console.log('[useSpeech] Manual Pause (Listening Active)');
            } catch (e) { }
        }
    }, [isListening]);

    const resumeListening = useCallback(() => {
        if (shouldListenRef.current && !isListening) {
            try {
                recognitionRef.current?.start();
                console.log('[useSpeech] Manual Resume');
            } catch (e) { }
        }
    }, [isListening]);

    return { isListening, toggleListening, speak, unlockAudio, pauseListening, resumeListening };
};

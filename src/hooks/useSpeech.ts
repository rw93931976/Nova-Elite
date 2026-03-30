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
<<<<<<< HEAD
    const wakeLockRef = useRef<any>(null);
    const silentAudioRef = useRef<HTMLAudioElement | null>(null);
=======
>>>>>>> sovereign-elite-v3-6

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
<<<<<<< HEAD
            (window as any).isNovaListening = true;
=======
>>>>>>> sovereign-elite-v3-6
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
<<<<<<< HEAD
                console.log('[useSpeech] Final intent detected:', text);

                // ⏳ SOVEREIGN DEBOUNCE (v6.0): Only process if we have actual content
                debounceTimerRef.current = setTimeout(() => {
                    if (text.length > 1 && !isSpeakingRef.current) {
                        onResultRef.current(text);
                        // 🛡️ DO NOT STOP the recognizer here. Continuous mode keeps it alive.
                        // recognitionRef.current?.stop(); 
                    }
                }, 800);
=======
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
>>>>>>> sovereign-elite-v3-6
            }
        };

        recognizer.onerror = (event: any) => {
            console.error('[useSpeech] Recognition Error:', event.error);
<<<<<<< HEAD
            if (event.error === 'no-speech' || event.error === 'network') {
                // Keep the alive on road trips
                if (shouldListenRef.current) {
                    setTimeout(() => recognitionRef.current?.start(), 100);
=======
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                console.warn("🚨 [STT]: Microphone access DENIED. Please check browser permissions.");
                (window as any).nova_ears_error = "Permission Denied";
            }

            if (event.error === 'no-speech' || event.error === 'network' || event.error === 'aborted') {
                // Keep it alive on road trips or silent moments
                if (shouldListenRef.current) {
                    console.log("[useSpeech] Recalibrating silent ear...");
                    setTimeout(() => {
                        try { recognitionRef.current?.start(); } catch (e) { }
                    }, 200);
>>>>>>> sovereign-elite-v3-6
                }
            } else {
                setIsListening(false);
            }
        };

        recognizer.onend = () => {
            console.log('[useSpeech] Recognition Ended - Pulse check...');
            setIsListening(false);
<<<<<<< HEAD
            (window as any).isNovaListening = false;

            // AUTO-RESTART HEARTBEAT (The Dallas Pulse - Continuous Loop)
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
=======

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
>>>>>>> sovereign-elite-v3-6
            }
        };

        return recognizer;
    };

<<<<<<< HEAD
    // 🔋 BACKGROUND SOVEREIGNTY (v5.8): Screen Wake Lock + Silent Audio Loop
    // This prevents Android/Chrome from throttling the CPU when the screen is off or in a pocket.
    useEffect(() => {
        const handleWakeLock = async () => {
            if (shouldListenRef.current && 'wakeLock' in navigator) {
                try {
                    wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
                    console.log('[useSpeech] 🔋 Wake Lock Active');
                } catch (err) {
                    console.warn('[useSpeech] Wake Lock Failed:', err);
                }
            } else if (!shouldListenRef.current && wakeLockRef.current) {
                wakeLockRef.current.release().then(() => {
                    wakeLockRef.current = null;
                    console.log('[useSpeech] 🔋 Wake Lock Released');
                });
            }
        };

        const handleSilentLoop = () => {
            if (shouldListenRef.current) {
                if (!silentAudioRef.current) {
                    // 1-second ultra-low-bitrate silent MP3 (Base64)
                    const silentSrc = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQL6AAAAAAA=";
                    silentAudioRef.current = new Audio(silentSrc);
                    silentAudioRef.current.loop = true;
                    silentAudioRef.current.volume = 0.01;
                }
                silentAudioRef.current.play().catch(() => { });
                console.log('[useSpeech] 🔊 Silent Persistence Pulse Active');
            } else if (silentAudioRef.current) {
                silentAudioRef.current.pause();
            }
        };

        handleWakeLock();
        handleSilentLoop();

        // Re-request wake lock if tab becomes visible again
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

    // 🔬 STT PULSE (v5.8): Every 2.5s, if we SHOULD be listening but aren't, FORCE RESTART.
    // This solves the 'auto-off' issue and keeps STT alive in backgrounding scenarios.
    useEffect(() => {
        const pulse = setInterval(() => {
            const isSpeaking = (window as any).isNovaSpeaking || isSpeakingRef.current;
            if (shouldListenRef.current && !isListening && !isSpeaking) {
                console.log('[useSpeech] 🧬 Pulse: Reviving listener (Sovereign v6.0)...');
                try {
                    if (!recognitionRef.current) recognitionRef.current = initRecognition();
                    recognitionRef.current.start();
                } catch (e) {
                    // Likely already running
                }
            }
        }, 5000); // 🔬 Maximum Stability 5.0s Pulse (v6.5 Rescue)
        return () => clearInterval(pulse);
    }, [isListening]);

    const toggleListening = useCallback(() => {
        // Optimistic UI: Set true immediately if we're starting
        if (!shouldListenRef.current) setIsListening(true);

=======
    const toggleListening = useCallback(() => {
>>>>>>> sovereign-elite-v3-6
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

<<<<<<< HEAD
    const reinitialize = useCallback(() => {
        console.log('[useSpeech] ☢️ Nuclear Re-init: Purging STT state...');
        try {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null; // Prevent pulse loop during purge
                recognitionRef.current.onerror = null;
                recognitionRef.current.stop();
            }
        } catch (e) { }

        recognitionRef.current = initRecognition();

        // Always force listen on manual re-init
        shouldListenRef.current = true;
        try {
            recognitionRef.current.start();
            console.log('[useSpeech] ☢️ Nuclear Re-init: STT Object Restored.');
        } catch (e) {
            console.warn('[useSpeech] Re-init start failed:', e);
        }
    }, []);

=======
>>>>>>> sovereign-elite-v3-6
    const unlockAudio = useCallback(() => {
        // Critical for Mobile Browsers: Unlock Audio Context on user gesture
        const unlock = () => {
            try {
                const synth = window.speechSynthesis;
                const ut = new SpeechSynthesisUtterance('');
                ut.volume = 0;
                synth.speak(ut);

<<<<<<< HEAD
                // Re-prime STT object if it doesn't exist
                if (!recognitionRef.current) recognitionRef.current = initRecognition();

=======
>>>>>>> sovereign-elite-v3-6
                // Also wake up AudioContext if used
                const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
                if (AudioContext) {
                    const ctx = new AudioContext();
                    if (ctx.state === 'suspended') ctx.resume();
                }
<<<<<<< HEAD
                console.log('[useSpeech] Audio Unlocked & STT Re-initialized');
=======
                console.log('[useSpeech] Audio Unlocked via Gesture');
>>>>>>> sovereign-elite-v3-6
                window.removeEventListener('click', unlock);
                window.removeEventListener('touchstart', unlock);
            } catch (e) {
                console.warn('[useSpeech] Audio Unlock failed:', e);
            }
        };
        unlock();
<<<<<<< HEAD
    }, [reinitialize]);
=======
    }, []);
>>>>>>> sovereign-elite-v3-6

    const speak = useCallback((text: string, vol = 0.5, pitch = 1.0, rate = 0.95) => {
        if (!window.speechSynthesis) return;

        // 🗣️ Vocal Attempt (v3.1.7)
        console.log(`[useSpeech] Attempting to speak: "${text.substring(0, 30)}..." (Vol: ${vol})`);

        // Interrupt current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
<<<<<<< HEAD
        utterance.volume = Math.max(0, Math.min(1.0, vol));
=======
        utterance.volume = vol;
>>>>>>> sovereign-elite-v3-6
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
<<<<<<< HEAD
            const fallback = voices.find(v => v.lang.startsWith('en')) || voices[0];
            if (fallback) utterance.voice = fallback;
        } else {
            console.warn('[useSpeech] CRITICAL: No voices available in browser.');
=======
            const fallback = voices.find(v => v.lang.startsWith('en'));
            if (fallback) utterance.voice = fallback;
>>>>>>> sovereign-elite-v3-6
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
<<<<<<< HEAD
            window.speechSynthesis.cancel(); // 🚫 Clear any stuck speech
=======
>>>>>>> sovereign-elite-v3-6
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

<<<<<<< HEAD
    return { isListening, toggleListening, speak, unlockAudio, pauseListening, resumeListening, reinitialize };
=======
    return { isListening, toggleListening, speak, unlockAudio, pauseListening, resumeListening };
>>>>>>> sovereign-elite-v3-6
};

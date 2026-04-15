import { useEffect } from 'react';

// --- Background Persistence: Silent Audio Hook ---
export const useSilentAudio = () => {
    useEffect(() => {
        try {
            let audioContext: AudioContext | null = null;
            let oscillator: OscillatorNode | null = null;

            const startPersistence = () => {
                try {
                    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                    if (!AudioContextClass) return;

                    audioContext = new AudioContextClass();
                    const gainNode = audioContext.createGain();
                    gainNode.gain.value = 0.001;

                    oscillator = audioContext.createOscillator();
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    oscillator.start();
                    console.log('🔊 [Background] Audio Persistence Active.');
                } catch (e) {
                    console.warn('[Background] Audio Induction failed:', e);
                }
            };

            const handleInteraction = () => {
                if (!audioContext) startPersistence();
                window.removeEventListener('click', handleInteraction);
                window.removeEventListener('touchstart', handleInteraction);
            };

            window.addEventListener('click', handleInteraction);
            window.addEventListener('touchstart', handleInteraction);

            return () => {
                oscillator?.stop();
                audioContext?.close();
            };
        } catch (err) {
            console.error('[Background] SilentAudio setup error:', err);
        }
    }, []);
};

// --- Background Persistence: Screen Wake Lock ---
export const useWakeLock = () => {
    useEffect(() => {
        let wakeLock: any = null;
        const requestLock = async () => {
            try {
                if ('wakeLock' in navigator) {
                    wakeLock = await (navigator as any).wakeLock.request('screen');
                    console.log('💡 [Background] Wake Lock Active.');
                }
            } catch (err) {
                console.warn('[Background] Wake Lock update failed:', err);
            }
        };

        requestLock();
        const handleVisible = () => {
            if (document.visibilityState === 'visible') requestLock();
        };
        document.addEventListener('visibilitychange', handleVisible);

        return () => {
            document.removeEventListener('visibilitychange', handleVisible);
            if (wakeLock) wakeLock.release().catch(() => { });
        };
    }, []);
};

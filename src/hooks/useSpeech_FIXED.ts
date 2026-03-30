import { useEffect, useRef, useState, useCallback } from 'react';

type UseSpeechOptions = {
  onTranscript?: (text: string) => void;
  autoListen?: boolean;
};

export function useSpeech({ onTranscript, autoListen = true }: UseSpeechOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [lastSpoken, setLastSpoken] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isSpeaking = useRef(false);
  const shouldListen = useRef(autoListen);
  const coolDownUntil = useRef<number | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout>();

  // ---------- Speech Recognition setup ----------

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      console.warn('Web Speech API (SpeechRecognition) not available');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.continuous = false; // Transactional mode
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      console.log('🎧 Recognition started');
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('🎧 Recognition ended');
      
      // Auto-restart logic
      const now = Date.now();
      if (
        shouldListen.current &&
        !isSpeaking.current &&
        (!coolDownUntil.current || now > coolDownUntil.current)
      ) {
        try {
          recognition.start();
        } catch (e) {
          console.warn('Recognition restart failed:', e);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Recognition error:', event);
      setIsListening(false);
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        shouldListen.current = false;
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1];
      if (!last || !last.isFinal) return;

      const heard = last[0].transcript.trim();
      const heardLower = heard.toLowerCase();
      const now = Date.now();

      // HARD GATE: Ignore anything while Nova is speaking
      if (isSpeaking.current) {
        console.log('🛑 Ignoring input while Nova is speaking:', heardLower);
        return;
      }

      // Cool-down after speaking ends
      if (coolDownUntil.current && now < coolDownUntil.current) {
        console.log('🛑 Ignoring input during cool-down:', heardLower);
        return;
      }

      // Enhanced echo detection
      const lastSpokenText = lastSpoken.toLowerCase();
      const isEcho = lastSpokenText.length > 0 && (
        lastSpokenText.includes(heardLower) ||
        heardLower.includes(lastSpokenText.substring(0, 10)) ||
        (heardLower.length > 3 && lastSpokenText.includes(heardLower.substring(0, 8)))
      );

      if (isEcho) {
        console.log('🛑 Echo detected, ignoring:', heardLower);
        return;
      }

      setLastHeard(heard);
      console.log('🎤 Final transcript:', heard);

      if (onTranscript) onTranscript(heard);
    };

    recognitionRef.current = recognition;

    // Start initially if desired
    if (autoListen) {
      try {
        recognition.start();
      } catch (e) {
        console.warn('Initial recognition start failed:', e);
      }
    }

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, [autoListen, onTranscript, lastSpoken]);

  // ---------- TTS + mic coordination ----------

  const speak = useCallback((text: string, options: { rate?: number; pitch?: number; volume?: number } = {}) => {
    if (!text || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not available or empty text');
      return;
    }

    const recognition = recognitionRef.current;
    const synth = window.speechSynthesis;

    // Cancel any existing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1.1;
    utterance.volume = options.volume || 1;

    // Voice selection (keep existing logic)
    const voices = synth.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Natural') || v.name.includes('Online')) ||
        voices.find(v => v.name.includes('Microsoft Zira')) ||
        voices.find(v => v.name.includes('Samantha')) ||
        voices.find(v => v.name.includes('Google') && v.name.includes('Female')) ||
        voices.find(v => v.name.toLowerCase().includes('female')) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      console.log('🔊 Nova speaking:', text);
      isSpeaking.current = true;
      setLastSpoken(text);

      // CRITICAL: Stop listening immediately to avoid self-hearing
      if (recognition) {
        try {
          recognition.abort(); // More immediate than stop()
        } catch (e) {
          console.warn('Recognition abort failed:', e);
        }
      }

      // Set cool-down window (800ms after end)
      const now = Date.now();
      coolDownUntil.current = now + 800;
    };

    utterance.onend = () => {
      console.log('🔊 Nova finished speaking');
      isSpeaking.current = false;

      // Extend cool-down for echo decay
      const now = Date.now();
      if (!coolDownUntil.current || now > coolDownUntil.current) {
        coolDownUntil.current = now + 800;
      }

      // Restart mic if we still want to listen
      if (shouldListen.current && recognition) {
        setTimeout(() => {
          try {
            recognition.start();
            console.log('🎧 Recognition restarted after speech');
          } catch (e) {
            console.warn('Recognition restart after speech failed:', e);
          }
        }, 200); // Small delay before restart
      }
    };

    utterance.onerror = (e) => {
      console.error('Utterance error:', e);
      isSpeaking.current = false;
    };

    // Chrome garbage collection prevention
    (window as any)._nova_utterance = utterance;
    (window as any)._nova_last_speak_start = Date.now();

    synth.speak(utterance);
  }, [lastSpoken]);

  // ---------- Public controls ----------

  const startListening = useCallback(() => {
    shouldListen.current = true;
    const recognition = recognitionRef.current;
    if (recognition && !isSpeaking.current) {
      try {
        recognition.start();
      } catch (e) {
        console.warn('Manual startListening failed:', e);
      }
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldListen.current = false;
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.abort();
      } catch (e) {
        console.warn('Manual stopListening failed:', e);
      }
    }
  }, []);

  return {
    isListening,
    lastHeard,
    lastSpoken,
    speak,
    startListening,
    stopListening,
    isSpeaking: isSpeaking.current,
    shouldListen: shouldListen.current,
  };
}

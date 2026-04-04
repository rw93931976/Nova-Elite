import { useState, useEffect, useCallback, useRef } from "react";
import { useSpeech } from "./useSpeech";
import { NovaCore } from "../core/NovaCore";

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  type: "sent" | "received";
  status: "pending" | "read";
  role?: "user" | "assistant" | "architect";
}

export function useNova() {
  const [core] = useState(() => new NovaCore());
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isHalted, setIsHalted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastTone, setLastTone] = useState<string>("neutral");
  const [hasNewArchMsg, setHasNewArchMsg] = useState(false);

  const processingLock = useRef(false);
  const lastUrl = useRef<string | null>(null);
  const lastArchId = useRef<string | null>(localStorage.getItem("lastArchId"));

  // 🛡️ SOVEREIGN BUFFER (v8.4.7): Rolling Debounce for Mobile Fragments
  const pendingInputRef = useRef<string>("");
  const bufferTimerRef = useRef<NodeJS.Timeout | null>(null);
  const STT_DEBOUNCE_MS = 1800; // 1.8s silence required for mobile stability

  // 🎙️ BREAK CIRCULAR DEPENDENCY: Use a ref for the speak function
  const speakRef = useRef<(text: string) => void>(() => { });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const processWithNova = useCallback(async (input: string, options?: { onReceipt?: (r: string) => void }) => {
    if (processingLock.current) {
      console.log("⏳ [useNova] Thinking... buffering input.");
      // If we are already thinking, we should ideally append this to the current thought process or queue it.
      // For now, let's wait a moment and try again to avoid dropping the message.
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (processingLock.current) return;
    }
    try {
      processingLock.current = true;
      setIsThinking(true);

      await core.supabase.from("nova_messages").insert([{ role: "user", content: input }]);

      const historySource = messages.length > 0 ? messages : await core.supabase.from("nova_messages").select("*").order("created_at", { ascending: false }).limit(25).then(r => r.data || []);

      const history = (historySource as any[]).map(m => ({
        role: m.from === "user" || m.role === "user" ? "user" : "assistant",
        content: m.content
      }));

      const currentTime = new Date();
      const timeContext = {
        time: currentTime.toLocaleTimeString(),
        date: currentTime.toLocaleDateString(),
        day: currentTime.toLocaleDateString('en-US', { weekday: 'long' }),
        isBusinessHours: currentTime.getHours() >= 8 && currentTime.getHours() <= 18
      };

      const thought = await core.processElite(input, { history, lastUrl: lastUrl.current, timeContext }, options?.onReceipt);
      console.log("🧠 [useNova] Thought processed:", thought?.response ? "Success" : "Empty");
      if (thought?.analysis?.tone) setLastTone(thought.analysis.tone);

      if (thought?.response) {
        if ((window as any).NOVA_USE_BROWSER_TTS) {
          speakRef.current(thought.response);
        }

        await core.supabase.from("nova_messages").insert([{
          role: "assistant",
          content: thought.response
        }]);

        await core.supabase.from("relay_jobs").insert([{
          type: "speech",
          status: "pending",
          payload: { text: thought.response }
        }]);
      }

      return thought;
    } catch (e: any) {
      console.error("❌ Interaction failed:", e);
    } finally {
      processingLock.current = false;
      setIsThinking(false);
    }
  }, [core, messages]);

  const stopAllSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    (window as any).isNovaSpeaking = false;
    console.log("🛑 [useNova] NUCLEAR SILENCE: All speech terminated.");
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    // 🛡️ EARPLUG GUARD (防止自問自答): If Nova is currently vocalizing, ignore the input.
    if ((window as any).isNovaSpeaking) {
      console.log("🔇 [useNova] Input suppressed: Nova is currently speaking.");
      return;
    }

    // 🔬 SOVEREIGN BUFFER (v8.4.7): Rolling Debounce
    const normalizedText = text.trim();
    if (!normalizedText) return;

    // If it's a growth of the existing "pending" input, we wait.
    if (pendingInputRef.current && normalizedText.startsWith(pendingInputRef.current)) {
      console.log("⏳ [useNova] Buffer: Input growing...", normalizedText);
    }

    pendingInputRef.current = normalizedText;

    if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);

    bufferTimerRef.current = setTimeout(() => {
      console.log("🚀 [useNova] Buffer released. Sending Intent:", pendingInputRef.current);
      const finalIntent = pendingInputRef.current;
      pendingInputRef.current = "";
      processWithNova(finalIntent);
    }, STT_DEBOUNCE_MS);

  }, [processWithNova]);

  // 🎙️ Initialize Speech Hook
  const { isListening, toggleListening, speak } = useSpeech(sendMessage, { onBargeIn: stopAllSpeech });

  // Keep speakRef in sync
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  useEffect(() => {
    const init = async () => {
      await core.initialize();
      setIsInitialized(true);
      setIsHalted(core.isHalted);
    };
    init();
  }, [core]);

  useEffect(() => {
    const fetchMessages = async () => {
      const [novaRes, archRes] = await Promise.all([
        core.supabase.from("nova_messages").select("*").order("created_at", { ascending: false }).limit(50),
        core.supabase.from("agent_architect_comms").select("*").order("created_at", { ascending: false }).limit(10)
      ]);

      if (novaRes.data) {
        const msgs: Message[] = novaRes.data.reverse().map((m: any) => ({
          id: m.id.toString(),
          from: m.role === "user" ? "user" : "assistant",
          to: m.role === "user" ? "assistant" : "user",
          content: m.content,
          timestamp: new Date(m.created_at).getTime(),
          type: "received" as "received",
          status: "read",
          role: m.role
        }));

        if (archRes.data) {
          const latestArch = archRes.data[0];
          if (latestArch && latestArch.id.toString() !== lastArchId.current) {
            setHasNewArchMsg(true);
          }

          const archMsgs = archRes.data.map((m: any) => ({
            id: "arch-" + m.id,
            from: "architect",
            to: "nova",
            content: `[ARCH]: ${m.message}`,
            timestamp: new Date(m.created_at).getTime(),
            type: "received" as "received",
            status: "read",
            role: "architect"
          }));
          setMessages([...msgs, ...archMsgs].sort((a, b) => a.timestamp - b.timestamp));
        } else {
          setMessages(msgs);
        }
      }
    };

    fetchMessages();

    // 🔊 AUDIO RELAY: Sync speech from Bridge to Browser (Pulse Sync)
    const playBridgeAudio = async (url?: string) => {
      try {
        stopAllSpeech(); // Pre-emptive kill
        (window as any).isNovaSpeaking = true;
        const bridgeUrl = url || `/bridge-vps/speech?t=${Date.now()}`;
        const audio = new Audio(bridgeUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setTimeout(() => {
            (window as any).isNovaSpeaking = false;
            audioRef.current = null;
            console.log('🔇 [AudioRelay] Bridge speech ended');
          }, 500); // 500ms safety tail
        };
        audio.onerror = () => {
          (window as any).isNovaSpeaking = false;
          audioRef.current = null;
          console.error('❌ [AudioRelay] Audio element error');
        };
        await audio.play();
        console.log('🔊 [AudioRelay] Playing bridge speech');
      } catch (e) {
        (window as any).isNovaSpeaking = false;
        console.warn('⚠️ [AudioRelay] Playback blocked or failed', e);
      }
    };

    const sub = core.supabase
      .channel("nova-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "nova_messages" }, async (payload) => {
        const msg = payload.new as any;
        if (msg.role === 'assistant') {
          // fetchMessages first to update UI
          await fetchMessages();
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "nova_messages" }, fetchMessages)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_architect_comms" }, async (payload) => {
        const msg = payload.new as any;
        if (msg && msg.sender !== 'vps_heartbeat') {
          speakRef.current(`Notification from Architect: ${msg.message}`);
          await fetchMessages();
          setHasNewArchMsg(true);
        }
      })
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "relay_jobs",
        filter: "status=eq.completed"
      }, async (payload) => {
        const job = payload.new as any;
        if (job.type === 'speech' && job.payload?.audio_url) {
          console.log("🔊 [AudioPulse] Triggering speech from Relay Sync");
          await playBridgeAudio(job.payload.audio_url);
        }
      })
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, [core]); // Removed speak from dependencies since we use speakRef

  const resetArchAlert = useCallback(() => {
    setHasNewArchMsg(false);
    if (messages.length > 0) {
      const archs = messages.filter(m => m.role === "architect");
      if (archs.length > 0) {
        const latest = archs[archs.length - 1].id.replace("arch-", "");
        lastArchId.current = latest;
        localStorage.setItem("lastArchId", latest);
      }
    }
  }, [messages]);

  const toggleHalt = useCallback(() => {
    stopAllSpeech(); // NUCLEAR SILENCE: Immediately kill local audio
    core.toggleHalt();
    setIsHalted(core.isHalted);

    // Notify Bridge to clear buffer if halting
    if (!isHalted) {
      core.supabase.from("relay_jobs").insert([{ type: "halt", status: "pending", payload: { clear_buffer: true } }]);
    }
  }, [core, isHalted, stopAllSpeech]);

  const handleHardRefresh = useCallback(async () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }, []);

  return {
    isListening,
    isThinking,
    isInitialized,
    isHalted,
    messages,
    lastTone,
    hasNewArchMsg,
    resetArchAlert,
    toggleListening,
    sendMessage,
    toggleHalt,
    handleHardRefresh,
    version: core.version
  };
}
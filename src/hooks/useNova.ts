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
          type: "received",
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
            type: "received",
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
    const sub = core.supabase
      .channel("nova-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "nova_messages" }, fetchMessages)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_architect_comms" }, async (payload) => {
        const msg = payload.new as any;
        if (msg && msg.sender !== 'vps_heartbeat') {
          // 🎙️ INSTANT RELAY: No waiting for pools. Nova speaks Architect pings immediately.
          speak(`Notification from Architect: ${msg.message}`);
          await fetchMessages(); // Refresh UI after speaking
          setHasNewArchMsg(true);
        }
      })
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, [core]);

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

  const { isListening, toggleListening, speak } = useSpeech((text) => {
    sendMessage(text);
  });

  const processWithNova = useCallback(async (input: string, options?: { onReceipt?: (r: string) => void }) => {
    if (processingLock.current) return;
    try {
      processingLock.current = true;
      setIsThinking(true);

      await core.supabase.from("nova_messages").insert([{ role: "user", content: input }]);

      const history = messages.slice(-25).map(m => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.content
      }));

      const thought = await core.processElite(input, { history, lastUrl: lastUrl.current }, options?.onReceipt);
      if (thought?.analysis?.tone) setLastTone(thought.analysis.tone);

      if (thought?.response) {
        if ((window as any).NOVA_USE_BROWSER_TTS) {
          speak(thought.response);
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
  }, [core, messages, speak]);

  const sendMessage = useCallback(async (text: string) => {
    return processWithNova(text);
  }, [processWithNova]);

  const toggleHalt = useCallback(() => {
    core.toggleHalt();
    setIsHalted(core.isHalted);
  }, [core]);

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
    handleHardRefresh
  };
}
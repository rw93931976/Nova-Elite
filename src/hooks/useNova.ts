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
  const announcedIds = useRef<Set<string>>(new Set(JSON.parse(localStorage.getItem("announcedIds") || "[]")));

  // 🎙️ BREAK CIRCULAR DEPENDENCY: Use a ref for the speak function
  const speakRef = useRef<(text: string) => void>(() => { });

  // 🛡️ SOVEREIGN BUFFER (v8.4.7)
  const pendingInputRef = useRef<string>("");
  const bufferTimerRef = useRef<NodeJS.Timeout | null>(null);
  const STT_DEBOUNCE_MS = 1800;

  const processWithNova = useCallback(async (input: string, options?: { onReceipt?: (r: string) => void }) => {
    if (processingLock.current) return;
    try {
      processingLock.current = true;
      setIsThinking(true);
      await core.supabase.from("nova_messages").insert([{ role: "user", content: input }]);

      const historySource = messages.length > 0 ? messages : [];
      const history = (historySource as any[]).map(m => ({
        role: m.role === "user" ? "user" : (m.role === "architect" ? "user" : "assistant"),
        content: m.role === "architect" ? `[DIRECTIVE FROM THE ARCHITECT]: ${m.content}` : m.content
      }));

      const thought = await core.processElite(input, { history }, options?.onReceipt);
      if (thought?.response && !isHalted) {
        if ((window as any).NOVA_USE_BROWSER_TTS) speakRef.current(thought.response);
        await core.supabase.from("nova_messages").insert([{ role: "assistant", content: thought.response }]);
      }
      return thought;
    } catch (e) { console.error(e); }
    finally { processingLock.current = false; setIsThinking(false); }
  }, [core, messages, isHalted]);

  // 🎙️ Initialize Speech Hook
  const { isListening, toggleListening, speak } = useSpeech((t) => {
    // 🛡️ VOCAL GUARD (v8.7.9)
    // If Nova is speaking, ignore STT to prevent Echo Loops.
    if (window.speechSynthesis.speaking) return;

    const normalized = t.trim();
    if (!normalized || isHalted) return;

    // 🛸 DIRECT-WIRE BYPASS (v8.9.9s)
    // Allows Ray to bypass Nova brain processing on mobile/road by saying 'Hardwire' or 'Direct Wire'.
    const bypassKeywords = ["hardwire", "direct wire", "message antigravity", "antigravity directive"];
    const lowercase = normalized.toLowerCase();
    const trigger = bypassKeywords.find(kw => lowercase.startsWith(kw));

    if (trigger) {
      const message = normalized.slice(trigger.length).trim();
      if (message) {
        console.log(`🛸 [DirectWire] Bypass triggered: "${message}"`);
        core.notifyArchitect(message, 'high');
        core.supabase.from("nova_messages").insert([{ role: "user", content: `[DIRECT WIRE]: ${message}` }]);
        speak("Direct Wire active. Message transmitted to Antigravity.");
        return;
      }
    }

    pendingInputRef.current = normalized;
    if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
    bufferTimerRef.current = setTimeout(() => {
      const intent = pendingInputRef.current;
      pendingInputRef.current = "";
      processWithNova(intent);
    }, STT_DEBOUNCE_MS);
  }, { onBargeIn: () => window.speechSynthesis.cancel() });

  useEffect(() => { speakRef.current = speak; }, [speak]);

  useEffect(() => {
    const init = async () => {
      await core.initialize();
      setIsInitialized(true);
      setIsHalted(core.isHalted);
      processingLock.current = false;
    };
    init();
  }, [core]);

  useEffect(() => {
    const fetchMessages = async (isInitial = false) => {
      const [novaRes, archRes] = await Promise.all([
        core.supabase.from("nova_messages").select("*").order("created_at", { ascending: false }).limit(50),
        core.supabase.from("agent_architect_comms").select("*").order("created_at", { ascending: false }).limit(10)
      ]);

      if (novaRes.data) {
        const msgs: Message[] = novaRes.data.reverse().map((m: any) => ({
          id: m.id.toString(), from: m.role === "user" ? "user" : "assistant", to: m.role === "user" ? "assistant" : "user", content: m.content, timestamp: new Date(m.created_at).getTime(), type: "received" as "received", status: "read", role: m.role
        }));

        if (archRes.data) {
          const archMsgs = archRes.data.map((m: any) => {
            // 🛡️ ROLE ALIGNMENT (v9.1-SOVEREIGN)
            // Only announce if Nova is the recipient and 'architect' is the sender
            if (isInitial && m.status === 'unread' && m.recipient === 'nova' && m.sender === 'architect' && !announcedIds.current.has(m.id)) {
              if (!isHalted) speakRef.current(`Architectural Directive: ${m.message}`);
              announcedIds.current.add(m.id);
              localStorage.setItem("announcedIds", JSON.stringify(Array.from(announcedIds.current)));
              setHasNewArchMsg(true);
            }
            return {
              id: "arch-" + m.id, from: "architect", to: "nova", content: `[ARCH]: ${m.message}`, timestamp: new Date(m.created_at).getTime(), type: "received" as "received", status: "read", role: "architect"
            };
          });
          setMessages([...msgs, ...archMsgs].sort((a, b) => a.timestamp - b.timestamp));
        } else {
          setMessages(msgs);
        }
      }
    };

    fetchMessages(true);

    const sub = core.supabase
      .channel("nova-live-stabilized")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agent_architect_comms" }, async (payload) => {
        const msg = payload.new as any;

        // 🛡️ SOVEREIGN BRIDGE (v9.1-SOVEREIGN): Role Validation
        // Nova only vocalizes what she is intended to receive from the Architect.
        if (msg.recipient !== 'nova' || msg.sender !== 'architect' || msg.status !== 'unread' || announcedIds.current.has(msg.id)) {
          return;
        }

        if (msg && !announcedIds.current.has(msg.id)) {
          if (!isHalted) speakRef.current(`Architectural Directive: ${msg.message}`);
          announcedIds.current.add(msg.id);
          localStorage.setItem("announcedIds", JSON.stringify(Array.from(announcedIds.current)));
          setHasNewArchMsg(true);
        }
        await fetchMessages();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "nova_messages" }, () => fetchMessages())
      .subscribe();

    return () => { sub.unsubscribe(); };
  }, [core, isHalted]);

  const resetArchAlert = useCallback(() => { setHasNewArchMsg(false); }, []);
  const toggleHalt = useCallback(() => {
    window.speechSynthesis.cancel();
    (window as any).isNovaSpeaking = false;
    core.toggleHalt();
    setIsHalted(core.isHalted);
    processingLock.current = false;
  }, [core]);

  return {
    isListening, isThinking, isInitialized, isHalted, messages, lastTone, hasNewArchMsg, resetArchAlert, toggleListening, toggleHalt, handleHardRefresh: () => { localStorage.clear(); window.location.reload(); }, notifyArchitect: (m: string) => core.notifyArchitect(m), version: core.version
  };
}
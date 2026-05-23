import { useState, useCallback, useRef } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  createLocalAudioTrack,
  type RemoteParticipant,
  type RemoteTrack,
  type RemoteTrackPublication,
} from 'livekit-client';
import { readStoredUiVolume, uiVolumeToElementVolume, uiVolumeToGain } from './voiceVolume';

const LIVEKIT_URL =
  import.meta.env.VITE_LIVEKIT_URL || 'wss://nova-2fds3yq3.livekit.cloud';

const CONNECT_TIMEOUT_MS = 30_000;

type AttachedAudio = {
  trackKey: string;
  el: HTMLAudioElement;
  mode: 'boost' | 'element';
  elementSource?: MediaElementAudioSourceNode;
};

class ConnectTimeoutError extends Error {
  constructor() {
    super(
      'Voice link timed out after 30 seconds — LiveKit or speech service may be slow. Tap Start voice to try again.',
    );
    this.name = 'ConnectTimeoutError';
  }
}

function classifyConnectError(error: unknown): string {
  if (error instanceof ConnectTimeoutError) return error.message;
  if (error instanceof Error) {
    const domName = (error as DOMException).name;
    if (domName === 'NotAllowedError' || domName === 'PermissionDeniedError') {
      return 'Microphone access denied — allow mic for this site in browser settings, then tap Start voice.';
    }
    if (domName === 'NotFoundError' || domName === 'DevicesNotFoundError') {
      return 'No microphone found — connect a mic and try again.';
    }
    if (domName === 'NotReadableError' || domName === 'TrackStartError') {
      return 'Microphone is in use by another app — close it and tap Start voice to try again.';
    }
    const msg = error.message.toLowerCase();
    if (msg.includes('permission') && (msg.includes('denied') || msg.includes('dismissed'))) {
      return 'Microphone access denied — allow mic for this site in browser settings, then tap Start voice.';
    }
    if (msg.includes('token')) return error.message;
    if (msg.includes('could not connect') || msg.includes('websocket')) {
      return 'LiveKit connection failed — check network and tap Start voice to try again.';
    }
  }
  return 'Could not connect to voice — tap Start voice to try again.';
}

function getAudioContextClass(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

async function cleanupVoiceSession(
  roomRef: React.MutableRefObject<Room | null>,
  micRef: React.MutableRefObject<Awaited<ReturnType<typeof createLocalAudioTrack>> | null>,
  audioElsRef: React.MutableRefObject<HTMLMediaElement[]>,
  audioSourcesRef: React.MutableRefObject<AttachedAudio[]>,
  audioCtxRef: React.MutableRefObject<AudioContext | null>,
  gainNodeRef: React.MutableRefObject<GainNode | null>,
) {
  micRef.current?.stop();
  micRef.current = null;

  for (const attached of audioSourcesRef.current) {
    if (attached.elementSource) {
      try {
        attached.elementSource.disconnect();
      } catch {
        /* ignore */
      }
    }
  }
  audioSourcesRef.current = [];

  for (const el of audioElsRef.current) {
    el.pause();
    el.remove();
  }
  audioElsRef.current = [];

  if (audioCtxRef.current) {
    try {
      await audioCtxRef.current.close();
    } catch {
      /* ignore */
    }
    audioCtxRef.current = null;
    gainNodeRef.current = null;
  }

  if (roomRef.current) {
    await roomRef.current.disconnect();
    roomRef.current = null;
  }
}

export const useLiveVoice = (_core?: unknown) => {
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(() => readStoredUiVolume());

  const roomRef = useRef<Room | null>(null);
  const micRef = useRef<Awaited<ReturnType<typeof createLocalAudioTrack>> | null>(null);
  const audioElsRef = useRef<HTMLMediaElement[]>([]);
  const attachedTracksRef = useRef<Set<string>>(new Set());
  const audioSourcesRef = useRef<AttachedAudio[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const volumeRef = useRef(volume);
  const connectGenRef = useRef(0);
  volumeRef.current = volume;

  const applyOutputVolume = useCallback((uiVolume: number) => {
    const gain = uiVolumeToGain(uiVolume);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = gain;
    }
    for (const attached of audioSourcesRef.current) {
      attached.el.volume = uiVolumeToElementVolume(uiVolume);
      attached.el.muted = gain <= 0;
    }
  }, []);

  const ensureOutputGraph = useCallback(async (): Promise<GainNode | null> => {
    const AudioCtx = getAudioContextClass();
    if (!AudioCtx) return null;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioCtx();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = uiVolumeToGain(volumeRef.current);
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }

    if (audioCtxRef.current.state === 'suspended') {
      try {
        await audioCtxRef.current.resume();
      } catch (err) {
        console.warn('[useLiveVoice] AudioContext resume failed:', err);
      }
    }

    applyOutputVolume(volumeRef.current);
    return gainNodeRef.current;
  }, [applyOutputVolume]);

  const setVolume = useCallback(
    (val: number) => {
      setVolumeState(val);
      localStorage.setItem('nova_voice_volume', val.toString());
      applyOutputVolume(val);
    },
    [applyOutputVolume],
  );

  const stopLive = useCallback(async () => {
    connectGenRef.current += 1;
    setIsLiveActive(false);
    setIsConnecting(false);
    setIsAgentSpeaking(false);
    attachedTracksRef.current.clear();
    await cleanupVoiceSession(
      roomRef,
      micRef,
      audioElsRef,
      audioSourcesRef,
      audioCtxRef,
      gainNodeRef,
    );
  }, []);

  const startLive = useCallback(async () => {
    if (roomRef.current || isConnecting) return;

    const gen = ++connectGenRef.current;
    const isStale = () => connectGenRef.current !== gen;

    const attachRemoteAudio = async (
      track: RemoteTrack,
      publication: RemoteTrackPublication,
      room: Room,
    ) => {
      if (track.kind !== Track.Kind.Audio) return;
      const trackKey = publication.trackSid || track.sid || '';
      if (trackKey && attachedTracksRef.current.has(trackKey)) return;
      if (trackKey) attachedTracksRef.current.add(trackKey);

      const gain = uiVolumeToGain(volumeRef.current);
      const el = track.attach() as HTMLAudioElement;
      el.autoplay = true;
      el.setAttribute('playsinline', 'true');
      el.setAttribute('webkit-playsinline', 'true');
      audioElsRef.current.push(el);
      document.getElementById('nova-audio-root')?.appendChild(el);

      let mode: AttachedAudio['mode'] = 'element';
      let elementSource: MediaElementAudioSourceNode | undefined;

      el.volume = uiVolumeToElementVolume(volumeRef.current);
      el.muted = gain <= 0;

      if (typeof room.startAudio === 'function') {
        try {
          await room.startAudio();
        } catch {
          /* gesture may already have unlocked audio */
        }
      }

      try {
        await el.play();
      } catch (err) {
        console.warn('[useLiveVoice] Remote audio play blocked:', err);
        setLastError('Audio playback blocked — tap Start voice again and allow sound.');
      }

      // Boost above 1.0×: route element audio through GainNode (after play succeeds).
      if (gain > 1) {
        const gainNode = await ensureOutputGraph();
        if (gainNode && audioCtxRef.current) {
          try {
            elementSource = audioCtxRef.current.createMediaElementSource(el);
            elementSource.connect(gainNode);
            mode = 'boost';
          } catch (err) {
            console.warn('[useLiveVoice] Web Audio boost unavailable, element only:', err);
            el.volume = 1;
          }
        }
      }

      audioSourcesRef.current.push({ trackKey, el, mode, elementSource });
      applyOutputVolume(volumeRef.current);
    };

    const detachRemoteAudio = (track: RemoteTrack, publication?: RemoteTrackPublication) => {
      const trackKey = publication?.trackSid || track.sid || '';
      if (trackKey) {
        attachedTracksRef.current.delete(trackKey);
        audioSourcesRef.current = audioSourcesRef.current.filter(attached => {
          if (attached.trackKey !== trackKey) return true;
          if (attached.elementSource) {
            try {
              attached.elementSource.disconnect();
            } catch {
              /* ignore */
            }
          }
          return false;
        });
      }
      track.detach().forEach(el => {
        el.pause();
        el.remove();
        audioElsRef.current = audioElsRef.current.filter(x => x !== el);
      });
    };

    const subscribeParticipantAudio = (participant: RemoteParticipant, room: Room) => {
      for (const pub of participant.audioTrackPublications.values()) {
        if (pub.track) void attachRemoteAudio(pub.track, pub, room);
        else pub.setSubscribed(true);
      }
    };

    const failConnect = async (error: unknown) => {
      if (isStale()) return;
      connectGenRef.current += 1;
      const message = classifyConnectError(error);
      console.error('❌ [useLiveVoice]', error);
      setLastError(message);
      setIsConnecting(false);
      setIsLiveActive(false);
      setIsAgentSpeaking(false);
      attachedTracksRef.current.clear();
      await cleanupVoiceSession(
        roomRef,
        micRef,
        audioElsRef,
        audioSourcesRef,
        audioCtxRef,
        gainNodeRef,
      );
    };

    const runConnect = async () => {
      setLastError(null);
      setIsConnecting(true);
      attachedTracksRef.current.clear();

      const tokenRes = await fetch('/api/token', { cache: 'no-store' });
      if (isStale()) return;
      if (!tokenRes.ok) {
        throw new Error('Voice token unavailable — check droplet token service.');
      }

      const { token } = (await tokenRes.json()) as { token?: string; room?: string };
      if (isStale()) return;
      if (!token) throw new Error('Voice token missing from server response.');

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (participant.isLocal) return;
        void attachRemoteAudio(track, publication, room);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication) => {
        detachRemoteAudio(track, publication);
      });

      room.on(RoomEvent.ParticipantConnected, participant => {
        subscribeParticipantAudio(participant, room);
      });

      room.on(RoomEvent.Disconnected, () => {
        setIsLiveActive(false);
        setIsAgentSpeaking(false);
      });

      room.on(RoomEvent.ActiveSpeakersChanged, speakers => {
        setIsAgentSpeaking(speakers.some(participant => !participant.isLocal));
      });

      await room.connect(LIVEKIT_URL, token, { autoSubscribe: true });
      if (isStale()) return;

      if (typeof room.startAudio === 'function') {
        try {
          await room.startAudio();
        } catch {
          /* mic tap counts as gesture */
        }
      }
      if (isStale()) return;

      for (const participant of room.remoteParticipants.values()) {
        subscribeParticipantAudio(participant, room);
      }

      const mic = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
      });
      if (isStale()) {
        mic.stop();
        return;
      }

      micRef.current = mic;
      await room.localParticipant.publishTrack(mic);
      if (isStale()) return;

      setIsLiveActive(true);
      setIsConnecting(false);
    };

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        runConnect(),
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new ConnectTimeoutError()), CONNECT_TIMEOUT_MS);
        }),
      ]);
    } catch (error) {
      await failConnect(error);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, [isConnecting, ensureOutputGraph, applyOutputVolume]);

  return {
    isLiveActive,
    isConnecting,
    isAgentSpeaking,
    lastError,
    volume,
    setVolume,
    startLive,
    stopLive,
  };
};

import { useCallback } from 'react';
import { useNova } from './hooks/useNova';
import { useLiveVoice } from './hooks/useLiveVoice';
import { ControlRoomShell } from './dashboard/ControlRoomShell';
import { NovaCore } from './core/NovaCore';

const CURRENT_VERSION = '1.14.0 Kate — Control Room';

function App() {
  const nova = useNova();
  const liveVoice = useLiveVoice(nova.core);
  const core = NovaCore.getInstance();
  const status = core.getStatus();

  const { isHalted, toggleHalt, messages } = nova;

  const handleHardRefresh = useCallback(async () => {
    const confirmed = window.confirm(
      'PERFORM NUCLEAR CACHE CLEAR?\nThis will purge local dashboard state and reload.',
    );
    if (!confirmed) return;
    try {
      const savedVolume = localStorage.getItem('nova_voice_volume');
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) await reg.unregister();
      }
      if (window.caches) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      }
      localStorage.clear();
      sessionStorage.clear();
      if (savedVolume) localStorage.setItem('nova_voice_volume', savedVolume);
      window.location.href = `${window.location.origin}?t=${Date.now()}`;
    } catch {
      window.location.reload();
    }
  }, []);

  const toggleVoice = useCallback(() => {
    if (liveVoice.isLiveActive) liveVoice.stopLive();
    else liveVoice.startLive();
  }, [liveVoice]);

  return (
    <>
      <div id="nova-audio-root" aria-hidden="true" style={{ display: 'none' }} />
      <ControlRoomShell
      status={status}
      version={CURRENT_VERSION}
      isHalted={isHalted}
      onToggleHalt={toggleHalt}
      isLiveActive={liveVoice.isLiveActive}
      isConnecting={liveVoice.isConnecting}
      isAgentSpeaking={liveVoice.isAgentSpeaking}
      onToggleVoice={toggleVoice}
      messageCount={messages.length}
      lastError={liveVoice.lastError}
      volume={liveVoice.volume}
      onVolumeChange={liveVoice.setVolume}
      onHardRefresh={handleHardRefresh}
    />
    </>
  );
}

export default App;

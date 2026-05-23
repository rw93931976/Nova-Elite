import React, { useEffect, useState } from 'react';
import { Home, Target, Layers, Settings, RotateCcw, GraduationCap } from 'lucide-react';
import type { DashboardPageId } from './types';
import { DASHBOARD_SECTIONS } from './types';
import { useDashboardState } from './hooks/useDashboardState';
import { HomePage } from './pages/HomePage';
import { StudyPage } from './pages/StudyPage';
import { AutonomyPage } from './pages/AutonomyPage';
import { FeatureGroupsPage } from './pages/FeatureGroupsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SecondReviewSignal } from './components/SecondReviewSignal';
import type { NovaStatus } from '../types/nova';
import '../styles/control-room.css';

const SECTION_ICONS: Record<DashboardPageId, React.ReactNode> = {
  home: <Home size={20} />,
  study: <GraduationCap size={20} />,
  autonomy: <Target size={20} />,
  features: <Layers size={20} />,
  settings: <Settings size={20} />,
};

const NAV = DASHBOARD_SECTIONS.map(s => ({
  id: s.id,
  label: s.label,
  icon: SECTION_ICONS[s.id],
}));

export interface ControlRoomShellProps {
  status: NovaStatus;
  version: string;
  isHalted: boolean;
  onToggleHalt: () => void;
  isLiveActive: boolean;
  isConnecting: boolean;
  isAgentSpeaking: boolean;
  onToggleVoice: () => void;
  messageCount: number;
  lastError?: string | null;
  volume: number;
  onVolumeChange: (v: number) => void;
  onHardRefresh: () => void;
}

const MOBILE_NAV_IDS: DashboardPageId[] = ['home', 'settings'];

export const ControlRoomShell: React.FC<ControlRoomShellProps> = props => {
  const [page, setPage] = useState<DashboardPageId>('home');
  const [clock, setClock] = useState(new Date().toLocaleString());
  const dashboard = useDashboardState();
  const [coarseNav, setCoarseNav] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const sync = () => {
      setCoarseNav(mq.matches);
      if (mq.matches && page !== 'home' && page !== 'settings') {
        setPage('home');
      }
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [page]);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleString()), 30_000);
    return () => clearInterval(t);
  }, []);

  const mobileNavItems = coarseNav ? NAV.filter(item => MOBILE_NAV_IDS.includes(item.id)) : NAV;

  const statusWithClock = { ...props.status, currentTime: clock };

  const showSecondReview =
    (page === 'autonomy' || page === 'features') &&
    Boolean(dashboard.state.secondReview.recommendation) &&
    !dashboard.state.secondReview.finalApproved;

  const renderPage = () => {
    switch (page) {
      case 'home':
        return (
          <HomePage
            status={statusWithClock}
            version={props.version}
            isHalted={props.isHalted}
            isLiveActive={props.isLiveActive}
            isConnecting={props.isConnecting}
            isAgentSpeaking={props.isAgentSpeaking}
            onToggleVoice={props.onToggleVoice}
            lastError={props.lastError}
          />
        );
      case 'study':
        return (
          <StudyPage
            itemProgress={dashboard.state.itemProgress}
            onItemChange={dashboard.setItemProgress}
            notebookWriting={dashboard.state.notebookWriting}
            onNotebookLog={dashboard.logNotebookCapability}
          />
        );
      case 'autonomy':
        return (
          <AutonomyPage
            autonomyProgress={dashboard.state.autonomyProgress}
            itemProgress={dashboard.state.itemProgress}
            onLevelChange={dashboard.setLevelProgress}
            onItemChange={dashboard.setItemProgress}
          />
        );
      case 'features':
        return (
          <FeatureGroupsPage
            featureProgress={dashboard.state.featureProgress}
            itemProgress={dashboard.state.itemProgress}
            onGroupChange={dashboard.setFeatureGroupProgress}
            onItemChange={dashboard.setItemProgress}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            status={statusWithClock}
            version={props.version}
            isHalted={props.isHalted}
            onToggleHalt={props.onToggleHalt}
            lastError={props.lastError}
            secondReview={dashboard.state.secondReview}
            volume={props.volume}
            onVolumeChange={props.onVolumeChange}
            onHardRefresh={props.onHardRefresh}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="control-room">
      <aside className="control-room__sidebar">
        <div className="control-room__brand">
          <h1>KATE</h1>
          <span>Control Room</span>
        </div>
        <nav className="control-room__nav" aria-label="Dashboard sections">
          {NAV.map(item => (
            <button
              key={item.id}
              type="button"
              className={`control-room__nav-btn ${page === item.id ? 'control-room__nav-btn--active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="control-room__nav-btn control-room__nav-btn--muted"
          onClick={() => window.location.reload()}
          title="Refresh"
        >
          <RotateCcw size={18} />
          <span>Refresh</span>
        </button>
      </aside>

      <div className="control-room__main">
        {showSecondReview && (
          <SecondReviewSignal
            review={dashboard.state.secondReview}
            onAcknowledge={dashboard.acknowledgeReview}
            onFinalApprove={dashboard.finalApproveReview}
            onDismiss={dashboard.dismissReview}
          />
        )}
        <div className="control-room__content">{renderPage()}</div>
      </div>

      <nav className="control-room__mobile-nav" aria-label="Dashboard sections">
        {mobileNavItems.map(item => (
          <button
            key={item.id}
            type="button"
            className={`control-room__mobile-nav-btn ${page === item.id ? 'control-room__mobile-nav-btn--active' : ''}`}
            onClick={() => setPage(item.id)}
            aria-current={page === item.id ? 'page' : undefined}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};


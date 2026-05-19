import React, { useEffect, useState } from 'react';
import {
  Home,
  Target,
  Layers,
  GraduationCap,
  Settings,
  RotateCcw,
} from 'lucide-react';
import type { DashboardPageId } from './types';
import { DASHBOARD_SECTIONS } from './types';
import { useDashboardState } from './hooks/useDashboardState';
import { HomePage } from './pages/HomePage';
import { AutonomyPage } from './pages/AutonomyPage';
import { FeatureGroupsPage } from './pages/FeatureGroupsPage';
import { StudyPage } from './pages/StudyPage';
import { SettingsPage } from './pages/SettingsPage';
import { SecondReviewSignal } from './components/SecondReviewSignal';
import type { NovaStatus } from '../types/nova';
import '../styles/control-room.css';

const SECTION_ICONS: Record<DashboardPageId, React.ReactNode> = {
  home: <Home size={20} />,
  autonomy: <Target size={20} />,
  features: <Layers size={20} />,
  study: <GraduationCap size={20} />,
  settings: <Settings size={20} />,
};

const NAV = DASHBOARD_SECTIONS.map(s => ({
  id: s.id,
  label: s.id === 'home' ? 'Nova home' : s.label,
  icon: SECTION_ICONS[s.id],
}));

export interface ControlRoomShellProps {
  status: NovaStatus;
  version: string;
  isHalted: boolean;
  onToggleHalt: () => void;
  isLiveActive: boolean;
  isConnecting: boolean;
  onToggleVoice: () => void;
  messageCount: number;
  lastError?: string | null;
  volume: number;
  onVolumeChange: (v: number) => void;
  onHardRefresh: () => void;
}

export const ControlRoomShell: React.FC<ControlRoomShellProps> = props => {
  const [page, setPage] = useState<DashboardPageId>('home');

  const goTo = (id: DashboardPageId) => {
    if (DASHBOARD_SECTIONS.some(s => s.id === id)) setPage(id);
  };
  const [clock, setClock] = useState(new Date().toLocaleString());
  const dashboard = useDashboardState();

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleString()), 30_000);
    return () => clearInterval(t);
  }, []);

  const statusWithClock = { ...props.status, currentTime: clock };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return (
          <HomePage
            status={statusWithClock}
            version={props.version}
            isHalted={props.isHalted}
            onToggleHalt={props.onToggleHalt}
            isLiveActive={props.isLiveActive}
            isConnecting={props.isConnecting}
            onToggleVoice={props.onToggleVoice}
            messageCount={props.messageCount}
            lastError={props.lastError}
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
      case 'study':
        return (
          <StudyPage
            itemProgress={dashboard.state.itemProgress}
            onItemChange={dashboard.setItemProgress}
            notebookWriting={dashboard.state.notebookWriting}
            onNotebookLog={dashboard.requestNotebookWrite}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            volume={props.volume}
            onVolumeChange={props.onVolumeChange}
            onHardRefresh={props.onHardRefresh}
            notebookWriting={dashboard.state.notebookWriting}
            onNotebookLog={dashboard.requestNotebookWrite}
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
          <h1>NOVA</h1>
          <span>Control Room</span>
        </div>
        <nav className="control-room__nav" aria-label="Dashboard sections">
          {NAV.map(item => (
            <button
              key={item.id}
              type="button"
              className={`control-room__nav-btn ${page === item.id ? 'control-room__nav-btn--active' : ''}`}
              onClick={() => goTo(item.id)}
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
        <SecondReviewSignal
          review={dashboard.state.secondReview}
          onAcknowledge={dashboard.acknowledgeReview}
          onFinalApprove={dashboard.finalApproveReview}
        />
        <div className="control-room__content">{renderPage()}</div>
      </div>

      <nav className="control-room__mobile-nav" aria-label="Mobile dashboard">
        {NAV.map(item => (
          <button
            key={item.id}
            type="button"
            className={page === item.id ? 'active' : ''}
            onClick={() => goTo(item.id)}
            aria-label={item.label}
          >
            {item.icon}
          </button>
        ))}
      </nav>
    </div>
  );
};

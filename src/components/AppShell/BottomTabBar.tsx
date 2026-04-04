import { useNavigate, useLocation } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useOmnibar } from '../Omnibar/useOmnibar';
import athenaLogo from '../../assets/img/Athena-logo.png';
import './BottomTabBar.css';

const LEFT_TABS = [
  { label: 'Work',     icon: '⚡', path: '/workhub' },
  { label: 'Personal', icon: '🌿', path: '/personalhub' },
] as const;

const RIGHT_TABS = [
  { label: 'Finance',  icon: '💎', path: '/financehub' },
  { label: 'Settings', icon: '⚙️', path: '/settings' },
] as const;

interface BottomTabBarProps {
  highInsightsCount?: number;
}

export function BottomTabBar({ highInsightsCount = 0 }: BottomTabBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { openOmnibar } = useOmnibar();

  const handleTab = async (path: string) => {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* desktop/web */ }
    navigate(path);
  };

  const handleFab = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* desktop/web */ }
    openOmnibar();
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="bottom-tab-bar" aria-label="Main navigation">
      {LEFT_TABS.map(tab => (
        <button
          key={tab.path}
          className={`bottom-tab${isActive(tab.path) ? ' active' : ''}`}
          onClick={() => handleTab(tab.path)}
          aria-label={tab.label}
          aria-current={isActive(tab.path) ? 'page' : undefined}
        >
          <span className="bottom-tab__icon" aria-hidden="true">{tab.icon}</span>
          <span className="bottom-tab__label">{tab.label}</span>
        </button>
      ))}

      <div className="bottom-tab bottom-tab--fab">
        <button
          className="bottom-tab-fab-btn"
          onClick={handleFab}
          aria-label="Open Athenea assistant"
          type="button"
        >
          <img src={athenaLogo} alt="Athenea" />
          {highInsightsCount > 0 && (
            <span className="bottom-tab-fab-badge">
              {highInsightsCount > 9 ? '9+' : highInsightsCount}
            </span>
          )}
        </button>
      </div>

      {RIGHT_TABS.map(tab => (
        <button
          key={tab.path}
          className={`bottom-tab${isActive(tab.path) ? ' active' : ''}`}
          onClick={() => handleTab(tab.path)}
          aria-label={tab.label}
          aria-current={isActive(tab.path) ? 'page' : undefined}
        >
          <span className="bottom-tab__icon" aria-hidden="true">{tab.icon}</span>
          <span className="bottom-tab__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}

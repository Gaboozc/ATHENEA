import { useNavigate, useLocation } from 'react-router-dom';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import athenaLogo from '../../assets/img/Athena-logo.png';
import './BottomTabBar.css';
import { useState } from 'react';
import { MobileHubSheet } from '../Navigation/MobileHubSheet';

const LEFT_TABS = [
  { label: 'Work',     icon: '⚡', path: '/work', sheet: 'work' },
  { label: 'Personal', icon: '🌿', path: '/personal', sheet: 'personal' },
] as const;

const RIGHT_TABS = [
  { label: 'Finance',  icon: '💎', path: '/finance', sheet: 'finance' },
  { label: 'Más',      icon: '➕', path: '/settings', sheet: 'more' },
] as const;

type SheetHub = 'work' | 'personal' | 'finance' | 'more';

interface BottomTabBarProps {
  highInsightsCount?: number;
}

export function BottomTabBar({ highInsightsCount = 0 }: BottomTabBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [pressedPath, setPressedPath] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<SheetHub | null>(null);

  const handleTab = async (path: string) => {
    setPressedPath(path);
    window.setTimeout(() => setPressedPath((prev) => (prev === path ? null : prev)), 160);
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* desktop/web */ }
    navigate(path);
  };

  const handleOpenSheet = async (hub: SheetHub, path: string) => {
    setPressedPath(path);
    window.setTimeout(() => setPressedPath((prev) => (prev === path ? null : prev)), 160);
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* desktop/web */ }
    setActiveSheet(hub);
  };

  const handleHubTap = async (hub: Exclude<SheetHub, 'more'>, path: string) => {
    if (isActive(path)) {
      setActiveSheet((prev) => (prev === hub ? null : hub));
      return;
    }

    setActiveSheet(null);
    await handleTab(path);
  };

  const handleDashboard = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* desktop/web */ }
    setActiveSheet(null);
    navigate('/');
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="bottom-tab-bar" aria-label="Main navigation">
      {LEFT_TABS.map(tab => (
        <button
          key={tab.path}
          className={`bottom-tab${isActive(tab.path) ? ' active' : ''}${pressedPath === tab.path ? ' is-pressed' : ''}`}
          onClick={() => handleHubTap(tab.sheet, tab.path)}
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
          onClick={handleDashboard}
          aria-label="Go to Dashboard"
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
          className={`bottom-tab${isActive(tab.path) ? ' active' : ''}${pressedPath === tab.path ? ' is-pressed' : ''}`}
          onClick={() => (tab.sheet === 'finance' ? handleHubTap('finance', tab.path) : handleOpenSheet(tab.sheet, tab.path))}
          aria-label={tab.label}
          aria-current={isActive(tab.path) ? 'page' : undefined}
        >
          <span className="bottom-tab__icon" aria-hidden="true">{tab.icon}</span>
          <span className="bottom-tab__label">{tab.label}</span>
        </button>
      ))}

      {activeSheet && (
        <MobileHubSheet
          hub={activeSheet}
          onClose={() => setActiveSheet(null)}
        />
      )}
    </nav>
  );
}

import { useEffect } from 'react';
import { TopNavbar } from './TopNavbar';
import { BottomTabBar } from './BottomTabBar';
import './AppShell.css';

interface AppShellProps {
  highInsightsCount?: number;
}

export function AppShell({ highInsightsCount = 0 }: AppShellProps) {
  // Toggle body class so CSS adds correct bottom padding on mobile
  useEffect(() => {
    const update = () => {
      if (window.innerWidth <= 768) document.body.classList.add('has-bottom-tab');
      else document.body.classList.remove('has-bottom-tab');
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      document.body.classList.remove('has-bottom-tab');
    };
  }, []);

  return (
    <>
      <div className="app-shell-top-nav">
        <TopNavbar />
      </div>
      <div className="app-shell-bottom-nav">
        <BottomTabBar highInsightsCount={highInsightsCount} />
      </div>
    </>
  );
}

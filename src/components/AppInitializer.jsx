import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAchievements } from '../../store/slices/statsSlice';
import { showToast } from './Toast';
import { runWelcomeOnboardingToast } from '../modules/intelligence/proactive/welcomeOnboarding';
import { openOmnibarExternally } from './Omnibar/useOmnibar';
import { consumeWidgetPendingAction } from '../services/widgetBridge';
import { syncExternalEvents } from '../../store/slices/calendarSlice.js';

/**
 * AppInitializer - Initialize app features on mount
 * This runs once when the app starts
 */
const AppInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const achievements = useSelector((state) => state.stats?.achievements);

  useEffect(() => {
    // Initialize achievements if they don't exist
    if (!achievements || achievements.length === 0) {
      dispatch(initializeAchievements());
    }
  }, [dispatch, achievements]);

  useEffect(() => {
    runWelcomeOnboardingToast(showToast);
  }, []);

  useEffect(() => {
    const bootstrapWidgetAction = async () => {
      const action = await consumeWidgetPendingAction();
      if (!action?.type) return;

      if (action.type === 'open_omnibar') {
        openOmnibarExternally(action.prompt || '', false);
        return;
      }

      if (action.type === 'open_voice') {
        openOmnibarExternally(action.prompt || '', true);
        return;
      }

      if (action.type === 'complete_task' && action.taskId) {
        dispatch({ type: 'tasks/complete', payload: { id: action.taskId } });
        showToast('Task completed from ATHENEA widget', 'success', 2400, '✓');
        return;
      }

      if (action.type === 'sync_calendar') {
        dispatch(syncExternalEvents({ forceInteractiveAuth: false }));
        showToast('Calendar sync requested from widget', 'info', 2400, '📅');
      }
    };

    bootstrapWidgetAction();
  }, [dispatch]);

  return children;
};

export default AppInitializer;

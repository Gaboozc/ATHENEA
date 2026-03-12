import { useEffect } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { initializeAchievements } from '../../store/slices/statsSlice';
import { showToast } from './Toast';
import { runWelcomeOnboardingToast } from '../modules/intelligence/proactive/welcomeOnboarding';
import { openOmnibarExternally } from './Omnibar/useOmnibar';
import { consumeWidgetPendingAction } from '../services/widgetBridge';
import { syncExternalEvents } from '../../store/slices/calendarSlice.js';
import { getONNXEngine } from '../modules/intelligence/inference/ONNXInferenceEngine';
import { allSkills } from '../modules/intelligence/skills';
import { initializeTacticalObserver } from '../modules/intelligence/TacticalObserver';
import { initializeDeviceMonitor } from '../modules/sensors/DeviceMonitor';
import { initializeInterceptionEngine } from '../modules/intelligence/InterceptionEngine';
import { initializeHealthMonitor } from '../modules/sensors/HealthMonitor';
import { initializeBlackBox } from '../modules/intelligence/BlackBox';
// FASE 2.5: External Data Services
import { externalDataService } from '../modules/intelligence/ExternalDataService';
import { initializeWeatherSync } from '../modules/intelligence/WeatherSync';
import { initializePreFlightBriefing, getPreFlightBriefingGenerator } from '../modules/intelligence/PreFlightBriefing';
// FASE 2.6: Austerity Protocol
import { initializeAusterityProtocol } from '../modules/intelligence/AusterityProtocol';
// FASE 3: Multi-Agent System
import { initializeAgentOrchestrator } from '../modules/intelligence/agents/AgentOrchestrator';
import { initializeShadowChronos } from '../modules/intelligence/ShadowChronos';

/**
 * AppInitializer - Initialize app features on mount
 * This runs once when the app starts
 */
const AppInitializer = ({ children }) => {
  const dispatch = useDispatch();
  const store = useStore();
  const achievements = useSelector((state) => state.stats?.achievements);
  const weatherPreferences = useSelector((state) => state.userSettings?.weatherPreferences);

  const isBootstrapped = () => typeof window !== 'undefined' && window.__atheneaGlobalBootstrapped === true;
  const markBootstrapped = () => {
    if (typeof window !== 'undefined') {
      window.__atheneaGlobalBootstrapped = true;
    }
  };

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
    if (isBootstrapped()) return;
    initializeTacticalObserver(store);
    initializeDeviceMonitor(store);
    initializeInterceptionEngine(store);
    initializeHealthMonitor(store);
    initializeBlackBox(store);
    // FASE 2.5: Initialize external data services
    initializeWeatherSync(store);
    initializePreFlightBriefing(store);
    // FASE 2.6: Initialize Austerity Protocol
    initializeAusterityProtocol(store);
    // FASE 3: Initialize Multi-Agent Orchestrator
    initializeAgentOrchestrator(store);
    // FASE 5: Initialize proactive trend analyzer
    initializeShadowChronos(store);
    markBootstrapped();
  }, [store]);

  useEffect(() => {
    externalDataService.configure({
      weatherApiKey: weatherPreferences?.apiKey || '',
      weatherProvider: weatherPreferences?.apiProvider || 'device-auto',
    });
  }, [weatherPreferences?.apiKey, weatherPreferences?.apiProvider]);

  useEffect(() => {
    const runDailyBriefing = async () => {
      const briefing = getPreFlightBriefingGenerator();
      if (briefing.shouldGenerateBriefing()) {
        await briefing.generateBriefing();
      }
    };

    runDailyBriefing();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const warmupONNX = async () => {
      try {
        const engine = getONNXEngine();
        await engine.initialize();
        if (cancelled) return;
        await engine.precomputeSkillEmbeddings(allSkills);
        if (!cancelled) {
          console.log('[AppInitializer] ONNX warmup completed');
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('[AppInitializer] ONNX warmup failed:', error);
        }
      }
    };

    warmupONNX();

    return () => {
      cancelled = true;
    };
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

import type { DynamicInsight } from './types';

const WELCOME_TOAST_KEY = 'athenea_onboarding_welcome_toast_shown';
const ONBOARDING_COMPLETED_KEY = 'athenea_onboarding_completed';

type ShowToastFn = (
  message: string,
  type?: 'success' | 'error' | 'warning' | 'info',
  duration?: number,
  icon?: string | null
) => unknown;

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function isWelcomeToastShown(): boolean {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(WELCOME_TOAST_KEY) === 'true';
}

export function markWelcomeToastShown(): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(WELCOME_TOAST_KEY, 'true');
}

export function isOnboardingCompleted(): boolean {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
}

export function markOnboardingCompleted(): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}

export function runWelcomeOnboardingToast(showToast: ShowToastFn): void {
  if (isWelcomeToastShown()) return;

  showToast(
    'Welcome to ATHENEA. Tap the floating logo to open Omnibar.',
    'info',
    5200,
    '🧠'
  );
  markWelcomeToastShown();
}

export function getWelcomeOnboardingInsight(): DynamicInsight {
  return {
    id: 'onboarding-welcome-proactive',
    hub: 'WorkHub',
    severity: 'medium',
    title: 'Welcome to ATHENEA',
    description: 'Open Omnibar to run your first work command. Recommended: create your first task.',
    suggestedPrompt: 'Add task Plan sprint kickoff',
    skillId: 'add_task',
    toastMessage: 'Tip: start with a WorkHub command to unlock your workflow momentum.'
  };
}

export function getWelcomeOnboardingInsights(): DynamicInsight[] {
  return [
    getWelcomeOnboardingInsight(),
    {
      id: 'onboarding-work-project',
      hub: 'WorkHub',
      severity: 'low',
      title: 'Kick off a project',
      description: 'Create your first project workspace and define a clear objective.',
      suggestedPrompt: 'Create project ATHENEA Work Sprint',
      skillId: 'create_project',
      toastMessage: 'Project scaffold ready to launch from Omnibar.'
    },
    {
      id: 'onboarding-work-time',
      hub: 'WorkHub',
      severity: 'low',
      title: 'Track execution time',
      description: 'Log your first work session to start measuring delivery rhythm.',
      suggestedPrompt: 'Log 1 hour worked on sprint setup',
      skillId: 'log_time',
      toastMessage: 'Time tracking shortcut ready in WorkHub.'
    }
  ];
}

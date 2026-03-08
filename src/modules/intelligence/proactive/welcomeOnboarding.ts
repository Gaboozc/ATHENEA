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
    'Welcome to ATHENEA. Press Ctrl+K (or tap the floating logo) to open Omnibar.',
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
    description: 'Open Omnibar to run your first command. Try: "Create note My first win".',
    suggestedPrompt: 'Create note My first win',
    skillId: 'create_note',
    toastMessage: 'Tip: use Omnibar to execute your first command and unlock your workflow.'
  };
}

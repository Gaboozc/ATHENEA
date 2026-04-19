const STORAGE_KEY = 'athenea.briefing.lastDate';
const ONBOARDING_KEY = 'athenea.onboarding.completed';

function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeStoredDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return toLocalDateKey(parsed);
}

export const DailyBriefingService = {
  shouldShowBriefing() {
    const onboardingDone = localStorage.getItem(ONBOARDING_KEY);
    if (!onboardingDone) return false;

    const today = toLocalDateKey();
    const lastStored = localStorage.getItem(STORAGE_KEY);
    const lastDate = normalizeStoredDate(lastStored);
    return lastDate !== today;
  },

  markShownToday() {
    localStorage.setItem(STORAGE_KEY, toLocalDateKey());
  },

  markCompletedToday() {
    // Kept for compatibility with existing calls in briefing flow.
    this.markShownToday();
  },

  resetForTesting() {
    localStorage.removeItem(STORAGE_KEY);
  },

  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  },
};

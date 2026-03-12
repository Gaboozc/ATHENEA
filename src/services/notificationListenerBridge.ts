import { registerPlugin } from '@capacitor/core';

export interface InterceptedNotificationPayload {
  id: string;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  postedAt: number;
}

interface NotificationListenerPlugin {
  getStatus(): Promise<{ enabled: boolean; pendingCount: number }>;
  openAccessSettings(): Promise<{ ok: boolean }>;
  pullIntercepted(): Promise<{ notifications: InterceptedNotificationPayload[] }>;
  simulateIntercepted(options: {
    packageName: string;
    appName: string;
    title: string;
    text: string;
  }): Promise<{ ok: boolean }>;
}

const NotificationListener = registerPlugin<NotificationListenerPlugin>('NotificationListener');
const fallbackQueue: InterceptedNotificationPayload[] = [];

export async function getNotificationListenerStatus(): Promise<{
  enabled: boolean;
  pendingCount: number;
}> {
  try {
    return await NotificationListener.getStatus();
  } catch {
    return { enabled: true, pendingCount: fallbackQueue.length };
  }
}

export async function openNotificationAccessSettings(): Promise<void> {
  try {
    await NotificationListener.openAccessSettings();
  } catch {
    // Web fallback: no-op
  }
}

export async function pullInterceptedNotifications(): Promise<InterceptedNotificationPayload[]> {
  try {
    const response = await NotificationListener.pullIntercepted();
    return Array.isArray(response?.notifications) ? response.notifications : [];
  } catch {
    const entries = [...fallbackQueue];
    fallbackQueue.length = 0;
    return entries;
  }
}

export async function simulateInterceptedNotification(payload: {
  packageName: string;
  appName: string;
  title: string;
  text: string;
}): Promise<void> {
  try {
    await NotificationListener.simulateIntercepted(payload);
  } catch {
    fallbackQueue.push({
      id: `web-sim-${Date.now()}`,
      packageName: payload.packageName,
      appName: payload.appName,
      title: payload.title,
      text: payload.text,
      postedAt: Date.now(),
    });
  }
}

/**
 * Notification Engine
 * 
 * Manages tactical notifications based on personaEngine conclusions
 * - Fires alerts based on AI analysis (not just schedules)
 * - Includes action buttons for quick responses
 * - Integrates with @capacitor/local-notifications
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import type { PersonaResponse } from './personaEngine';

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
}

export interface TacticalNotification {
  id: string;
  title: string;
  body: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  actions: NotificationAction[];
  tag?: string; // Group similar notifications
  autoCancel?: boolean;
  timestamp: number;
  sourceInsight?: string; // What persona insight triggered this
}

class NotificationEngine {
  private notificationQueue: Map<string, TacticalNotification> = new Map();
  private actionCallbacks: Map<string, (actionId: string) => void> = new Map();
  private pendingNotifications: Set<string> = new Set();
  private scheduledToLogicalId: Map<string, string> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initializeCapacitor();
  }

  /**
   * Initialize Capacitor local notifications
   */
  private async initializeCapacitor(): Promise<void> {
    try {
      // Request permission for notifications
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'granted') {
        this.initialized = true;
        console.log('[NotificationEngine] Notifications enabled');
        this.setupNotificationListeners();
        this.flushQueuedNotifications();
      } else {
        console.warn('[NotificationEngine] Notification permission denied');
      }
    } catch (error) {
      console.error('[NotificationEngine] Failed to initialize:', error);
    }
  }

  /**
   * Listen for notification actions
   */
  private setupNotificationListeners(): void {
    LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (notification) => {
        const { notification: notif, actionId } = notification;
        const scheduledId = `${notif.id}`;
        const logicalId = this.scheduledToLogicalId.get(scheduledId) || scheduledId;
        
        const callback = this.actionCallbacks.get(logicalId);
        if (callback && actionId) {
          callback(actionId);
          this.pendingNotifications.delete(logicalId);
          this.actionCallbacks.delete(logicalId);
        }
      }
    );
  }

  /**
   * Send queued notifications once native permissions are available.
   */
  private flushQueuedNotifications(): void {
    if (!this.initialized || this.notificationQueue.size === 0) return;

    const queued = Array.from(this.notificationQueue.values());
    this.notificationQueue.clear();

    queued.forEach((notification) => {
      this.sendTacticalNotification(notification).catch((error) => {
        console.error('[NotificationEngine] Failed to flush queued notification:', error);
      });
    });
  }

  /**
   * Generate notifications from persona response
   * Analyzes the AI insight and determines if a notification is warranted
   */
  generateFromPersonaResponse(
    personaResponse: PersonaResponse,
    onAction?: (notificationId: string, actionId: string) => void
  ): void {
    const notifications: TacticalNotification[] = [];

    // Critical task pressure
    if (
      personaResponse.emotionalTone === 'urgent' &&
      personaResponse.agency.opinion
    ) {
      notifications.push(
        this.createUrgentNotification(
          'Task Backlog Alert',
          personaResponse.briefing,
          personaResponse.agency.opinion,
          'backlog'
        )
      );
    }

    // Challenge requiring user response
    if (personaResponse.agency.challengeIfNeeded) {
      notifications.push({
        id: `challenge-${Date.now()}`,
        title: 'AI Perspective',
        body: personaResponse.agency.challengeIfNeeded,
        urgency: 'medium',
        actions: [
          { id: 'acknowledge', title: 'Acknowledge' },
          { id: 'reconsider', title: 'Reconsider' },
        ],
        tag: 'challenge',
        sourceInsight: 'challenge',
        timestamp: Date.now(),
      });
    }

    // Important suggestion requiring action
    if (personaResponse.suggestion && personaResponse.emotionalTone !== 'supportive') {
      notifications.push({
        id: `suggestion-${Date.now()}`,
        title: 'AI Briefing',
        body: personaResponse.suggestion,
        urgency: 'medium',
        actions: [
          { id: 'accept', title: 'Accept' },
          { id: 'defer', title: 'Defer' },
        ],
        tag: 'suggestion',
        sourceInsight: 'suggestion',
        timestamp: Date.now(),
      });
    }

    // Send notifications
    notifications.forEach((notif) => {
      this.sendTacticalNotification(notif, onAction);
    });
  }

  /**
   * Create high-urgency notification
   */
  private createUrgentNotification(
    title: string,
    briefing: string,
    opinion: string,
    tag: string
  ): TacticalNotification {
    return {
      id: `urgent-${Date.now()}`,
      title,
      body: `${briefing}\n\n${opinion}`,
      urgency: 'critical',
      actions: [
        { id: 'accept', title: 'Accept' },
        { id: 'defer', title: 'Defer' },
        { id: 'dismiss', title: 'Dismiss' },
      ],
      tag,
      sourceInsight: 'urgent_analysis',
      timestamp: Date.now(),
    };
  }

  /**
   * Send a tactical notification
   */
  async sendTacticalNotification(
    notification: TacticalNotification,
    onAction?: (notificationId: string, actionId: string) => void
  ): Promise<void> {
    if (!this.initialized) {
      console.warn('[NotificationEngine] Not initialized, queuing notification');
      this.notificationQueue.set(notification.id, notification);
      return;
    }

    try {
      const numericId =
        parseInt(notification.id.replace(/\D/g, '').slice(-8), 10) ||
        Math.floor(Date.now() / 1000);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: numericId,
            title: notification.title,
            body: notification.body,
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: this.getUrgencyColor(notification.urgency),
            autoCancel: notification.autoCancel !== false,
            channelId: 'tactical-alerts',
            schedule: {
              at: new Date(Date.now() + 1000), // Send immediately
            },
          },
        ],
      });

      this.scheduledToLogicalId.set(`${numericId}`, notification.id);

      // Track pending notification
      this.pendingNotifications.add(notification.id);

      // Store callback
      if (onAction) {
        this.actionCallbacks.set(notification.id, (actionId) => {
          onAction(notification.id, actionId);
        });
      }

      // Store in queue
      this.notificationQueue.set(notification.id, notification);

      console.log(
        `[NotificationEngine] Sent notification: ${notification.title} (${notification.urgency})`
      );
    } catch (error) {
      console.error('[NotificationEngine] Failed to send notification:', error);
    }
  }

  /**
   * Get color based on urgency for visual indication
   */
  private getUrgencyColor(urgency: string): string {
    const colors = {
      low: '#4CAF50', // Green
      medium: '#FFC107', // Amber
      high: '#FF9800', // Orange
      critical: '#F44336', // Red
    };
    return colors[urgency as keyof typeof colors] || '#2196F3';
  }

  /**
   * Get pending notifications count
   */
  getPendingCount(): number {
    return this.pendingNotifications.size;
  }

  /**
   * Check if there are unread notifications
   */
  hasUnreadNotifications(): boolean {
    return this.pendingNotifications.size > 0;
  }

  /**
   * Get recent notifications (for Recent Intelligence display)
   */
  getRecentNotifications(count: number = 3): TacticalNotification[] {
    return Array.from(this.notificationQueue.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  /**
   * Clear notification from pending
   */
  clearNotification(id: string): void {
    this.pendingNotifications.delete(id);
    this.actionCallbacks.delete(id);
    Array.from(this.scheduledToLogicalId.entries()).forEach(([scheduledId, logicalId]) => {
      if (logicalId === id) {
        this.scheduledToLogicalId.delete(scheduledId);
      }
    });
  }

  /**
   * Clear all pending notifications
   */
  clearAllNotifications(): void {
    this.pendingNotifications.clear();
    this.actionCallbacks.clear();
  }

  /**
   * Set a callback for a specific notification action
   */
  onNotificationAction(
    notificationId: string,
    callback: (actionId: string) => void
  ): void {
    this.actionCallbacks.set(notificationId, callback);
  }
}

// Singleton instance
let notificationEngineInstance: NotificationEngine | null = null;

export function initializeNotificationEngine(): NotificationEngine {
  if (!notificationEngineInstance) {
    notificationEngineInstance = new NotificationEngine();
  }
  return notificationEngineInstance;
}

export function getNotificationEngine(): NotificationEngine {
  if (!notificationEngineInstance) {
    return initializeNotificationEngine();
  }
  return notificationEngineInstance;
}

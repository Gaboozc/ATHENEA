import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addNotification } from '../store/slices/notificationsSlice';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const STORAGE_KEY = 'athenea.native_notifications.v1';
const TRIGGER_DAYS = [7, 3, 1, 0];

const toDateOnly = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const hashToInt = (text) => {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash % 2147480000) + 1;
};

const loadScheduledIds = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveScheduledIds = (ids) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
};

export const NativeReminderNotifications = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { notes } = useSelector((state) => state.notes);
  const { todos } = useSelector((state) => state.todos);
  const { payments } = useSelector((state) => state.payments);
  const debts = useSelector((state) => state.debts?.debts || []); /* ANDROID-4 */

  const reminders = useMemo(() => {
    const collect = (items, type, dateField) =>
      items
        .map((item) => {
          const dueDate = toDateOnly(item[dateField]);
          if (!dueDate) return null;
          return {
            key: `${type}:${item.id}`,
            title: item.title || item.name || 'Untitled',
            type,
            dueDate,
            extra: type === 'debt'
              ? { debtId: item.id, route: '/finance/debts' }
              : { kind: type },
          };
        })
        .filter(Boolean);

    // ANDROID-4: include active debts with a nextDueDate
    const activeDebts = debts.filter((d) => d.status !== 'completed' && d.nextDueDate);

    return [
      ...collect(notes, 'note', 'reminderDate'),
      ...collect(todos, 'todo', 'dueDate'),
      ...collect(payments, 'payment', 'nextDueDate'),
      ...collect(activeDebts, 'debt', 'nextDueDate'),
    ];
  }, [notes, todos, payments, debts]);

  useEffect(() => {
    const syncNativeNotifications = async () => {
      if (!Capacitor.isNativePlatform()) return;

      try {
        const permissionState = await LocalNotifications.checkPermissions();
        let isGranted = permissionState.display === 'granted';

        if (!isGranted) {
          const requested = await LocalNotifications.requestPermissions();
          isGranted = requested.display === 'granted';
        }

        if (!isGranted) return;

        const now = new Date();
        const notifications = [];

        reminders.forEach((reminder) => {
          TRIGGER_DAYS.forEach((triggerDay) => {
            const scheduleAt = new Date(reminder.dueDate);
            scheduleAt.setDate(scheduleAt.getDate() - triggerDay);
            scheduleAt.setHours(9, 0, 0, 0);

            if (scheduleAt <= now) return;

            const idKey = `${reminder.key}:${triggerDay}:${scheduleAt.toISOString()}`;
            const id = hashToInt(idKey);

            let body = `${reminder.title} is due soon.`;
            if (reminder.type === 'payment') body = `Payment reminder: ${reminder.title}`;
            if (reminder.type === 'todo') body = `Todo reminder: ${reminder.title}`;
            if (reminder.type === 'note') body = `Note reminder: ${reminder.title}`;
            if (reminder.type === 'debt') body = `💳 Pago próximo — ATHENEA: ${reminder.title}`;

            notifications.push({
              id,
              title: 'ATHENEA',
              body,
              schedule: {
                at: scheduleAt,
                allowWhileIdle: true,
              },
              actionTypeId: reminder.type === 'debt' ? 'DEBT_REMINDER' : undefined,
              extra: reminder.extra,
            });
          });
        });

        const previousIds = loadScheduledIds();
        const nextIds = notifications.map((notification) => notification.id);
        const toCancel = previousIds
          .filter((id) => !nextIds.includes(id))
          .map((id) => ({ id }));

        if (toCancel.length > 0) {
          await LocalNotifications.cancel({ notifications: toCancel });
        }

        if (notifications.length > 0) {
          await LocalNotifications.schedule({ notifications });

          // Mirror today's & overdue reminders into the in-app Notifications store
          const todayMidnight = new Date();
          todayMidnight.setHours(0, 0, 0, 0);
          notifications.forEach((n) => {
            const schedAt = n.schedule?.at;
            // Only include notifications scheduled for today (9AM) or already past
            if (!schedAt || schedAt > new Date(todayMidnight.getTime() + 86400000)) return;
            dispatch(addNotification({
              id: `reminder-native-${n.id}`,
              title: 'ATHENEA',
              body: n.body,
              urgency: 'medium',
              source: 'reminder',
              timestamp: schedAt.getTime(),
            }));
          });
        }

        saveScheduledIds(nextIds);
      } catch (error) {
        console.error('Failed to sync native reminders', error);
      }
    };

    syncNativeNotifications();

    // ANDROID-4: navigate when user taps a notification
    let actionListener = null;
    if (Capacitor.isNativePlatform()) {
      actionListener = LocalNotifications.addListener(
        'localNotificationActionPerformed',
        (event) => {
          const route = event.notification?.extra?.route;
          if (route) navigate(route);
        }
      );
    }

    return () => {
      if (actionListener) actionListener.then((l) => l.remove());
    };
  }, [reminders, navigate]);

  return null;
};

export default NativeReminderNotifications;

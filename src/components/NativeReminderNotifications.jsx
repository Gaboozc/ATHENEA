import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
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
  const { notes } = useSelector((state) => state.notes);
  const { todos } = useSelector((state) => state.todos);
  const { payments } = useSelector((state) => state.payments);

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
          };
        })
        .filter(Boolean);

    return [
      ...collect(notes, 'note', 'reminderDate'),
      ...collect(todos, 'todo', 'dueDate'),
      ...collect(payments, 'payment', 'nextDueDate'),
    ];
  }, [notes, todos, payments]);

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

            notifications.push({
              id,
              title: 'ATHENEA',
              body,
              schedule: {
                at: scheduleAt,
                allowWhileIdle: true,
              },
              extra: {
                kind: reminder.type,
              },
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
        }

        saveScheduledIds(nextIds);
      } catch (error) {
        console.error('Failed to sync native reminders', error);
      }
    };

    syncNativeNotifications();
  }, [reminders]);

  return null;
};

export default NativeReminderNotifications;

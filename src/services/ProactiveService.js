/**
 * ProactiveService — Notificaciones diarias inteligentes de ATHENEA
 *
 * Programa 6 notificaciones diarias a horas estratégicas.
 * Al tocar una notificación, abre el Omnibar con el mensaje correspondiente
 * pre-cargado en el input.
 *
 * Patrón de LocalNotifications idéntico al de notificationEngine.ts.
 * Solo funciona en plataforma nativa (Android). En web es silencioso.
 *
 * IDs reservados: 7001–7006 (sin colisión con notificationEngine.ts
 * que usa IDs hash-dinámicos de 8+ dígitos).
 */

import { MemoryService } from './MemoryService.js';

// ─── Schedule de notificaciones ───────────────────────────────────────────────

const SCHEDULE = [
  {
    id:      7001,
    hour:    7,
    minute:  0,
    message: 'Buenos días. ¿Ya tienes tu café? Dime qué tienes planeado hoy.',
  },
  {
    id:      7002,
    hour:    9,
    minute:  0,
    message: '¿Ya anotaste lo que gastaste ayer?',
  },
  {
    id:      7003,
    hour:    13,
    minute:  0,
    message: '¿Cómo va el día? Cuéntame.',
  },
  {
    id:      7004,
    hour:    18,
    minute:  0,
    message: 'Hora de cerrar. ¿Qué completaste? ¿Qué quedó pendiente?',
  },
  {
    id:      7005,
    hour:    21,
    minute:  0,
    message: 'Recuerda registrar tus gastos de hoy.',
  },
  {
    id:      7006,
    hour:    22,
    minute:  30,
    message: '¿A qué hora piensas dormir? SHODAN necesita saberlo.',
  },
];

const PROACTIVE_IDS = SCHEDULE.map(e => e.id);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calcula la próxima ocurrencia de una hora específica (hoy o mañana).
 * @param {number} hour
 * @param {number} minute
 * @returns {Date}
 */
function nextOccurrenceOf(hour, minute) {
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

// ─── API pública ──────────────────────────────────────────────────────────────

let _listenerRegistered = false;

/**
 * Inicializa el schedule de notificaciones proactivas diarias.
 * Incluye dedup guard: no reprograma si los 6 IDs ya están pendientes.
 *
 * Solo ejecuta en plataforma nativa (Capacitor Android).
 * En web retorna silenciosamente sin error.
 *
 * @param {object} _store  Redux store (reservado para uso futuro, no usado actualmente)
 */
export async function initProactiveSchedule(_store) {
  if (!window?.Capacitor?.isNativePlatform?.()) {
    return; // silencioso en web/dev
  }

  let LocalNotifications;
  try {
    ({ LocalNotifications } = await import('@capacitor/local-notifications'));
  } catch (err) {
    console.warn('[ProactiveService] No se pudo cargar LocalNotifications:', err);
    return;
  }

  // Solicitar permisos
  try {
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== 'granted') {
      console.log('[ProactiveService] Permiso de notificaciones no concedido.');
      return;
    }
  } catch {
    return;
  }

  // Dedup guard: si todos los IDs ya están programados, no reprogramar
  try {
    const pending = await LocalNotifications.getPending();
    const existingIds = new Set((pending?.notifications ?? []).map(n => n.id));
    if (PROACTIVE_IDS.every(id => existingIds.has(id))) {
      console.log('[ProactiveService] Schedule ya configurado, omitiendo.');
      _registerTapListener(LocalNotifications);
      return;
    }
  } catch {
    /* continuar con la programación */
  }

  // Cancelar schedule parcial anterior para reprogramar limpio
  try {
    await LocalNotifications.cancel({
      notifications: PROACTIVE_IDS.map(id => ({ id })),
    });
  } catch {
    /* ignorar si no había nada que cancelar */
  }

  // Programar las 6 notificaciones diarias
  try {
    await LocalNotifications.schedule({
      notifications: SCHEDULE.map(entry => ({
        id:       entry.id,
        title:    'ATHENEA',
        body:     entry.message,
        schedule: {
          at:             nextOccurrenceOf(entry.hour, entry.minute),
          every:          'day',
          allowWhileIdle: true,
        },
        smallIcon:  'ic_stat_icon_config_sample',
        channelId:  'tactical-alerts',
        autoCancel: true,
      })),
    });
    console.log('[ProactiveService] 6 notificaciones proactivas programadas.');
  } catch (err) {
    console.warn('[ProactiveService] Error al programar notificaciones:', err);
    return;
  }

  _registerTapListener(LocalNotifications);
}

/**
 * Registra el listener de tap de notificaciones.
 * Usa import dinámico de openOmnibarExternally para evitar
 * dependencias circulares en el bundle.
 *
 * @param {object} LocalNotifications
 */
function _registerTapListener(LocalNotifications) {
  if (_listenerRegistered) return;
  _listenerRegistered = true;

  LocalNotifications.addListener('localNotificationActionPerformed', async (event) => {
    const id = event?.notification?.id;
    const entry = SCHEDULE.find(e => e.id === id);
    if (!entry) return;

    try {
      // openOmnibarExternally pre-carga el mensaje en el input del Omnibar
      const { openOmnibarExternally } = await import('../components/Omnibar/useOmnibar.ts');
      openOmnibarExternally(entry.message, false);

      // Marcar inicio de sesión
      MemoryService.saveLastSession().catch(() => {});
    } catch (err) {
      console.warn('[ProactiveService] Error al abrir Omnibar desde notificación:', err);
    }
  });
}

/**
 * Cancela todas las notificaciones proactivas programadas.
 */
export async function cancelAll() {
  if (!window?.Capacitor?.isNativePlatform?.()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({
      notifications: PROACTIVE_IDS.map(id => ({ id })),
    });
    console.log('[ProactiveService] Notificaciones proactivas canceladas.');
  } catch (err) {
    console.warn('[ProactiveService] Error al cancelar notificaciones:', err);
  }
}

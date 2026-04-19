export const TASK_STATES = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado',
  BLOCKED: 'Bloqueado',
  CANCELLED: 'Cancelado',
};

export const TASK_STATE_LABELS = {
  Pendiente: 'Pendiente',
  'En progreso': 'En progreso',
  Completado: 'Completado',
  Bloqueado: 'Bloqueado',
  Cancelado: 'Cancelado',
};

export const TASK_STATE_COLORS = {
  Pendiente: 'var(--text-tertiary)',
  'En progreso': 'var(--accent)',
  Completado: 'var(--color-success)',
  Bloqueado: 'var(--color-danger)',
  Cancelado: 'var(--text-tertiary)',
};

const LEGACY_TO_NORMALIZED = {
  pending: TASK_STATES.PENDING,
  Pending: TASK_STATES.PENDING,
  Pendiente: TASK_STATES.PENDING,
  'In Progress': TASK_STATES.IN_PROGRESS,
  'En Curso': TASK_STATES.IN_PROGRESS,
  'En progreso': TASK_STATES.IN_PROGRESS,
  Completed: TASK_STATES.COMPLETED,
  completed: TASK_STATES.COMPLETED,
  Completado: TASK_STATES.COMPLETED,
  done: TASK_STATES.COMPLETED,
  blocked: TASK_STATES.BLOCKED,
  Blocked: TASK_STATES.BLOCKED,
  Bloqueado: TASK_STATES.BLOCKED,
  cancelled: TASK_STATES.CANCELLED,
  Cancelled: TASK_STATES.CANCELLED,
  Cancelado: TASK_STATES.CANCELLED,
};

export const normalizeTaskState = (state) => {
  if (!state) return TASK_STATES.PENDING;
  return LEGACY_TO_NORMALIZED[state] || state;
};

export const TASK_STATE_VALUES = Object.values(TASK_STATES);

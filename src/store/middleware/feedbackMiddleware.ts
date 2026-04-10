/* FIX UX-3 — Toast universal para acciones CRUD
 * Observa las acciones de Redux y emite feedback visual
 * sin necesidad de modificar los componentes individuales.
 */
import { showToast } from '../../components/Toast/Toast';

/** Map acción → mensaje de feedback (action.type exactos del proyecto) */
const FEEDBACK_MAP: Record<string, string> = {
  // Notes
  'notes/addNote':    '📝 Nota guardada',
  'notes/updateNote': '📝 Nota actualizada',
  'notes/deleteNote': '🗑 Nota eliminada',
  'notes/togglePinNote': '📌 Nota actualizada',
  'notes/addTag': '🏷 Etiqueta actualizada',

  // Todos
  'todos/addTodo':      '✅ Tarea agregada',
  'todos/deleteTodo':   '🗑 Tarea eliminada',
  'todos/setTodoStatus':'✅ Tarea actualizada',
  'todos/setTodoProgress': '📈 Progreso de tarea actualizado',
  'todos/updateTodo': '✏️ Tarea editada',

  // Payments
  'payments/addPayment':    '💳 Pago registrado',
  'payments/deletePayment': '🗑 Pago eliminado',
  'payments/markPaymentPaid':'✅ Pago marcado como pagado',
  'payments/recordExpense': '💸 Gasto registrado',
  'payments/recordIncome':  '💰 Ingreso registrado',

  // Tasks (tasksSlice + GatekeeperModal)
  'tasks/addTask':     '📋 Tarea creada',
  'tasks/addSubtask':  '🧩 Subtarea creada',
  'tasks/updateTask':  '✏️ Tarea actualizada',
  'tasks/rescheduleTask': '🗓 Fecha de tarea actualizada',
  'tasks/completeTask':'✅ Tarea completada',
  'tasks/restoreTask': '↩️ Tarea reactivada',
  'tasks/logTime':     '⏱ Tiempo registrado',

  // Projects
  'projects/addProject':    '🚀 Proyecto creado',
  'projects/updateProject': '✏️ Proyecto actualizado',
  'projects/setProjectPhase': '🧭 Fase de proyecto actualizada',
  'projects/addMeetingNote': '🗒 Nota de reunion agregada',
  'projects/deleteMeetingNote': '🗑 Nota de reunion eliminada',
  'projects/deleteProject': '🗑 Proyecto eliminado',

  // Budget
  'budget/addExpense':  '💸 Gasto en presupuesto registrado',
  'budget/addCategory': '🗂 Categoría agregada',
  'budget/addIncome':   '💰 Ingreso registrado',
  'budget/deleteExpense':'🗑 Gasto eliminado',
};

export const feedbackMiddleware =
  (_store: any) => (next: any) => (action: any) => {
    const result = next(action);
    const message = FEEDBACK_MAP[action?.type];
    if (message) {
      showToast(message, 'success', 2500);
    }
    return result;
  };

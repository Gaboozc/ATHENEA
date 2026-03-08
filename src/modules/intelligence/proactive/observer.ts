import type { CanvasArtifact } from '../types';
import type { DynamicInsight, ProactiveAnalysisResult } from './types';
import { getGhostWriteSnapshot } from '../ghostWrite';
import { getWelcomeOnboardingInsight, isOnboardingCompleted } from './welcomeOnboarding';

const COMPLETED_STATUSES = new Set(['completed', 'done', 'paid', 'resolved']);

const dayStart = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const toDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const firstArray = (...candidates: unknown[]): any[] => {
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const overlaps = (startA: Date, endA: Date, startB: Date, endB: Date) =>
  startA.getTime() < endB.getTime() && startB.getTime() < endA.getTime();

const buildRecordPaymentArtifact = (payment: any): CanvasArtifact => ({
  type: 'form',
  props: {
    title: 'Record Payment',
    description: `Payment "${payment.name || 'Untitled payment'}" is overdue. Confirm details and mark as paid.`,
    fields: [
      {
        id: 'paymentId',
        label: 'Payment ID',
        type: 'text',
        value: payment.id ?? '',
        required: true
      },
      {
        id: 'name',
        label: 'Payment Name',
        type: 'text',
        value: payment.name ?? '',
        required: true
      },
      {
        id: 'amount',
        label: 'Amount',
        type: 'number',
        value: Number(payment.amount || 0),
        required: true
      },
      {
        id: 'dueDate',
        label: 'Due Date',
        type: 'date',
        value: payment.nextDueDate ? String(payment.nextDueDate).slice(0, 10) : '',
        required: false
      },
      {
        id: 'paidAt',
        label: 'Paid At',
        type: 'date',
        value: new Date().toISOString().slice(0, 10),
        required: true
      }
    ],
    actionLabel: 'Record as Paid',
    cancelLabel: 'Dismiss'
  }
});

export function analyzeStoreForInsights(storeState: any): ProactiveAnalysisResult {
  const now = dayStart(new Date());
  const insights: DynamicInsight[] = [];

  if (!isOnboardingCompleted()) {
    insights.push(getWelcomeOnboardingInsight());
  }

  const tasks = firstArray(
    storeState?.tasks?.tasks,
    storeState?.tasks,
    storeState?.work?.tasks,
    storeState?.todos?.todos,
    storeState?.todos
  );

  const overdueTask = tasks.find((task: any) => {
    const due = toDate(task?.dueDate || task?.deadline || task?.targetDate);
    if (!due) return false;
    const status = String(task?.status || '').toLowerCase();
    return dayStart(due) < now && !COMPLETED_STATUSES.has(status);
  });

  if (overdueTask) {
    insights.push({
      id: `work-overdue-${overdueTask.id ?? 'unknown'}`,
      hub: 'WorkHub',
      severity: 'high',
      title: 'Overdue task detected',
      description: `${overdueTask.title || 'A task'} is overdue. Suggested action: reschedule it now.`,
      suggestedPrompt: `Reschedule task ${overdueTask.title || ''} to tomorrow`,
      skillId: 'add_task',
      artifact: {
        type: 'form',
        props: {
          title: 'Reschedule Task',
          description: 'Update due date for overdue task',
          fields: [
            {
              id: 'taskId',
              label: 'Task ID',
              type: 'text',
              value: overdueTask.id ?? '',
              required: true
            },
            {
              id: 'title',
              label: 'Task',
              type: 'text',
              value: overdueTask.title ?? '',
              required: true
            },
            {
              id: 'newDueDate',
              label: 'New Due Date',
              type: 'date',
              value: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
              required: true
            }
          ],
          actionLabel: 'Reschedule',
          cancelLabel: 'Later'
        }
      },
      action: {
        type: 'tasks/reschedule',
        payload: {
          id: overdueTask.id,
          dueDate: new Date(Date.now() + 86400000).toISOString()
        }
      },
      toastMessage: 'Hey, encontré una tarea vencida. Te dejé una sugerencia en Omnibar.'
    });
  }

  const calendarEvents = firstArray(storeState?.calendar?.events, storeState?.calendar).filter(
    (event: any) => event?.provider === 'google'
  );

  const taskConflict = tasks.find((task: any) => {
    const taskDue = toDate(task?.dueDate || task?.deadline || task?.targetDate);
    if (!taskDue) return false;
    const taskStart = new Date(taskDue.getTime() - 60 * 60 * 1000);
    const taskEnd = new Date(taskDue.getTime() + 60 * 60 * 1000);

    return calendarEvents.some((event: any) => {
      const eventStart = toDate(event?.startDate);
      const eventEnd = toDate(event?.endDate || event?.startDate);
      if (!eventStart || !eventEnd) return false;
      return overlaps(taskStart, taskEnd, eventStart, eventEnd);
    });
  });

  if (taskConflict) {
    insights.push({
      id: `calendar-overlap-${taskConflict.id || 'task'}`,
      hub: 'WorkHub',
      severity: 'high',
      title: 'Schedule conflict detected',
      description: `Task "${taskConflict.title || 'Untitled task'}" overlaps with a Google Calendar event.`,
      suggestedPrompt: `Reschedule task ${taskConflict.title || ''} to avoid calendar overlap`,
      skillId: 'add_task',
      action: {
        type: 'tasks/reschedule',
        payload: {
          id: taskConflict.id,
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        }
      },
      toastMessage: 'Choque de horario detectado entre tareas y Google Calendar.'
    });
  }

  const categories = firstArray(storeState?.budget?.categories);
  const budgetLimit = categories.reduce((sum, category) => sum + Number(category?.limit || 0), 0);
  const explicitBalance = Number(
    storeState?.finance?.balance ??
    storeState?.budget?.balance ??
    storeState?.financeHub?.balance ??
    0
  );

  if (budgetLimit > 0 && explicitBalance > 0 && explicitBalance < budgetLimit * 0.1) {
    insights.push({
      id: 'finance-low-balance',
      hub: 'FinanceHub',
      severity: 'high',
      title: 'Low balance risk',
      description: `Your balance is below 10% of your budget limit (${explicitBalance.toFixed(2)} / ${budgetLimit.toFixed(2)}).`,
      suggestedPrompt: 'Review budget and reduce non-essential categories',
      skillId: 'set_budget',
      toastMessage: 'Hey, he notado algo en tus finanzas. ¿Revisamos la Omnibar?'
    });
  }

  const payments = firstArray(storeState?.payments?.payments, storeState?.payments);
  const overduePayment = payments.find((payment: any) => {
    const due = toDate(payment?.nextDueDate || payment?.dueDate);
    if (!due) return false;
    const status = String(payment?.status || '').toLowerCase();
    const markedPaid = Boolean(payment?.paid || payment?.isPaid || status === 'paid');
    return dayStart(due) < now && !markedPaid;
  });

  if (overduePayment) {
    insights.push({
      id: `finance-overdue-payment-${overduePayment.id ?? 'unknown'}`,
      hub: 'FinanceHub',
      severity: 'high',
      title: 'Overdue payment found',
      description: `${overduePayment.name || 'A payment'} is overdue. Record it now to keep finances accurate.`,
      suggestedPrompt: `Record payment for ${overduePayment.name || 'overdue item'}`,
      skillId: 'record_payment',
      artifact: buildRecordPaymentArtifact(overduePayment),
      action: {
        type: 'payments/markPaid',
        payload: {
          id: overduePayment.id,
          paidAt: new Date().toISOString()
        }
      },
      toastMessage: 'Hey, he notado un pago atrasado. Te preparé el artifact en la Omnibar.'
    });
  }

  const notes = firstArray(storeState?.notes?.notes, storeState?.notes);
  const untaggedNote = notes.find((note: any) => !Array.isArray(note?.tags) || note.tags.length === 0);

  if (untaggedNote) {
    insights.push({
      id: `personal-untagged-note-${untaggedNote.id ?? 'unknown'}`,
      hub: 'PersonalHub',
      severity: 'medium',
      title: 'Untagged note',
      description: `"${untaggedNote.title || 'Untitled note'}" has no tags. Adding tags will improve recall.`,
      suggestedPrompt: `Add tags to note ${untaggedNote.title || ''}`,
      skillId: 'create_note'
    });
  }

  const upcomingImportantEvent = calendarEvents
    .filter((event: any) => {
      const start = toDate(event?.startDate);
      if (!start) return false;
      const diff = start.getTime() - Date.now();
      if (diff < 0 || diff > 1000 * 60 * 60 * 24) return false;
      const title = String(event?.title || '').toLowerCase();
      return event?.importance === 'high' || /meeting|interview|demo|presentation|deadline|client/.test(title);
    })
    .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

  if (upcomingImportantEvent) {
    const title = String(upcomingImportantEvent.title || '').toLowerCase();
    const preparedNote = notes.find((note: any) => {
      const noteText = `${note?.title || ''} ${note?.content || ''}`.toLowerCase();
      const tags = Array.isArray(note?.tags) ? note.tags.map((tag: any) => String(tag).toLowerCase()) : [];
      return (
        noteText.includes(title.slice(0, 12)) ||
        tags.includes('prep') ||
        tags.includes('meeting') ||
        tags.includes('calendar')
      );
    });

    if (!preparedNote) {
      insights.push({
        id: `calendar-prep-${upcomingImportantEvent.id || 'event'}`,
        hub: 'PersonalHub',
        severity: 'medium',
        title: 'Upcoming important event needs preparation',
        description: `"${upcomingImportantEvent.title || 'Event'}" is coming soon and no preparation note was found.`,
        suggestedPrompt: `Create note to prepare for ${upcomingImportantEvent.title || 'important event'}`,
        skillId: 'create_note',
        toastMessage: 'Tienes un evento importante sin nota de preparación.'
      });
    }
  }

  const ghost = getGhostWriteSnapshot();
  if (ghost.hasDraft && ghost.suggestedTags.length > 0) {
    insights.push({
      id: `ghost-write-${ghost.draft.noteId || 'draft'}`,
      hub: 'PersonalHub',
      severity: 'medium',
      title: 'Ghost Write tag suggestion',
      description: `Detected tags from your current note draft: ${ghost.suggestedTags.map((tag) => `#${tag}`).join(', ')}`,
      suggestedPrompt: `Apply tags ${ghost.suggestedTags.join(', ')} to my current note`,
      skillId: 'create_note',
      action: ghost.draft.noteId
        ? {
            type: 'notes/addTag',
            payload: {
              id: ghost.draft.noteId,
              tags: ghost.suggestedTags
            }
          }
        : undefined,
      toastMessage: 'Detecte etiquetas para tu nota activa. Te las deje en Omnibar.'
    });
  }

  return {
    generatedAt: Date.now(),
    insights: insights.slice(0, 8)
  };
}

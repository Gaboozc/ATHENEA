import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import { addNote } from '../../store/slices/notesSlice';
import { addTodo } from '../../store/slices/todosSlice';
import { addPayment } from '../../store/slices/paymentsSlice';
import { linkNoteToCalendar, linkTodoToCalendar, linkPaymentToCalendar } from '../../store/slices/calendarSlice';
import './Inbox.css';

const buildId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const Inbox = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const [activeType, setActiveType] = useState('note');

  const [noteData, setNoteData] = useState({ title: '', content: '', reminderDate: '' });
  const [todoData, setTodoData] = useState({ title: '', notes: '', dueDate: '', priority: 'normal' });
  const [paymentData, setPaymentData] = useState({
    name: '',
    amount: '',
    currency: 'USD',
    frequency: 'monthly',
    nextDueDate: '',
    notes: '',
  });

  const handleCreateNote = (event) => {
    event.preventDefault();
    const newId = buildId('note');
    dispatch(addNote({ id: newId, ...noteData, reminderDate: noteData.reminderDate || null }));
    if (noteData.reminderDate) {
      dispatch(linkNoteToCalendar({
        noteId: newId,
        noteTitle: noteData.title || t('Untitled Note'),
        date: noteData.reminderDate,
      }));
    }
    setNoteData({ title: '', content: '', reminderDate: '' });
  };

  const handleCreateTodo = (event) => {
    event.preventDefault();
    const newId = buildId('todo');
    dispatch(addTodo({ id: newId, ...todoData, dueDate: todoData.dueDate || null }));
    if (todoData.dueDate) {
      dispatch(linkTodoToCalendar({
        todoId: newId,
        todoTitle: todoData.title || t('Untitled Todo'),
        dueDate: todoData.dueDate,
      }));
    }
    setTodoData({ title: '', notes: '', dueDate: '', priority: 'normal' });
  };

  const handleCreatePayment = (event) => {
    event.preventDefault();
    const newId = buildId('payment');
    const payload = {
      ...paymentData,
      id: newId,
      amount: paymentData.amount ? Number(paymentData.amount) : 0,
      nextDueDate: paymentData.nextDueDate || new Date().toISOString(),
    };
    dispatch(addPayment(payload));
    if (paymentData.nextDueDate) {
      dispatch(linkPaymentToCalendar({
        paymentId: newId,
        paymentTitle: paymentData.name || t('Untitled Payment'),
        dueDate: paymentData.nextDueDate,
      }));
    }
    setPaymentData({ name: '', amount: '', currency: 'USD', frequency: 'monthly', nextDueDate: '', notes: '' });
  };

  return (
    <div className="inbox-container">
      <header className="inbox-header">
        <h1>{t('Inbox')}</h1>
        <p>{t('Capture everything. Sort later.')}</p>
      </header>

      <div className="inbox-tabs">
        <button
          type="button"
          className={`inbox-tab${activeType === 'note' ? ' active' : ''}`}
          onClick={() => setActiveType('note')}
        >
          {t('Note')}
        </button>
        <button
          type="button"
          className={`inbox-tab${activeType === 'todo' ? ' active' : ''}`}
          onClick={() => setActiveType('todo')}
        >
          {t('Todo')}
        </button>
        <button
          type="button"
          className={`inbox-tab${activeType === 'payment' ? ' active' : ''}`}
          onClick={() => setActiveType('payment')}
        >
          {t('Payment')}
        </button>
      </div>

      {activeType === 'note' && (
        <form className="inbox-card" onSubmit={handleCreateNote}>
          <label>
            {t('Title')}
            <input
              type="text"
              value={noteData.title}
              onChange={(e) => setNoteData({ ...noteData, title: e.target.value })}
              placeholder={t('Note title')}
            />
          </label>
          <label>
            {t('Content')}
            <textarea
              rows="4"
              value={noteData.content}
              onChange={(e) => setNoteData({ ...noteData, content: e.target.value })}
              placeholder={t('Write your note...')}
              required
            />
          </label>
          <label>
            {t('Reminder Date')} ({t('optional')})
            <input
              type="date"
              value={noteData.reminderDate}
              onChange={(e) => setNoteData({ ...noteData, reminderDate: e.target.value })}
            />
          </label>
          <button type="submit" className="inbox-submit">
            {t('Add Note')}
          </button>
        </form>
      )}

      {activeType === 'todo' && (
        <form className="inbox-card" onSubmit={handleCreateTodo}>
          <label>
            {t('Title')}
            <input
              type="text"
              value={todoData.title}
              onChange={(e) => setTodoData({ ...todoData, title: e.target.value })}
              placeholder={t('Todo title')}
              required
            />
          </label>
          <label>
            {t('Notes')}
            <textarea
              rows="3"
              value={todoData.notes}
              onChange={(e) => setTodoData({ ...todoData, notes: e.target.value })}
              placeholder={t('What needs to be done?')}
            />
          </label>
          <div className="inbox-row">
            <label>
              {t('Due Date')} ({t('optional')})
              <input
                type="date"
                value={todoData.dueDate}
                onChange={(e) => setTodoData({ ...todoData, dueDate: e.target.value })}
              />
            </label>
            <label>
              {t('Priority')}
              <select
                value={todoData.priority}
                onChange={(e) => setTodoData({ ...todoData, priority: e.target.value })}
              >
                <option value="low">{t('Low')}</option>
                <option value="normal">{t('Normal')}</option>
                <option value="high">{t('High')}</option>
              </select>
            </label>
          </div>
          <button type="submit" className="inbox-submit">
            {t('Add Todo')}
          </button>
        </form>
      )}

      {activeType === 'payment' && (
        <form className="inbox-card" onSubmit={handleCreatePayment}>
          <label>
            {t('Payment name')}
            <input
              type="text"
              value={paymentData.name}
              onChange={(e) => setPaymentData({ ...paymentData, name: e.target.value })}
              placeholder={t('Rent, subscription, invoice...')}
              required
            />
          </label>
          <div className="inbox-row">
            <label>
              {t('Amount')}
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </label>
            <label>
              {t('Currency')}
              <input
                type="text"
                value={paymentData.currency}
                onChange={(e) => setPaymentData({ ...paymentData, currency: e.target.value.toUpperCase() })}
              />
            </label>
          </div>
          <div className="inbox-row">
            <label>
              {t('Frequency')}
              <select
                value={paymentData.frequency}
                onChange={(e) => setPaymentData({ ...paymentData, frequency: e.target.value })}
              >
                <option value="weekly">{t('Weekly')}</option>
                <option value="monthly">{t('Monthly')}</option>
                <option value="yearly">{t('Yearly')}</option>
              </select>
            </label>
            <label>
              {t('Next Due Date')}
              <input
                type="date"
                value={paymentData.nextDueDate}
                onChange={(e) => setPaymentData({ ...paymentData, nextDueDate: e.target.value })}
                required
              />
            </label>
          </div>
          <label>
            {t('Notes')}
            <textarea
              rows="3"
              value={paymentData.notes}
              onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
              placeholder={t('Optional details')}
            />
          </label>
          <button type="submit" className="inbox-submit">
            {t('Add Payment')}
          </button>
        </form>
      )}
    </div>
  );
};

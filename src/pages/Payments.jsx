import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import { addPayment, deletePayment, markPaymentPaid } from '../../store/slices/paymentsSlice';
import { linkPaymentToCalendar, unlinkFromCalendar } from '../../store/slices/calendarSlice';
import './Payments.css';

export const Payments = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { payments } = useSelector((state) => state.payments);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'USD',
    frequency: 'monthly',
    nextDueDate: '',
    notes: '',
  });

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate));
  }, [payments]);

  const getFrequencyLabel = (frequency) => {
    if (frequency === 'weekly') return t('Weekly');
    if (frequency === 'yearly') return t('Yearly');
    return t('Monthly');
  };

  const advanceByFrequency = (dateIso, frequency) => {
    const base = new Date(dateIso);
    if (frequency === 'weekly') {
      base.setDate(base.getDate() + 7);
    } else if (frequency === 'yearly') {
      base.setFullYear(base.getFullYear() + 1);
    } else {
      const day = base.getDate();
      base.setMonth(base.getMonth() + 1);
      if (base.getDate() < day) {
        base.setDate(0);
      }
    }
    return base.toISOString();
  };

  const handleAdd = (event) => {
    event.preventDefault();
    const newId = `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    dispatch(addPayment({
      id: newId,
      ...formData,
      amount: formData.amount ? Number(formData.amount) : 0,
      nextDueDate: formData.nextDueDate || new Date().toISOString(),
    }));
    if (formData.nextDueDate) {
      dispatch(linkPaymentToCalendar({
        paymentId: newId,
        paymentTitle: formData.name || t('Untitled Payment'),
        dueDate: formData.nextDueDate,
      }));
    }
    setFormData({ name: '', amount: '', currency: 'USD', frequency: 'monthly', nextDueDate: '', notes: '' });
  };

  const handlePaid = (payment) => {
    const nextDueDate = advanceByFrequency(payment.nextDueDate, payment.frequency);
    dispatch(markPaymentPaid({ id: payment.id }));
    dispatch(linkPaymentToCalendar({
      paymentId: payment.id,
      paymentTitle: payment.name,
      dueDate: nextDueDate,
    }));
  };

  const handleDelete = (payment) => {
    if (confirm(t('Delete this payment?'))) {
      dispatch(deletePayment(payment.id));
      dispatch(unlinkFromCalendar({ relatedId: payment.id, relatedType: 'payment' }));
    }
  };

  return (
    <div className="payments-container">
      <header className="payments-header">
        <div>
          <h1>{t('Payments')}</h1>
          <p>{t('Track recurring and upcoming payments.')}</p>
        </div>
        <span className="payments-count">{payments.length}</span>
      </header>

      <form className="payments-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('Payment name')}
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder={t('Amount')}
          required
        />
        <input
          type="date"
          value={formData.nextDueDate}
          onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
          required
        />
        <select
          value={formData.frequency}
          onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
        >
          <option value="weekly">{t('Weekly')}</option>
          <option value="monthly">{t('Monthly')}</option>
          <option value="yearly">{t('Yearly')}</option>
        </select>
        <input
          type="text"
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
          placeholder={t('Currency')}
        />
        <button type="submit">{t('Add Payment')}</button>
      </form>

      <section className="payments-list">
        {sortedPayments.length === 0 ? (
          <div className="payments-empty">{t('No payments yet.')}</div>
        ) : (
          sortedPayments.map((payment) => (
            <article key={payment.id} className="payment-card">
              <div className="payment-main">
                <div>
                  <h2>{payment.name}</h2>
                  <span className="payment-meta">
                    {payment.currency} {payment.amount.toFixed(2)} · {getFrequencyLabel(payment.frequency)}
                  </span>
                </div>
                <div className="payment-date">
                  {new Date(payment.nextDueDate).toLocaleDateString()}
                </div>
              </div>
              {payment.notes && <p className="payment-notes">{payment.notes}</p>}
              <div className="payment-actions">
                <button type="button" onClick={() => handlePaid(payment)}>
                  {t('Mark paid')}
                </button>
                <button type="button" className="danger" onClick={() => handleDelete(payment)}>
                  {t('Delete')}
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};

import { describe, expect, it } from 'vitest';
import { selectFinancialSnapshot } from './financialSelectors';

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const currentMonthIso = () => new Date().toISOString();

describe('selectFinancialSnapshot', () => {
  it('calcula Saldo Libre con la formula ingresos - (fijos + variables) - compromisosProximos', () => {
    const state = {
      payments: {
        payments: [
          { id: 'inc-paid', type: 'income', status: 'paid', amount: 5000 },
          { id: 'inc-pending', type: 'income', status: 'pending', amount: 1000 },
          {
            id: 'rent',
            type: 'expense',
            frequency: 'monthly',
            status: 'pending',
            amount: 1200,
            nextDueDate: addDays(7),
          },
          {
            id: 'gym-paid',
            type: 'expense',
            frequency: 'monthly',
            status: 'paid',
            amount: 100,
            nextDueDate: addDays(5),
          },
          {
            id: 'insurance',
            type: 'expense',
            frequency: 'once',
            status: 'pending',
            amount: 300,
            nextDueDate: addDays(10),
          },
          {
            id: 'far-expense',
            type: 'expense',
            frequency: 'once',
            status: 'pending',
            amount: 700,
            nextDueDate: addDays(45),
          },
        ],
      },
      budget: {
        categories: [
          { id: 'cat-home', limit: 1500 },
          { id: 'cat-life', limit: 1300 },
        ],
        expenses: [
          { id: 'exp-now', amount: 400, date: currentMonthIso(), categoryId: 'cat-home' },
          { id: 'exp-old', amount: 999, date: '2020-01-15T12:00:00.000Z', categoryId: 'cat-life' },
        ],
      },
    };

    const snapshot = selectFinancialSnapshot(state);

    expect(snapshot.ingresos).toBe(5000);
    expect(snapshot.gastosFijos).toBe(1200);
    expect(snapshot.gastosVariables).toBe(400);
    expect(snapshot.compromisosProximos).toBe(1500);
    expect(snapshot.saldoLibre).toBe(1900);
    expect(snapshot.categoryBudget).toBe(2800);
    expect(snapshot.healthScore).toBe(69);
  });

  it('actualiza Saldo Libre cuando cambia status de pago pendiente a paid', () => {
    const baseState = {
      payments: {
        payments: [
          { id: 'inc-paid', type: 'income', status: 'paid', amount: 5000 },
          {
            id: 'rent',
            type: 'expense',
            frequency: 'monthly',
            status: 'pending',
            amount: 1200,
            nextDueDate: addDays(7),
          },
          {
            id: 'insurance',
            type: 'expense',
            frequency: 'once',
            status: 'pending',
            amount: 300,
            nextDueDate: addDays(10),
          },
        ],
      },
      budget: {
        categories: [{ id: 'cat-home', limit: 2000 }],
        expenses: [{ id: 'exp-now', amount: 400, date: currentMonthIso(), categoryId: 'cat-home' }],
      },
    };

    const before = selectFinancialSnapshot(baseState);

    const afterState = {
      ...baseState,
      payments: {
        ...baseState.payments,
        payments: baseState.payments.payments.map((payment) =>
          payment.id === 'rent' ? { ...payment, status: 'paid' } : payment
        ),
      },
    };

    const after = selectFinancialSnapshot(afterState);

    expect(before.saldoLibre).toBe(1900);
    expect(after.gastosFijos).toBe(0);
    expect(after.compromisosProximos).toBe(300);
    expect(after.saldoLibre).toBe(4300);
    expect(after.saldoLibre).toBeGreaterThan(before.saldoLibre);
  });

  it('normaliza pagos legacy con paid boolean cuando no hay status', () => {
    const state = {
      payments: {
        payments: [
          { id: 'legacy-income', type: 'income', paid: true, amount: 1200 },
          { id: 'legacy-expense', type: 'expense', frequency: 'monthly', paid: false, amount: 200, nextDueDate: addDays(3) },
        ],
      },
      budget: {
        categories: [],
        expenses: [],
      },
    };

    const snapshot = selectFinancialSnapshot(state);

    expect(snapshot.ingresos).toBe(1200);
    expect(snapshot.gastosFijos).toBe(200);
    expect(snapshot.compromisosProximos).toBe(200);
    expect(snapshot.saldoLibre).toBe(800);
  });
});

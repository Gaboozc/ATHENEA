# FINANCE_DEBTS.md
# Módulo de Deudas — ATHENEA Finance

> **Fecha:** 2026-03-20 | **Modelo:** Claude Sonnet 4.6
> **Área:** Finance | **Prioridad:** Alta

---

## ÍNDICE

1. [Modelo de datos](#1-modelo-de-datos)
2. [Fase 1 — debtsSlice](#2-fase-1--debtsslice)
3. [Fase 2 — Thunk payDebt](#3-fase-2--thunk-paydebt)
4. [Fase 3 — Página FinanceDebts](#4-fase-3--página-financedebts)
5. [Fase 4 — FinanceHub KPI](#5-fase-4--financehub-kpi)
6. [Fase 5 — selectFinancialSnapshot](#6-fase-5--selectfinancialsnapshot)
7. [Fase 6 — Jarvis context + verdicts](#7-fase-6--jarvis-context--verdicts)
8. [Fase 7 — Calendario y ReminderToasts](#8-fase-7--calendario-y-remindertoasts)
9. [Fase 8 — Skills del Omnibar](#9-fase-8--skills-del-omnibar)
10. [Fase 9 — Rutas y navbar](#10-fase-9--rutas-y-navbar)
11. [Reglas de implementación](#11-reglas-de-implementación)
12. [Verificación final](#12-verificación-final)

---

## 1. MODELO DE DATOS

### Deuda (`Debt`)

```typescript
{
  id: string,
  name: string,               // "Préstamo HSBC", "Le debo a Juan"
  creditor: string,           // a quién se le debe
  creditorType: 'bank' | 'person' | 'family' | 'friend'
              | 'collection' | 'other',
  totalAmount: number,        // monto original total
  currency: 'MXN' | 'USD',
  amountPaid: number,         // total abonado hasta hoy
  balance: number,            // totalAmount - amountPaid (calculado)

  // Frecuencia de pago
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
           | 'bimonthly' | 'quarterly' | 'annual' | 'irregular',
  paymentAmount: number,      // cuánto se paga por periodo
  nextDueDate: string | null, // ISO — próxima fecha de pago

  // Estado
  status: 'not_started' | 'active' | 'paused' | 'completed',
  startDate: string | null,   // cuándo empezó a pagarse
  notStartedReason: string,   // por qué aún no ha empezado
  estimatedStartDate: string | null,

  // Historial de abonos
  payments: DebtPayment[],

  // Metadata
  notes: string,
  createdAt: string,
  updatedAt: string,

  // Calendario
  calendarEventId: string | null
}
```

### Abono (`DebtPayment`)

```typescript
{
  id: string,
  amount: number,
  currency: 'MXN' | 'USD',
  date: string,
  note: string,
  walletTransactionId: string | null  // ref al tx en walletsSlice
}
```

---

## 2. FASE 1 — debtsSlice

**Archivo nuevo:** `src/store/slices/debtsSlice.ts`

### Helper — calculateNextDueDate

```typescript
/* DEBTS-1: calcular próximo vencimiento según frecuencia */
const calculateNextDueDate = (
  fromDate: string,
  frequency: string
): string | null => {
  const date = new Date(fromDate);
  switch (frequency) {
    case 'daily':     date.setDate(date.getDate() + 1); break;
    case 'weekly':    date.setDate(date.getDate() + 7); break;
    case 'biweekly':  date.setDate(date.getDate() + 14); break;
    case 'monthly':   date.setMonth(date.getMonth() + 1); break;
    case 'bimonthly': date.setMonth(date.getMonth() + 2); break;
    case 'quarterly': date.setMonth(date.getMonth() + 3); break;
    case 'annual':    date.setFullYear(date.getFullYear() + 1); break;
    case 'irregular': return null;
    default: return null;
  }
  return date.toISOString();
};
```

### Reducers

```typescript
addDebt: (state, action) => {
  /* DEBTS-1 */
  state.debts.push({
    ...action.payload,
    id: action.payload.id || `debt-${Date.now()}`,
    amountPaid: 0,
    balance: action.payload.totalAmount,
    payments: [],
    status: action.payload.status || 'not_started',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
},

recordPayment: (state, action) => {
  /* DEBTS-1: action.payload: { debtId, amount, currency, date, note, walletTransactionId } */
  const debt = state.debts.find(d => d.id === action.payload.debtId);
  if (!debt) return;
  const payment = {
    id: `dpay-${Date.now()}`,
    amount: action.payload.amount,
    currency: action.payload.currency || debt.currency,
    date: action.payload.date || new Date().toISOString(),
    note: action.payload.note || '',
    walletTransactionId: action.payload.walletTransactionId || null
  };
  debt.payments.push(payment);
  debt.amountPaid += payment.amount;
  debt.balance = Math.max(0, debt.totalAmount - debt.amountPaid);
  if (debt.balance === 0) debt.status = 'completed';
  else if (debt.status === 'not_started') debt.status = 'active';
  if (!debt.startDate && debt.status === 'active') {
    debt.startDate = payment.date;
  }
  debt.nextDueDate = calculateNextDueDate(payment.date, debt.frequency);
  debt.updatedAt = new Date().toISOString();
},

updateDebt: (state, action) => {
  /* DEBTS-1 */
  const idx = state.debts.findIndex(d => d.id === action.payload.id);
  if (idx === -1) return;
  state.debts[idx] = {
    ...state.debts[idx],
    ...action.payload,
    updatedAt: new Date().toISOString()
  };
  state.debts[idx].balance = Math.max(
    0,
    state.debts[idx].totalAmount - state.debts[idx].amountPaid
  );
},

deleteDebt: (state, action) => {
  /* DEBTS-1 */
  state.debts = state.debts.filter(d => d.id !== action.payload);
},

deletePayment: (state, action) => {
  /* DEBTS-1: action.payload: { debtId, paymentId } */
  const debt = state.debts.find(d => d.id === action.payload.debtId);
  if (!debt) return;
  const payment = debt.payments.find(p => p.id === action.payload.paymentId);
  if (!payment) return;
  debt.payments = debt.payments.filter(p => p.id !== action.payload.paymentId);
  debt.amountPaid -= payment.amount;
  debt.balance = Math.max(0, debt.totalAmount - debt.amountPaid);
  if (debt.balance > 0 && debt.status === 'completed') {
    debt.status = 'active';
  }
  debt.updatedAt = new Date().toISOString();
},

setCalendarEventId: (state, action) => {
  /* DEBTS-1: action.payload: { debtId, calendarEventId } */
  const debt = state.debts.find(d => d.id === action.payload.debtId);
  if (debt) debt.calendarEventId = action.payload.calendarEventId;
}
```

### Integración en el store

```typescript
// store/index.ts
debts: debtsReducer

// redux-persist whitelist
whitelist: [...existentes, 'debts']
```

---

## 3. FASE 2 — Thunk payDebt

**Archivo:** `src/store/thunks/financeThunks.ts`
(mismo archivo que `registerExpense`)

Un abono es un **gasto** que sale de la billetera.
`payDebt` es el **único punto de entrada** para registrar abonos.

```typescript
export const payDebt = (payload: {
  debtId: string;
  amount: number;
  currency: 'MXN' | 'USD';
  note?: string;
  date?: string;
  categoryId?: string | null;
}) => (dispatch: any, getState: any) => {
  /* DEBTS-2 */
  const state = getState();
  const debt = state.debts?.debts?.find(d => d.id === payload.debtId);
  if (!debt) return;

  const date = payload.date || new Date().toISOString();
  const walletId = `wallet-debt-${payload.debtId}-${Date.now()}`;

  // 1. Descontar de la billetera correcta
  const walletPayload = {
    id: walletId,
    amount: payload.amount,
    description: `Abono: ${debt.name}`,
    category: payload.categoryId || 'debt-payment',
    date
  };
  if (payload.currency === 'USD') {
    dispatch(addExpenseUSD(walletPayload));
  } else {
    dispatch(addExpenseMXN(walletPayload));
  }

  // 2. Registrar en budgetSlice si existe categoría de deudas
  const debtCategory = state.budget?.categories?.find(
    c => c.name.toLowerCase().includes('deuda') ||
         c.name.toLowerCase().includes('debt')
  );
  if (debtCategory) {
    dispatch(addExpense({
      id: `budget-debt-${Date.now()}`,
      amount: payload.amount,
      currency: payload.currency,
      categoryId: debtCategory.id,
      note: `Abono: ${debt.name}`,
      date
    }));
  }

  // 3. Registrar el abono en debtsSlice
  dispatch(recordPayment({
    debtId: payload.debtId,
    amount: payload.amount,
    currency: payload.currency,
    date,
    note: payload.note || '',
    walletTransactionId: walletId
  }));

  // 4. Actualizar evento en calendarSlice con próximo vencimiento
  const updatedDebt = getState().debts?.debts?.find(d => d.id === payload.debtId);
  if (updatedDebt?.nextDueDate) {
    dispatch(addEvent({
      id: `cal-debt-${payload.debtId}`,
      title: `💳 ${debt.name} — $${updatedDebt.paymentAmount} ${debt.currency}`,
      date: updatedDebt.nextDueDate,
      type: 'payment',
      relatedId: payload.debtId,
      relatedType: 'debt',
      readOnly: false
    }));
  }
};
```

---

## 4. FASE 3 — Página FinanceDebts

**Archivo:** `src/pages/FinanceDebts.jsx`
**CSS:** `src/pages/FinanceDebts.css`
**Ruta:** `/finance/debts`

### Sección 1 — KPIs resumen

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Total deuda USD  │  │ Total deuda MXN  │  │ Próximo pago     │
│ $X,XXX.00 USD   │  │ $XX,XXX.00 MXN  │  │ En 3 días        │
│ X deudas activas│  │ X deudas activas│  │ $XXX a [nombre]  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

```javascript
const totalDebtUSD = debts
  .filter(d => d.currency === 'USD' && d.status !== 'completed')
  .reduce((s, d) => s + d.balance, 0);

const totalDebtMXN = debts
  .filter(d => d.currency === 'MXN' && d.status !== 'completed')
  .reduce((s, d) => s + d.balance, 0);

const nextPayment = debts
  .filter(d => d.nextDueDate && d.status === 'active')
  .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0];
```

### Sección 2 — Filtros y botón agregar

```
[Todas] [Activas] [No iniciadas] [Completadas]          [+ Nueva deuda]
```

### Sección 3 — Tarjeta de deuda

```
┌────────────────────────────────────────────────────────────────┐
│ 💳 Préstamo HSBC               [ACTIVE]        $5,000 MXN      │
│ Acreedor: HSBC  ·  Mensual  ·  Vence: 15 Apr                  │
│                                                                │
│ Progreso: ████████░░░░░░░ 45% pagado                          │
│ Abonado: $2,250 / $5,000 MXN  ·  Falta: $2,750 MXN           │
│                                                                │
│ [Ver historial ▼]      [Registrar abono]      [Editar]  [×]   │
└────────────────────────────────────────────────────────────────┘
```

**Estados visuales (borde izquierdo):**

| Status | Color | Efecto |
|--------|-------|--------|
| `active` | `#1ec9ff` (cyan) | Normal |
| `not_started` | `#f3c54a` (ámbar) | Normal |
| `paused` | `#64748b` (gris) | Normal |
| `completed` | `#10b981` (verde) | Opacidad 70% |

**Barra de progreso:**

```javascript
const pct = (debt.amountPaid / debt.totalAmount) * 100;
const barColor = pct >= 75 ? '#10b981'   // verde
               : pct >= 40 ? '#1ec9ff'   // cyan
               : '#f3c54a';              // ámbar
```

**Si `status === 'not_started'`** — en lugar de la barra:
```
⏸ No iniciada · Razón: [notStartedReason]
Inicio estimado: [estimatedStartDate]   (si existe)
```

**Historial de abonos (colapsable):**
- Cada pago: `fecha · $monto · nota · [eliminar]`
- Sin pagos: `"Sin abonos registrados."`

### Sección 4 — Formulario nueva deuda

```
Nombre de la deuda *
Acreedor *
Tipo:  [Banco] [Persona] [Familia] [Amigo] [Collection] [Otro]

Monto total *     Divisa  [MXN] [USD]

Frecuencia de pago *
  [Diario] [Semanal] [Quincenal] [Mensual]
  [Bimestral] [Trimestral] [Anual] [Irregular]

Monto por pago *
Próxima fecha de pago
Estado inicial:  [Activa] [No iniciada]

Si "No iniciada":
  Razón ______________
  Fecha estimada de inicio

Notas (opcional)

[Cancelar]                    [Guardar deuda]
```

### Sección 5 — Modal registrar abono

```
Deuda: Préstamo HSBC                      (readonly)
Saldo actual: $2,750 MXN                  (readonly)

Monto del abono *
Divisa  [MXN] [USD]
Fecha *  (default: hoy)
Nota (opcional)

Preview:
  "Se descontará de tu saldo MXN"
  "Saldo después del abono: $1,750 MXN"
  ✅ "Esta deuda quedará completamente pagada"  (si cubre el balance)

[Cancelar]                    [Registrar abono]
                              → dispatch(payDebt({...}))
```

---

## 5. FASE 4 — FinanceHub KPI

**Archivo:** `src/pages/FinanceHub.jsx`

```javascript
/* DEBTS-4 */
const debts = useSelector(s => s.debts?.debts || []);
const activeDebts = debts.filter(d => d.status !== 'completed');
const totalDebtMXN = activeDebts
  .filter(d => d.currency === 'MXN')
  .reduce((s, d) => s + d.balance, 0);
const totalDebtUSD = activeDebts
  .filter(d => d.currency === 'USD')
  .reduce((s, d) => s + d.balance, 0);
const nextDebtDue = activeDebts
  .filter(d => d.nextDueDate && d.status === 'active')
  .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0];

// KPI card
<div className="financehub-kpi-card kpi-debts">
  <span>💳 Deuda total</span>
  {totalDebtMXN > 0 && (
    <strong>${totalDebtMXN.toLocaleString('es-MX',
      { minimumFractionDigits: 2 })} MXN</strong>
  )}
  {totalDebtUSD > 0 && (
    <strong>${totalDebtUSD.toLocaleString('en-US',
      { minimumFractionDigits: 2 })} USD</strong>
  )}
  {nextDebtDue && (
    <small>
      Próximo: {nextDebtDue.name} —
      {new Date(nextDebtDue.nextDueDate).toLocaleDateString('es-MX')}
    </small>
  )}
  <button onClick={() => navigate('/finance/debts')}>Ver deudas →</button>
</div>
```

---

## 6. FASE 5 — selectFinancialSnapshot

**Archivo:** `src/store/selectors/financialSelectors.js`

```javascript
/* DEBTS-5: agregar deudas al snapshot financiero */
const debts = state.debts?.debts || [];
const activeDebts = debts.filter(d => d.status !== 'completed');

const totalDebtMXN = activeDebts
  .filter(d => d.currency === 'MXN')
  .reduce((s, d) => s + d.balance, 0);

const totalDebtUSD = activeDebts
  .filter(d => d.currency === 'USD')
  .reduce((s, d) => s + d.balance, 0);

const in30Days = new Date();
in30Days.setDate(in30Days.getDate() + 30);
const upcomingDebtPayments = activeDebts
  .filter(d =>
    d.nextDueDate &&
    new Date(d.nextDueDate) <= in30Days &&
    d.status === 'active'
  )
  .reduce((s, d) => s + d.paymentAmount, 0);

return {
  ...existingSnapshot,
  totalDebtMXN,
  totalDebtUSD,
  activeDebtsCount: activeDebts.length,
  upcomingDebtPayments,
  // Saldo libre real = wallet - ahorros comprometidos - deudas próximas
  saldoLibreMXN: walletMXN - commitedGoalSavings - upcomingDebtPayments,
};
```

---

## 7. FASE 6 — Jarvis context + verdicts

**Archivo:** `src/modules/intelligence/agents/AgentOrchestrator.ts`
→ método `buildAgentContext('auditor')`

```typescript
/* DEBTS-6: deudas en contexto de Jarvis */
debts: {
  totalDebtMXN: snapshot.totalDebtMXN,
  totalDebtUSD: snapshot.totalDebtUSD,
  activeCount: snapshot.activeDebtsCount,
  notStartedCount: debts.filter(d => d.status === 'not_started').length,
  upcomingPayments30d: snapshot.upcomingDebtPayments,
  overdueDebts: debts
    .filter(d =>
      d.nextDueDate &&
      new Date(d.nextDueDate) < new Date() &&
      d.status === 'active'
    )
    .map(d => ({
      name: d.name,
      dueDate: d.nextDueDate,
      amount: d.paymentAmount,
      currency: d.currency
    }))
}
```

**Archivo:** `src/modules/intelligence/agents/AuditorAgent.ts`
→ nuevos patrones de veredicto:

```typescript
/* DEBTS-6: deuda vencida sin pagar — prioridad alta */
if (context.financeHub.debts?.overdueDebts?.length > 0) {
  const overdue = context.financeHub.debts.overdueDebts[0];
  verdict = `Pago vencido: ${overdue.name} — $${overdue.amount} ${overdue.currency} `
          + `(venció ${new Date(overdue.dueDate).toLocaleDateString('es-MX')}).`;
  priority = 'HIGH';
}

/* DEBTS-6: deudas no iniciadas */
if (context.financeHub.debts?.notStartedCount > 0) {
  verdict = `${context.financeHub.debts.notStartedCount} deuda(s) sin iniciar. `
          + `Revisa si puedes comenzar algún abono.`;
  priority = 'MEDIUM';
}

/* DEBTS-6: carga de deuda alta vs saldo libre */
const totalDebtMXN = context.financeHub.debts?.totalDebtMXN || 0;
const saldoLibre = context.financeHub.saldoLibre || 0;
if (totalDebtMXN > saldoLibre * 3) {
  verdict = `Carga de deuda alta: $${totalDebtMXN.toFixed(2)} MXN `
          + `vs saldo libre de $${saldoLibre.toFixed(2)} MXN.`;
  priority = 'HIGH';
}
```

---

## 8. FASE 7 — Calendario y ReminderToasts

### Al crear una deuda activa

```javascript
/* DEBTS-7 */
if (debt.status === 'active' && debt.nextDueDate) {
  dispatch(addEvent({
    id: `cal-debt-init-${debt.id}`,
    title: `💳 ${debt.name} — $${debt.paymentAmount} ${debt.currency}`,
    date: debt.nextDueDate,
    type: 'payment',
    relatedId: debt.id,
    relatedType: 'debt',
    readOnly: false
  }));
}
```

### Al completar una deuda (balance === 0)

```javascript
/* DEBTS-7 */
dispatch(unlinkFromCalendar({
  relatedId: debt.id,
  relatedType: 'debt'
}));
```

### ReminderToasts — alertas de próximos pagos

**Archivo:** `src/components/ReminderToasts.jsx`

```javascript
/* DEBTS-7: alertas de deudas con vencimiento en 3 días */
const debts = useSelector(s => s.debts?.debts || []);

debts
  .filter(d => {
    if (!d.nextDueDate || d.status !== 'active') return false;
    const days = Math.ceil(
      (new Date(d.nextDueDate) - new Date()) / 86400000
    );
    return days >= 0 && days <= 3;
  })
  .forEach(d => {
    const days = Math.ceil(
      (new Date(d.nextDueDate) - new Date()) / 86400000
    );
    toasts.push({
      id: `debt-reminder-${d.id}`,
      message: days === 0
        ? `💳 Hoy vence: ${d.name} — $${d.paymentAmount} ${d.currency}`
        : `💳 En ${days} día(s): ${d.name} — $${d.paymentAmount} ${d.currency}`,
      type: 'warning',
      agent: 'Jarvis'
    });
  });
```

---

## 9. FASE 8 — Skills del Omnibar

**Archivo:** `src/modules/intelligence/skills.ts`

```typescript
/* DEBTS-8 */
{
  id: 'add_debt',
  hub: 'FinanceHub',
  name: 'Nueva deuda',
  icon: '💳',
  description: 'Registrar una nueva deuda',
  keywords: [
    'nueva deuda', 'agregar deuda', 'tengo una deuda',
    'le debo a', 'debo a', 'registrar deuda',
    'préstamo nuevo', 'me prestaron'
  ],
  action: 'debts/addDebt',
  params: [
    { name: 'name',          type: 'string', required: true },
    { name: 'creditor',      type: 'string', required: true },
    { name: 'totalAmount',   type: 'number', required: true },
    { name: 'currency',      type: 'select', options: ['MXN', 'USD'],
      required: false, default: 'MXN' },
    { name: 'frequency',     type: 'string', required: false },
    { name: 'paymentAmount', type: 'number', required: false }
  ]
},
{
  id: 'pay_debt',
  hub: 'FinanceHub',
  name: 'Abonar deuda',
  icon: '💸',
  description: 'Registrar un abono a una deuda',
  keywords: [
    'aboné a', 'pagué deuda', 'abono a', 'pago a deuda',
    'pagué a', 'abono deuda', 'pago deuda'
  ],
  action: 'finance/payDebt',
  params: [
    { name: 'debtId',   type: 'string', required: true },
    { name: 'amount',   type: 'number', required: true },
    { name: 'currency', type: 'select', options: ['MXN', 'USD'],
      required: false, default: 'MXN' },
    { name: 'note',     type: 'string', required: false }
  ]
}
```

**Archivo:** `src/modules/intelligence/openclawAdapter.ts`
— agregar mappers para `debts/addDebt` y `finance/payDebt`
con generación automática de `id` y `date`.

---

## 10. FASE 9 — Rutas y navbar

**Archivo:** `src/routes.jsx`

```jsx
<Route path="finance/debts" element={<FinanceDebts />} />
```

**Archivo:** `src/components/Navbar.jsx` (dropdown Finance)

```javascript
{ label: 'Deudas', path: '/finance/debts', icon: '💳' }
```

---

## 11. REGLAS DE IMPLEMENTACIÓN

- `payDebt` thunk es el **único punto de entrada** para registrar abonos.
  Nunca hacer `dispatch(recordPayment(...))` directamente desde un componente.
- Un abono **siempre** descuenta de `walletsSlice`. No puede existir un abono
  que no impacte el saldo.
- Si `balance === 0`, el `status` cambia automáticamente a `'completed'`
  en el reducer de `recordPayment`.
- Las deudas completadas siguen visibles (tab "Completadas")
  pero **no afectan los KPIs de saldo libre**.
- `deletePayment` revierte `amountPaid` y recalcula `balance`.
  Si la deuda estaba `completed` y el balance vuelve a ser `> 0`,
  el status regresa a `'active'`.
- `upcomingDebtPayments` se incluye en el `saldoLibre` real del selector —
  el usuario debe ver su disponible descontando lo que debe pagar próximamente.
- Retrocompatibilidad: si `walletsSlice` no tiene saldo suficiente,
  el abono igual se registra. El saldo queda en `0`, nunca negativo (`Math.max(0,...)`).
- TypeScript estricto en `debtsSlice.ts`.
- Comentar todos los cambios con `/* DEBTS-N */`.

---

## 12. VERIFICACIÓN FINAL

| # | Flujo | Resultado |
|---|-------|-----------|
| 1 | Crear deuda "Préstamo Juan" $5,000 MXN mensual → aparece en lista `not_started`, KPI FinanceHub muestra $5,000 MXN | ⬜ |
| 2 | Registrar abono $1,000 MXN → `walletMXN` baja $1,000, deuda muestra 20% progreso, status `active`, evento en calendario para próximo mes | ⬜ |
| 3 | Registrar abono final $4,000 MXN → `balance = 0`, status `completed`, evento del calendario eliminado | ⬜ |
| 4 | Deuda con `nextDueDate` mañana → ReminderToasts muestra alerta de Jarvis | ⬜ |
| 5 | Jarvis detecta deuda vencida → veredicto `HIGH` priority | ⬜ |
| 6 | `saldoLibre` en FinanceHub incluye `upcomingDebtPayments` descontados | ⬜ |
| 7 | Decir en Omnibar "aboné 500 pesos al préstamo de Juan" → abono registrado y saldo actualizado | ⬜ |
| 8 | Eliminar un abono → `amountPaid` revertido, `balance` sube, status vuelve a `active` si estaba `completed` | ⬜ |

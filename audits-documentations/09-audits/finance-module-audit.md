# Auditoría Completa del Módulo Finance (ATHENEA)

Fecha: 2026-04-16
Alcance auditado:
- scope/src/pages/FinanceHub.jsx
- scope/src/pages/FinanceWallets.jsx
- scope/src/pages/FinanceDebts.jsx
- scope/store/slices/walletsSlice.ts
- scope/store/slices/debtsSlice.ts
- scope/src/routes.jsx

Nota de trazabilidad: los slices solicitados en `scope/src/store/slices/*.ts` no existen en esa ruta; en este repo están en `scope/store/slices/*.ts`.

## LO QUE FUNCIONA

1. Flujo principal de gastos sincronizado entre presupuesto y billeteras.
- El thunk `registerExpense` escribe primero en budget y luego descuenta en wallet según moneda.
- Evidencia: `scope/src/store/thunks/financeThunks.ts` (dispatch de `addExpense` + `addExpenseUSD/addExpenseMXN`), líneas 18-46.

2. Registro de ingresos, gastos, conversión y movimientos de ahorro en Wallets.
- Handlers activos en UI y reducers implementados para ingreso/egreso USD/MXN, conversión y ahorros.
- Evidencia UI: `scope/src/pages/FinanceWallets.jsx` líneas 96, 111, 126, 142, 162, 179.
- Evidencia estado: `scope/store/slices/walletsSlice.ts` líneas 53, 70, 87, 104, 121, 144, 166.

3. Reversión de movimientos en Wallets al eliminar transacciones.
- `deleteTransaction` y `deleteSavingsTransaction` revierten el impacto de saldo.
- Evidencia: `scope/store/slices/walletsSlice.ts` líneas 188 y 217.

4. Gestión de deudas operativa (alta/edición/baja + registro de abonos).
- UI y reducers para crear/editar/eliminar deuda y registrar pagos.
- Evidencia UI: `scope/src/pages/FinanceDebts.jsx` líneas 122, 132, 135, 174, 175, 180, 194, 196.
- Evidencia estado: `scope/store/slices/debtsSlice.ts` líneas 65, 84, 111, 126, 131.

5. Cálculo de próximo vencimiento según frecuencia.
- `calculateNextDueDate` aplicado al registrar pago y recalcular al borrar pago.
- Evidencia: `scope/store/slices/debtsSlice.ts` líneas 41, 107, 147, 160.

6. Rutas Finance publicadas y cargadas de forma lazy.
- Hub, History, Goals, Budgeting, Wallets, Debts están declaradas.
- Evidencia: `scope/src/routes.jsx` líneas 18-23, 115-120.

## LO QUE NO FUNCIONA O ESTÁ INCOMPLETO

1. Desincronización al borrar gasto desde FinanceHub.
- En FinanceHub se elimina solo del `budgetSlice`, pero no se revierte la transacción correspondiente en `walletsSlice`.
- Evidencia UI: `scope/src/pages/FinanceHub.jsx` línea 500 (`dispatch(deleteExpense(expense.id))`).
- Evidencia reducer: `scope/store/slices/budgetSlice.js` líneas 47-48 (solo filtra en `expenses`).

2. Desincronización al borrar abono de deuda.
- Desde FinanceDebts se ejecuta `deletePayment`, pero no se revierte la salida de wallet asociada (`walletTransactionId`).
- Evidencia UI: `scope/src/pages/FinanceDebts.jsx` línea 180.
- Evidencia reducer deuda: `scope/store/slices/debtsSlice.ts` líneas 131, 138, 139 (ajusta deuda, no wallet).

3. Se permite sobrepago de deuda (sin tope al balance).
- `recordPayment` suma `amountPaid` sin cap, y luego solo clampa `balance` a 0.
- Resultado: `amountPaid` puede exceder `totalAmount`.
- Evidencia: `scope/store/slices/debtsSlice.ts` líneas 97-98.

4. Registro en presupuesto de abonos de deuda depende del nombre de categoría.
- `payDebt` solo agrega gasto en presupuesto si encuentra categoría cuyo nombre contenga "deuda" o "debt".
- Si no existe ese naming, el pago no se refleja en budget.
- Evidencia: `scope/src/store/thunks/financeThunks.ts` líneas 84 y 89.

5. Conversión de wallets implementada solo en dirección USD -> MXN.
- UI y reducer están modelados explícitamente para USD a MXN.
- Evidencia UI: `scope/src/pages/FinanceWallets.jsx` línea 397 ("Conversión USD → MXN").
- Evidencia reducer: `scope/store/slices/walletsSlice.ts` líneas 126-127 (resta USD, suma MXN).

## LO QUE FALTA

1. Operación transaccional inversa entre módulos al eliminar movimientos.
- Falta una acción/thunk único para borrar gasto/abono que revierta consistentemente Budget + Wallet + Debt.

2. Validación de negocio para pagos de deuda.
- Falta bloquear sobrepago en UI y en reducer/thunk (doble barrera).

3. Estrategia robusta de categoría de deuda en presupuesto.
- Falta configuración explícita por ID/setting en vez de inferencia por nombre (`includes('deuda'|'debt')`).

4. Conversión bidireccional MXN <-> USD.
- Falta soporte completo de dirección de conversión (si el producto lo requiere).

5. Pruebas de integración cross-slice Finance.
- Faltan tests que aseguren consistencia de saldos al crear/eliminar gastos, pagos y conversiones.

## RUTAS DISPONIBLES

Rutas activas del módulo Finance:
- `/finance` -> FinanceHub (`scope/src/routes.jsx`, línea 115)
- `/finance/history` -> FinanceHistory (`scope/src/routes.jsx`, línea 116)
- `/finance/goals` -> FinanceGoals (`scope/src/routes.jsx`, línea 117)
- `/finance/budgeting` -> FinanceBudgeting (`scope/src/routes.jsx`, línea 118)
- `/finance/wallets` -> FinanceWallets (`scope/src/routes.jsx`, línea 119)
- `/finance/debts` -> FinanceDebts (`scope/src/routes.jsx`, línea 120)
- Alias: `/budgeting` redirige a `/finance/budgeting` (`scope/src/routes.jsx`, línea 121)

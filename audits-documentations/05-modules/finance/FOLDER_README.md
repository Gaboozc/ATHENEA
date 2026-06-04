# 05 / Finance Module

Managed by **Jarvis** 🤖 (Financial Auditor).

## Documents in this folder

| File | Description |
|------|-------------|
| [README_FINANCE_AUDIT.md](README_FINANCE_AUDIT.md) | Full finance module audit |
| [FINANCE_DEBTS.md](FINANCE_DEBTS.md) | Debts feature implementation details |

## Sub-modules

| Module | Slice | Key Features |
|--------|-------|-------------|
| Wallets | `walletsSlice` | Crypto + fiat balances, multi-wallet |
| Expenses | `expensesSlice` | Expense tracking, categories, charts |
| Goals | `goalsSlice` | Savings goals with progress tracking |
| Debts | `debtsSlice` | Debt management + native payment reminders |
| Payments | `paymentsSlice` | Recurring payment reminders |

## Android Notifications (ANDROID-4)
Debts with `nextDueDate` trigger native notifications via `NativeReminderNotifications`:
- 7 days before due
- 3 days before due
- 1 day before due
- Day of due date (9:00 AM local time)
- Tap → navigates to `/finance/debts`

## Jarvis Context Injection
`financialContext` from `userSettingsSlice` is injected into every Jarvis system prompt:
- `growth` → prioritize income strategies
- `saving` → flag unnecessary expenses
- `stable` → balance maintenance advice
- `recovery` → debt reduction focus
- `investing` → wealth building recommendations

# Sheet Schema

Google Sheets is the source of truth for finance data. This file documents the intended workbook structure so the Apps Script project and sheet stay aligned.

## Tabs

- `Transactions`
- `Expenses_View`
- `Income_View`
- `Transfers_View`
- `Balances`
- `Expense_Categories`
- `Income_Categories`
- `Transfer_Categories`
- `Accounts`
- `Presets`
- `Settings`

## Storage Approach

Use Approach 1:

- `Transactions` is the only source-of-truth transaction table.
- Expense, income, and transfer pages in the app filter `Transactions` by `Type`.
- `Expenses_View`, `Income_View`, and `Transfers_View` are generated formula/filter views for manual browsing only.
- Do not write separate source transaction rows into the view sheets.
- Do not create a separate `All_Transactions` sheet because `Transactions` already serves that role.

## Transactions

Required columns:

- Transaction ID
- Date
- Created At
- Updated At
- Type
- Amount
- Tier 1
- Tier 2
- Account
- From Account
- To Account
- Taxable?
- Tax Deduction Status
- Tax Note
- Memo
- Preset Used
- Deleted?
- Deleted At

Rules:

- `Amount` is always stored as a positive number.
- `Type` is one of `Expense`, `Income`, or `Transfer`.
- `Deleted?` defaults to `FALSE`.
- Deleted transactions are hidden by the app by default, not physically removed.

## Generated Transaction Views

Suggested view tabs:

- `Expenses_View`
- `Income_View`
- `Transfers_View`

Rules:

- These tabs are generated from `Transactions`.
- They are for manual review, filtering, and spreadsheet convenience.
- The app should not treat these tabs as independent source data.

Suggested Google Sheets formulas:

```text
=FILTER(Transactions!A:R, Transactions!E:E="Expense", Transactions!Q:Q<>TRUE)
=FILTER(Transactions!A:R, Transactions!E:E="Income", Transactions!Q:Q<>TRUE)
=FILTER(Transactions!A:R, Transactions!E:E="Transfer", Transactions!Q:Q<>TRUE)
```

## Expense_Categories

Suggested columns:

- Tier 1
- Tier 2
- Example Memo / Note
- Active?
- Sort Order

Use `docs/reference/expense-categories-2-tier.md` as the baseline category catalog.

## Income_Categories

Suggested columns:

- Category
- Default Taxable?
- Active?
- Sort Order

## Transfer_Categories

Suggested columns:

- Category
- Active?
- Sort Order

## Accounts

Suggested columns:

- Account ID
- Display Name
- Full Name
- Account Type
- Opening Balance
- Last 4 Digits
- Favorite?
- Active?
- Default Expense?
- Default Income?
- Default Transfer From?
- Default Transfer To?
- Sort Order
- Notes

## Balances

Suggested columns:

- Account ID
- Display Name
- Opening Balance
- Transaction Delta
- Calculated Balance
- Manual Balance
- Balance Difference
- Last Reconciled At
- Notes

Rules:

- `Opening Balance` comes from the starting point for each account.
- `Transaction Delta` is calculated from active rows in `Transactions`.
- Expenses reduce the selected account.
- Income increases the selected account.
- Transfers reduce `From Account` and increase `To Account`.
- `Manual Balance` is optional and can be used for reconciliation against bank/wallet balances.
- `Balance Difference = Manual Balance - Calculated Balance` when a manual balance exists.

## Presets

Suggested columns:

- Preset ID
- Preset Name
- Type
- Amount
- Tier 1
- Tier 2
- Income Category
- Transfer Category
- Account
- From Account
- To Account
- Taxable?
- Tax Deduction Status
- Memo
- Active?
- Sort Order

## Settings

Suggested columns:

- Key
- Value
- Notes

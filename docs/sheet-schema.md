# Sheet Schema

Google Sheets is the source of truth for finance data. This file documents the intended workbook structure so the Apps Script project and sheet stay aligned.

## Tabs

- `Transactions`
- `Expense_Categories`
- `Income_Categories`
- `Transfer_Categories`
- `Accounts`
- `Presets`
- `Settings`

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

## Expense_Categories

Suggested columns:

- Tier 1
- Tier 2
- Example Memo / Note
- Active?
- Sort Order

Use `google_sheets_2_tier_expense_categories.md` as the baseline category catalog.

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
- Last 4 Digits
- Favorite?
- Active?
- Default Expense?
- Default Income?
- Default Transfer From?
- Default Transfer To?
- Sort Order
- Notes
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

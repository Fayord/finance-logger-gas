/**
 * Workbook schema shared by Apps Script runtime code and local tests.
 */
var FINANCE_SHEETS = Object.freeze({
  TRANSACTIONS: "Transactions",
  EXPENSES_VIEW: "Expenses_View",
  INCOME_VIEW: "Income_View",
  TRANSFERS_VIEW: "Transfers_View",
  ACCOUNTS: "Accounts",
  BALANCES: "Balances",
  EXPENSE_CATEGORIES: "Expense_Categories",
  INCOME_CATEGORIES: "Income_Categories",
  TRANSFER_CATEGORIES: "Transfer_Categories",
  PRESETS: "Presets",
  SETTINGS: "Settings"
});

var TRANSACTION_TYPES = Object.freeze({
  EXPENSE: "Expense",
  INCOME: "Income",
  TRANSFER: "Transfer"
});

var TRANSACTION_HEADERS = Object.freeze([
  "Transaction ID",
  "Date",
  "Created At",
  "Updated At",
  "Type",
  "Amount",
  "Tier 1",
  "Tier 2",
  "Account",
  "From Account",
  "To Account",
  "Taxable?",
  "Tax Deduction Status",
  "Tax Note",
  "Memo",
  "Preset Used",
  "Deleted?",
  "Deleted At"
]);

var ACCOUNT_HEADERS = Object.freeze([
  "Account ID",
  "Display Name",
  "Full Name",
  "Account Type",
  "Opening Balance",
  "Last 4 Digits",
  "Favorite?",
  "Active?",
  "Default Expense?",
  "Default Income?",
  "Default Transfer From?",
  "Default Transfer To?",
  "Sort Order",
  "Notes"
]);

var BALANCE_HEADERS = Object.freeze([
  "Account ID",
  "Display Name",
  "Opening Balance",
  "Transaction Delta",
  "Calculated Balance",
  "Manual Balance",
  "Balance Difference",
  "Last Reconciled At",
  "Notes"
]);

var VIEW_SHEETS_BY_TYPE = Object.freeze({
  Expense: FINANCE_SHEETS.EXPENSES_VIEW,
  Income: FINANCE_SHEETS.INCOME_VIEW,
  Transfer: FINANCE_SHEETS.TRANSFERS_VIEW
});

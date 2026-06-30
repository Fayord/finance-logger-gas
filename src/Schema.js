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

var CATEGORY_HEADERS = Object.freeze([
  "Tier 1",
  "Tier 2",
  "Example Memo / Note",
  "Active?",
  "Sort Order"
]);

var INCOME_CATEGORY_HEADERS = Object.freeze([
  "Category",
  "Default Taxable?",
  "Active?",
  "Sort Order"
]);

var TRANSFER_CATEGORY_HEADERS = Object.freeze(["Category", "Active?", "Sort Order"]);

var PRESET_HEADERS = Object.freeze([
  "Preset ID",
  "Preset Name",
  "Type",
  "Amount",
  "Tier 1",
  "Tier 2",
  "Income Category",
  "Transfer Category",
  "Account",
  "From Account",
  "To Account",
  "Taxable?",
  "Tax Deduction Status",
  "Memo",
  "Active?",
  "Sort Order"
]);

var SETTING_HEADERS = Object.freeze(["Key", "Value", "Notes"]);

var MOCK_SHEET_PREFIX = "Mock_";

var MOCK_FINANCE_SHEETS = Object.freeze({
  TRANSACTIONS: "Mock_Transactions",
  EXPENSES_VIEW: "Mock_Expenses_View",
  INCOME_VIEW: "Mock_Income_View",
  TRANSFERS_VIEW: "Mock_Transfers_View",
  ACCOUNTS: "Mock_Accounts",
  BALANCES: "Mock_Balances",
  EXPENSE_CATEGORIES: "Mock_Expense_Categories",
  INCOME_CATEGORIES: "Mock_Income_Categories",
  TRANSFER_CATEGORIES: "Mock_Transfer_Categories",
  PRESETS: "Mock_Presets",
  SETTINGS: "Mock_Settings"
});

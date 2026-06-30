/**
 * Safe real workbook setup plan. This file stays free of SpreadsheetApp so
 * local tests can verify setup behavior before GAS writes to a workbook.
 */
function buildWorkbookSetupPlan() {
  return {
    sheets: [
      createSetupSheet_(FINANCE_SHEETS.TRANSACTIONS, TRANSACTION_HEADERS, [], "headers-only"),
      createSetupFormulaSheet_(
        FINANCE_SHEETS.EXPENSES_VIEW,
        TRANSACTION_HEADERS,
        '=FILTER(Transactions!A:R, Transactions!E:E="Expense", Transactions!Q:Q<>TRUE)'
      ),
      createSetupFormulaSheet_(
        FINANCE_SHEETS.INCOME_VIEW,
        TRANSACTION_HEADERS,
        '=FILTER(Transactions!A:R, Transactions!E:E="Income", Transactions!Q:Q<>TRUE)'
      ),
      createSetupFormulaSheet_(
        FINANCE_SHEETS.TRANSFERS_VIEW,
        TRANSACTION_HEADERS,
        '=FILTER(Transactions!A:R, Transactions!E:E="Transfer", Transactions!Q:Q<>TRUE)'
      ),
      createSetupSheet_(FINANCE_SHEETS.ACCOUNTS, ACCOUNT_HEADERS, [], "headers-only"),
      createSetupSheet_(FINANCE_SHEETS.BALANCES, BALANCE_HEADERS, [], "headers-only"),
      createSetupSheet_(
        FINANCE_SHEETS.EXPENSE_CATEGORIES,
        CATEGORY_HEADERS,
        MOCK_EXPENSE_CATEGORIES,
        "seed-if-empty"
      ),
      createSetupSheet_(
        FINANCE_SHEETS.INCOME_CATEGORIES,
        INCOME_CATEGORY_HEADERS,
        getMockIncomeCategories_(),
        "seed-if-empty"
      ),
      createSetupSheet_(
        FINANCE_SHEETS.TRANSFER_CATEGORIES,
        TRANSFER_CATEGORY_HEADERS,
        getMockTransferCategories_(),
        "seed-if-empty"
      ),
      createSetupSheet_(FINANCE_SHEETS.PRESETS, PRESET_HEADERS, [], "headers-only"),
      createSetupSheet_(FINANCE_SHEETS.SETTINGS, SETTING_HEADERS, getDefaultSettings_(), "seed-if-empty")
    ]
  };
}

function getWorkbookSetupSheetNames() {
  return buildWorkbookSetupPlan().sheets.map(function (sheet) {
    return sheet.name;
  });
}

function createSetupSheet_(name, headers, rows, mode) {
  return {
    name: name,
    headers: headers.slice(),
    rows: rows.map(function (row) {
      return Array.isArray(row)
        ? row.slice()
        : headers.map(function (header) {
            return row[header] === undefined ? "" : row[header];
          });
    }),
    mode: mode,
    kind: "data"
  };
}

function createSetupFormulaSheet_(name, headers, formula) {
  return {
    name: name,
    headers: headers.slice(),
    rows: [],
    formula: formula,
    mode: "formula-view",
    kind: "formula-view"
  };
}

function getDefaultSettings_() {
  return [
    ["timezone", "Asia/Bangkok", "Display and default date timezone."],
    ["currency", "THB", "Default currency for the first version."],
    ["recentLogLimit", 20, "Number of recent non-deleted logs to show."],
    ["defaultTransactionType", "Expense", "Initial Quick Log mode."]
  ];
}

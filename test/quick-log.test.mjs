import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

class FakeSpreadsheet {
  constructor(name = "Local Fake Finance Workbook") {
    this.name = name;
    this.sheets = [];
  }

  getSheetByName(name) {
    return this.sheets.find((sheet) => sheet.name === name) || null;
  }

  insertSheet(name) {
    const sheet = new FakeSheet(name);
    this.sheets.push(sheet);
    return sheet;
  }

  getSheets() {
    return this.sheets.slice();
  }

  getId() {
    return "fake-spreadsheet-id";
  }

  getName() {
    return this.name;
  }

  getUrl() {
    return "https://docs.google.com/spreadsheets/d/fake-spreadsheet-id/edit";
  }
}

class FakeSheet {
  constructor(name) {
    this.name = name;
    this.values = [];
    this.formulas = new Map();
    this.filterRange = null;
    this.frozenRows = 0;
    this.headerBold = false;
  }

  getName() {
    return this.name;
  }

  getRange(row, column, numRows = 1, numColumns = 1) {
    return new FakeRange(this, row, column, numRows, numColumns);
  }

  getFilter() {
    if (!this.filterRange) {
      return null;
    }

    return {
      remove: () => {
        this.filterRange = null;
      }
    };
  }

  clear() {
    this.values = [];
    this.formulas = new Map();
    this.filterRange = null;
  }

  setFrozenRows(rowCount) {
    this.frozenRows = rowCount;
  }

  autoResizeColumns() {}

  getLastRow() {
    return this.values.length;
  }

  getLastColumn() {
    return Math.max(...this.values.map((row) => row.length), 0);
  }
}

class FakeRange {
  constructor(sheet, row, column, numRows, numColumns) {
    this.sheet = sheet;
    this.row = row;
    this.column = column;
    this.numRows = numRows;
    this.numColumns = numColumns;
  }

  setValues(values) {
    for (let rowOffset = 0; rowOffset < values.length; rowOffset += 1) {
      const targetRow = this.row + rowOffset - 1;
      this.sheet.values[targetRow] = this.sheet.values[targetRow] || [];

      for (let columnOffset = 0; columnOffset < values[rowOffset].length; columnOffset += 1) {
        const targetColumn = this.column + columnOffset - 1;
        this.sheet.values[targetRow][targetColumn] = values[rowOffset][columnOffset];
      }
    }

    return this;
  }

  setFormula(formula) {
    this.sheet.formulas.set(`${this.row}:${this.column}`, formula);
    return this;
  }

  getFormula() {
    return this.sheet.formulas.get(`${this.row}:${this.column}`) || "";
  }

  setFontWeight(weight) {
    if (this.row === 1 && weight === "bold") {
      this.sheet.headerBold = true;
    }

    return this;
  }

  createFilter() {
    this.sheet.filterRange = {
      row: this.row,
      column: this.column,
      numRows: this.numRows,
      numColumns: this.numColumns
    };

    return this;
  }

  getValues() {
    return Array.from({ length: this.numRows }, (_, rowOffset) => {
      const sourceRow = this.sheet.values[this.row + rowOffset - 1] || [];

      return Array.from({ length: this.numColumns }, (_, columnOffset) => {
        const value = sourceRow[this.column + columnOffset - 1];
        return value === undefined ? "" : value;
      });
    });
  }
}

const context = {
  console,
  Date,
  Number,
  Object,
  String,
  Boolean,
  Math,
  Error,
  Array,
  Utilities: {
    getUuid() {
      return "uuid-001";
    }
  },
  SpreadsheetApp: {
    flush() {
      context.flushCount += 1;
    }
  },
  flushCount: 0
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("src/Schema.js", "utf8"), context);
vm.runInContext(fs.readFileSync("src/TransactionModel.js", "utf8"), context);
vm.runInContext(fs.readFileSync("src/MockWorkbook.js", "utf8"), context);
vm.runInContext(fs.readFileSync("src/Connection.gs", "utf8"), context);
vm.runInContext(fs.readFileSync("src/WorkbookSetupPlan.js", "utf8"), context);
vm.runInContext(fs.readFileSync("src/WorkbookSetup.gs", "utf8"), context);
vm.runInContext(fs.readFileSync("src/MockSeeder.gs", "utf8"), context);
vm.runInContext(fs.readFileSync("src/QuickLogModel.js", "utf8"), context);
vm.runInContext(fs.readFileSync("src/QuickLog.gs", "utf8"), context);

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function createSetupWorkbook() {
  const spreadsheet = new FakeSpreadsheet();
  context.getFinanceSpreadsheet_ = () => spreadsheet;
  context.setupWorkbook();
  context.flushCount = 0;
  return spreadsheet;
}

function createSeededMockWorkbook() {
  const spreadsheet = new FakeSpreadsheet();
  context.getFinanceSpreadsheet_ = () => spreadsheet;
  context.seedMockWorkbook();
  context.flushCount = 0;
  return spreadsheet;
}

function seedAccounts(spreadsheet) {
  spreadsheet.getSheetByName("Accounts").getRange(2, 1, 2, context.ACCOUNT_HEADERS.length).setValues([
    [
      "cash-wallet",
      "Cash",
      "Cash Wallet",
      "Cash",
      1000,
      "",
      true,
      true,
      true,
      false,
      false,
      false,
      10,
      ""
    ],
    [
      "old-wallet",
      "Old Wallet",
      "Inactive Wallet",
      "Wallet",
      0,
      "",
      false,
      false,
      false,
      false,
      false,
      false,
      20,
      ""
    ]
  ]);
}

function seedTransaction(spreadsheet, overrides = {}) {
  const transaction = context.normalizeTransaction(
    {
      "Transaction ID": "EXP-ACTIVE",
      Type: "Expense",
      Date: "2026-06-30",
      Amount: 100,
      "Tier 1": "Food & Dining",
      "Tier 2": "Eating Out",
      Account: "cash-wallet",
      Memo: "Original memo",
      ...overrides
    },
    { now: "2026-06-30T12:00:00.000Z" }
  );

  spreadsheet
    .getSheetByName("Transactions")
    .getRange(2, 1, 1, context.TRANSACTION_HEADERS.length)
    .setValues([context.transactionToSheetRow(transaction)]);

  return transaction;
}

function getSheetRecordById(sheet, id) {
  const headers = sheet.values[0];
  const row = sheet.values.find((candidate) => candidate[0] === id);

  assert.ok(row, `${id} should exist in ${sheet.name}`);

  return Object.fromEntries(headers.map((header, index) => [header, row[index]]));
}

test("buildQuickLogBootstrapData returns active references and recent non-deleted transactions", () => {
  const workbook = context.buildMockWorkbook();
  const sheets = Object.fromEntries(
    workbook.sheets.map((sheet) => [
      sheet.name.replace("Mock_", ""),
      context.sheetRowsToObjects(sheet.rows, sheet.headers)
    ])
  );

  const bootstrap = context.buildQuickLogBootstrapData(
    {
      transactions: sheets.Transactions,
      accounts: sheets.Accounts,
      expenseCategories: sheets.Expense_Categories,
      incomeCategories: sheets.Income_Categories,
      transferCategories: sheets.Transfer_Categories,
      presets: sheets.Presets,
      settings: sheets.Settings
    },
    { limit: 5 }
  );

  assert.equal(bootstrap.ok, true);
  assert.equal(bootstrap.defaultTransactionType, "Expense");
  assert.equal(bootstrap.accounts.some((account) => account["Account ID"] === "old-wallet"), false);
  assert.equal(bootstrap.recentTransactions.length, 5);
  assert.equal(
    bootstrap.recentTransactions.some((transaction) => transaction["Transaction ID"] === "MOCK-EXP-DEL"),
    false
  );
});

test("createQuickLogTransaction validates required expense fields and normalizes amount", () => {
  const result = context.createQuickLogTransaction(
    {
      Type: "Expense",
      Date: "2026-06-30",
      Amount: "-65",
      "Tier 1": "Food & Dining",
      "Tier 2": "Sweet Drinks & Snacks",
      Account: "cash-wallet"
    },
    [],
    {
      now: "2026-06-30T12:00:00.000Z",
      transactionId: "EXP-TEST-001"
    }
  );

  assert.equal(result.ok, true);
  assert.equal(result.transaction.Amount, 65);
  assert.equal(result.row.length, context.TRANSACTION_HEADERS.length);
  assert.equal(result.transaction["Transaction ID"], "EXP-TEST-001");
});

test("createQuickLogTransaction supports income and transfer records", () => {
  const income = context.createQuickLogTransaction(
    {
      Type: "Income",
      Date: "2026-06-30",
      Amount: 5000,
      "Tier 1": "Salary",
      Account: "cash-wallet",
      "Taxable?": "Yes"
    },
    [],
    {
      now: "2026-06-30T12:00:00.000Z",
      transactionId: "INC-TEST-001"
    }
  );
  const transfer = context.createQuickLogTransaction(
    {
      Type: "Transfer",
      Date: "2026-06-30",
      Amount: 750,
      "Tier 1": "Account Transfer",
      "From Account": "cash-wallet",
      "To Account": "bank-main"
    },
    [],
    {
      now: "2026-06-30T12:01:00.000Z",
      transactionId: "TRA-TEST-001"
    }
  );

  assert.equal(income.ok, true);
  assert.equal(income.transaction.Account, "cash-wallet");
  assert.equal(transfer.ok, true);
  assert.equal(transfer.transaction["From Account"], "cash-wallet");
  assert.equal(transfer.transaction["To Account"], "bank-main");
});

test("createQuickLogTransaction rejects invalid transfer input", () => {
  const result = context.createQuickLogTransaction(
    {
      Type: "Transfer",
      Date: "2026-06-30",
      Amount: 500,
      "Tier 1": "Account Transfer",
      "From Account": "cash-wallet",
      "To Account": "cash-wallet"
    },
    [],
    { now: "2026-06-30T12:00:00.000Z" }
  );

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /must be different/);
});

test("updateQuickLogTransaction edits an existing transaction while preserving ID and Created At", () => {
  const existing = context.normalizeTransaction(
    {
      "Transaction ID": "EXP-EDIT",
      Type: "Expense",
      Date: "2026-06-29",
      Amount: 100,
      "Tier 1": "Food & Dining",
      "Tier 2": "Eating Out",
      Account: "cash-wallet",
      Memo: "Before"
    },
    { now: "2026-06-29T10:00:00.000Z" }
  );
  const result = context.updateQuickLogTransaction(
    "EXP-EDIT",
    {
      Amount: 125,
      Memo: "After",
      "Transaction ID": "SHOULD-NOT-CHANGE"
    },
    [existing],
    { now: "2026-06-30T12:00:00.000Z" }
  );

  assert.equal(result.ok, true);
  assert.equal(result.transaction["Transaction ID"], "EXP-EDIT");
  assert.equal(result.transaction["Created At"], "2026-06-29T10:00:00.000Z");
  assert.equal(result.transaction["Updated At"], "2026-06-30T12:00:00.000Z");
  assert.equal(result.transaction.Amount, 125);
  assert.equal(result.transaction.Memo, "After");
});

test("updateQuickLogTransaction rejects missing transactions and invalid edits", () => {
  const existing = context.normalizeTransaction(
    {
      "Transaction ID": "EXP-EDIT",
      Type: "Expense",
      Date: "2026-06-29",
      Amount: 100,
      "Tier 1": "Food & Dining",
      "Tier 2": "Eating Out",
      Account: "cash-wallet"
    },
    { now: "2026-06-29T10:00:00.000Z" }
  );
  const missing = context.updateQuickLogTransaction("NOPE", { Amount: 125 }, [existing], {
    now: "2026-06-30T12:00:00.000Z"
  });
  const invalid = context.updateQuickLogTransaction("EXP-EDIT", { Amount: 0 }, [existing], {
    now: "2026-06-30T12:00:00.000Z"
  });

  assert.equal(missing.ok, false);
  assert.match(missing.errors.join(" "), /Transaction not found/);
  assert.equal(invalid.ok, false);
  assert.match(invalid.errors.join(" "), /Amount must be a positive number/);
});

test("softDeleteQuickLogTransaction marks a transaction without removing it", () => {
  const existing = context.normalizeTransaction(
    {
      "Transaction ID": "EXP-DELETE",
      Type: "Expense",
      Date: "2026-06-29",
      Amount: 100,
      "Tier 1": "Food & Dining",
      "Tier 2": "Eating Out",
      Account: "cash-wallet"
    },
    { now: "2026-06-29T10:00:00.000Z" }
  );
  const result = context.softDeleteQuickLogTransaction("EXP-DELETE", [existing], {
    now: "2026-06-30T12:00:00.000Z"
  });

  assert.equal(result.ok, true);
  assert.equal(result.transaction["Deleted?"], true);
  assert.equal(result.transaction["Deleted At"], "2026-06-30T12:00:00.000Z");
  assert.equal(result.transaction["Updated At"], "2026-06-30T12:00:00.000Z");
});

test("createTransaction appends to real Transactions and returns updated recent logs", () => {
  const spreadsheet = createSetupWorkbook();
  seedAccounts(spreadsheet);
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.createTransaction({
    Type: "Expense",
    Date: "2026-06-30",
    Amount: 85,
    "Tier 1": "Food & Dining",
    "Tier 2": "Sweet Drinks & Snacks",
    Account: "cash-wallet",
    Memo: "Quick log backend test"
  });

  const transactions = spreadsheet.getSheetByName("Transactions");

  assert.equal(result.ok, true);
  assert.equal(context.flushCount, 1);
  assert.equal(transactions.values.length, 2);
  assert.equal(transactions.values[1][0], "EXP-uuid-001");
  assert.equal(transactions.values[1][5], 85);
  assert.equal(result.recentTransactions.length, 1);
  assert.equal(result.recentTransactions[0].Memo, "Quick log backend test");
});

test("updateTransaction updates the matching real Transactions row", () => {
  const spreadsheet = createSetupWorkbook();
  seedTransaction(spreadsheet);
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.updateTransaction("EXP-ACTIVE", {
    Amount: 150,
    Memo: "Updated memo"
  });
  const transactions = spreadsheet.getSheetByName("Transactions");

  assert.equal(result.ok, true);
  assert.equal(context.flushCount, 1);
  assert.equal(transactions.values.length, 2);
  assert.equal(transactions.values[1][0], "EXP-ACTIVE");
  assert.equal(transactions.values[1][5], 150);
  assert.equal(transactions.values[1][14], "Updated memo");
  assert.equal(result.recentTransactions[0].Amount, 150);
});

test("updateTransaction returns a validation error without changing the row", () => {
  const spreadsheet = createSetupWorkbook();
  seedTransaction(spreadsheet);
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.updateTransaction("EXP-ACTIVE", {
    Amount: 0
  });
  const transactions = spreadsheet.getSheetByName("Transactions");

  assert.equal(result.ok, false);
  assert.equal(transactions.values[1][5], 100);
});

test("softDeleteTransaction marks the real row and removes it from recent logs", () => {
  const spreadsheet = createSetupWorkbook();
  seedTransaction(spreadsheet);
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.softDeleteTransaction("EXP-ACTIVE");
  const transactions = spreadsheet.getSheetByName("Transactions");

  assert.equal(result.ok, true);
  assert.equal(context.flushCount, 1);
  assert.equal(transactions.values.length, 2);
  assert.equal(transactions.values[1][16], true);
  assert.equal(result.recentTransactions.length, 0);
});

test("softDeleteTransaction returns a missing ID error without changing rows", () => {
  const spreadsheet = createSetupWorkbook();
  seedTransaction(spreadsheet);
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.softDeleteTransaction("MISSING-ID");
  const transactions = spreadsheet.getSheetByName("Transactions");

  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /Transaction not found/);
  assert.equal(transactions.values.length, 2);
  assert.equal(transactions.values[1][16], false);
});

test("getQuickLogBootstrap reads real workbook data without creating transactions", () => {
  const spreadsheet = createSetupWorkbook();
  seedAccounts(spreadsheet);
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.getQuickLogBootstrap();

  assert.equal(result.ok, true);
  assert.equal(result.accounts.length, 1);
  assert.equal(result.accounts[0]["Account ID"], "cash-wallet");
  assert.equal(result.expenseCategories.length > 0, true);
  assert.deepEqual(plain(spreadsheet.getSheetByName("Transactions").values), [
    plain(context.TRANSACTION_HEADERS)
  ]);
});

test("getRecentTransactions hides soft-deleted rows", () => {
  const spreadsheet = createSetupWorkbook();
  const transactions = spreadsheet.getSheetByName("Transactions");
  transactions.getRange(2, 1, 2, context.TRANSACTION_HEADERS.length).setValues([
    context.transactionToSheetRow(
      context.normalizeTransaction(
        {
          "Transaction ID": "EXP-ACTIVE",
          Type: "Expense",
          Date: "2026-06-30",
          Amount: 100,
          "Tier 1": "Food & Dining",
          "Tier 2": "Eating Out",
          Account: "cash-wallet"
        },
        { now: "2026-06-30T12:00:00.000Z" }
      )
    ),
    context.transactionToSheetRow(
      context.normalizeTransaction(
        {
          "Transaction ID": "EXP-DELETED",
          Type: "Expense",
          Date: "2026-06-29",
          Amount: 50,
          "Tier 1": "Food & Dining",
          "Tier 2": "Eating Out",
          Account: "cash-wallet",
          "Deleted?": true,
          "Deleted At": "2026-06-30T13:00:00.000Z"
        },
        { now: "2026-06-30T13:00:00.000Z" }
      )
    )
  ]);
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.getRecentTransactions(10);

  assert.equal(result.ok, true);
  assert.equal(result.transactions.length, 1);
  assert.equal(result.transactions[0]["Transaction ID"], "EXP-ACTIVE");
});

test("getMockQuickLogBootstrap reads seeded mock workbook data", () => {
  const spreadsheet = createSeededMockWorkbook();
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.getMockQuickLogBootstrap();

  assert.equal(result.ok, true);
  assert.equal(result.mode, "mock");
  assert.equal(result.accounts.some((account) => account["Account ID"] === "cash-wallet"), true);
  assert.equal(result.recentTransactions.length > 0, true);
});

test("getMockReviewReport asks for seeding when Mock tabs are missing", () => {
  const spreadsheet = new FakeSpreadsheet();
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.getMockReviewReport();

  assert.equal(result.ok, false);
  assert.match(result.message, /Seed mock workbook/);
  assert.equal(result.missingSheets.length, Object.keys(context.MOCK_FINANCE_SHEETS).length);
  assert.equal(result.transactions.total, 14);
  assert.equal(result.reviewCoverage.softDeletedCount, 1);
});

test("getMockReviewReport returns planned coverage and live sheet status after seeding", () => {
  const spreadsheet = createSeededMockWorkbook();
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.getMockReviewReport();

  assert.equal(result.ok, true);
  assert.equal(result.message, "Mock workbook review report is ready.");
  assert.equal(result.missingSheets.length, 0);
  assert.equal(result.liveSheets.length, Object.keys(context.MOCK_FINANCE_SHEETS).length);
  assert.equal(result.transactions.active, 13);
  assert.deepEqual(plain(result.presets.byType), {
    Expense: 4,
    Income: 1,
    Transfer: 2
  });
});

test("createMockTransaction appends only to Mock_Transactions", () => {
  const spreadsheet = createSetupWorkbook();
  context.seedMockWorkbook();
  context.flushCount = 0;
  const realTransactions = spreadsheet.getSheetByName("Transactions");
  const mockTransactions = spreadsheet.getSheetByName("Mock_Transactions");
  const originalMockRows = mockTransactions.values.length;

  const result = context.createMockTransaction({
    Type: "Expense",
    Date: "2026-06-30",
    Amount: 85,
    "Tier 1": "Food & Dining",
    "Tier 2": "Sweet Drinks & Snacks",
    Account: "cash-wallet",
    Memo: "Mock mode backend test"
  });

  assert.equal(result.ok, true);
  assert.equal(result.mode, "mock");
  assert.equal(context.flushCount, 1);
  assert.equal(realTransactions.values.length, 1);
  assert.equal(mockTransactions.values.length, originalMockRows + 1);
  assert.equal(mockTransactions.values.at(-1)[14], "Mock mode backend test");
});

test("mock balance rows refresh after mock create and soft delete", () => {
  const spreadsheet = createSeededMockWorkbook();
  context.getFinanceSpreadsheet_ = () => spreadsheet;
  context.flushCount = 0;
  const balances = spreadsheet.getSheetByName("Mock_Balances");
  const beforeCash = getSheetRecordById(balances, "cash-wallet");

  const create = context.createMockTransaction({
    Type: "Expense",
    Date: "2026-06-30",
    Amount: 85,
    "Tier 1": "Food & Dining",
    "Tier 2": "Sweet Drinks & Snacks",
    Account: "cash-wallet",
    Memo: "Balance refresh test"
  });
  const afterCreateCash = getSheetRecordById(balances, "cash-wallet");

  const remove = context.softDeleteMockTransaction(create.transaction["Transaction ID"]);
  const afterDeleteCash = getSheetRecordById(balances, "cash-wallet");

  assert.equal(create.ok, true);
  assert.equal(remove.ok, true);
  assert.equal(create.balances.some((balance) => balance["Account ID"] === "cash-wallet"), true);
  assert.equal(afterCreateCash["Transaction Delta"], beforeCash["Transaction Delta"] - 85);
  assert.equal(afterCreateCash["Calculated Balance"], beforeCash["Calculated Balance"] - 85);
  assert.equal(afterCreateCash["Manual Balance"], beforeCash["Manual Balance"]);
  assert.equal(afterDeleteCash["Transaction Delta"], beforeCash["Transaction Delta"]);
  assert.equal(afterDeleteCash["Calculated Balance"], beforeCash["Calculated Balance"]);
  assert.equal(context.flushCount, 2);
});

test("updateMockTransaction and softDeleteMockTransaction leave real rows untouched", () => {
  const spreadsheet = createSetupWorkbook();
  seedTransaction(spreadsheet);
  context.seedMockWorkbook();
  context.flushCount = 0;
  const realTransactions = spreadsheet.getSheetByName("Transactions");
  const mockTransactions = spreadsheet.getSheetByName("Mock_Transactions");
  const mockId = mockTransactions.values[1][0];

  const update = context.updateMockTransaction(mockId, {
    Amount: 222,
    Memo: "Edited mock transaction"
  });
  const remove = context.softDeleteMockTransaction(mockId);

  assert.equal(update.ok, true);
  assert.equal(remove.ok, true);
  assert.equal(realTransactions.values.length, 2);
  assert.equal(realTransactions.values[1][0], "EXP-ACTIVE");
  assert.equal(realTransactions.values[1][14], "Original memo");
  assert.equal(mockTransactions.values[1][5], 222);
  assert.equal(mockTransactions.values[1][14], "Edited mock transaction");
  assert.equal(mockTransactions.values[1][16], true);
});

test("getRecentMockTransactions hides deleted mock rows", () => {
  const spreadsheet = createSeededMockWorkbook();
  const mockTransactions = spreadsheet.getSheetByName("Mock_Transactions");
  const mockId = mockTransactions.values[1][0];
  context.softDeleteMockTransaction(mockId);

  const result = context.getRecentMockTransactions(20);

  assert.equal(result.ok, true);
  assert.equal(result.mode, "mock");
  assert.equal(
    result.transactions.some((transaction) => transaction["Transaction ID"] === mockId),
    false
  );
});

test("runMockQuickLogCheck verifies mock create edit delete without changing real Transactions", () => {
  const spreadsheet = createSetupWorkbook();
  seedTransaction(spreadsheet);
  context.flushCount = 0;
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.runMockQuickLogCheck();
  const realTransactions = spreadsheet.getSheetByName("Transactions");
  const mockTransactions = spreadsheet.getSheetByName("Mock_Transactions");

  assert.equal(result.ok, true);
  assert.equal(result.mode, "mock");
  assert.equal(result.realTransactionsSheetExists, true);
  assert.equal(result.realTransactionsUntouched, true);
  assert.equal(result.realTransactionsRowCountBefore, 2);
  assert.equal(result.realTransactionsRowCountAfter, 2);
  assert.equal(realTransactions.values.length, 2);
  assert.equal(result.steps.seed, true);
  assert.equal(result.steps.create, true);
  assert.equal(result.steps.update, true);
  assert.equal(result.steps.softDelete, true);
  assert.equal(result.steps.deletedHiddenFromRecent, true);
  assert.equal(result.finalTransaction.memo, "Automated mock smoke test edited");
  assert.equal(result.finalTransaction.deleted, true);
  assert.equal(
    mockTransactions.values.some((row) => row[0] === result.transactionId),
    true
  );
});

test("runMockQuickLogCheck reports when real Transactions does not exist yet", () => {
  const spreadsheet = new FakeSpreadsheet();
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.runMockQuickLogCheck();

  assert.equal(result.ok, true);
  assert.equal(result.mode, "mock");
  assert.equal(result.realTransactionsSheetExists, false);
  assert.equal(result.realTransactionsUntouched, true);
  assert.equal(result.realTransactionsRowCountBefore, null);
  assert.equal(result.realTransactionsRowCountAfter, null);
  assert.match(result.message, /does not exist yet/);
});

test("runMockQuickLogSmokeTest remains a backwards-compatible alias", () => {
  const spreadsheet = createSetupWorkbook();
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.runMockQuickLogSmokeTest();

  assert.equal(result.ok, true);
  assert.equal(result.mode, "mock");
  assert.equal(result.steps.deletedHiddenFromRecent, true);
});

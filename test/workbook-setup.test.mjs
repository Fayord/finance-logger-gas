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
    let lastRow = this.values.length;

    for (const key of this.formulas.keys()) {
      const [row] = key.split(":").map(Number);
      lastRow = Math.max(lastRow, row);
    }

    return lastRow;
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

  getValues() {
    return Array.from({ length: this.numRows }, (_, rowOffset) => {
      const sourceRow = this.sheet.values[this.row + rowOffset - 1] || [];

      return Array.from({ length: this.numColumns }, (_, columnOffset) => {
        const value = sourceRow[this.column + columnOffset - 1];
        return value === undefined ? "" : value;
      });
    });
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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("setupWorkbook creates missing real tabs with headers and safe reference data", () => {
  const spreadsheet = new FakeSpreadsheet();
  context.flushCount = 0;
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.setupWorkbook();

  assert.equal(result.ok, true);
  assert.equal(context.flushCount, 1);
  assert.deepEqual(plain(result.createdSheets), plain(Object.values(context.FINANCE_SHEETS)));
  assert.equal(spreadsheet.getSheets().length, Object.values(context.FINANCE_SHEETS).length);
  assert.deepEqual(spreadsheet.getSheetByName("Transactions").values[0], plain(context.TRANSACTION_HEADERS));
  assert.equal(spreadsheet.getSheetByName("Expense_Categories").values.length, 41);
  assert.equal(spreadsheet.getSheetByName("Settings").values.length, 5);
});

test("setupWorkbook does not wipe existing real transaction rows", () => {
  const spreadsheet = new FakeSpreadsheet();
  const transactions = spreadsheet.insertSheet("Transactions");
  transactions.getRange(1, 1, 2, 18).setValues([
    plain(context.TRANSACTION_HEADERS),
    [
      "REAL-001",
      "2026-06-30",
      "2026-06-30T10:00:00.000Z",
      "2026-06-30T10:00:00.000Z",
      "Expense",
      100,
      "Food & Dining",
      "Eating Out",
      "cash",
      "",
      "",
      "",
      "No",
      "",
      "Existing row",
      "",
      false,
      ""
    ]
  ]);
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.setupWorkbook();

  assert.equal(result.ok, true);
  assert.deepEqual(transactions.values[1], [
    "REAL-001",
    "2026-06-30",
    "2026-06-30T10:00:00.000Z",
    "2026-06-30T10:00:00.000Z",
    "Expense",
    100,
    "Food & Dining",
    "Eating Out",
    "cash",
    "",
    "",
    "",
    "No",
    "",
    "Existing row",
    "",
    false,
    ""
  ]);
});

test("setupWorkbook formula views are rebuilt from real Transactions", () => {
  const spreadsheet = new FakeSpreadsheet();
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.setupWorkbook();
  const expensesView = spreadsheet.getSheetByName("Expenses_View");

  assert.equal(result.ok, true);
  assert.equal(expensesView.values.length, 1);
  assert.match(expensesView.getRange(2, 1).getFormula(), /^=FILTER\(Transactions!A:R,/);
  assert.match(expensesView.getRange(2, 1).getFormula(), /"Expense"/);
});

test("setupWorkbook skips seeding reference data when a reference tab already has rows", () => {
  const spreadsheet = new FakeSpreadsheet();
  const settings = spreadsheet.insertSheet("Settings");
  settings.getRange(1, 1, 2, 3).setValues([
    plain(context.SETTING_HEADERS),
    ["timezone", "Asia/Bangkok", "User-owned setting"]
  ]);
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.setupWorkbook();

  assert.equal(result.ok, true);
  assert.ok(result.skippedSheets.includes("Settings"));
  assert.deepEqual(settings.values, [
    plain(context.SETTING_HEADERS),
    ["timezone", "Asia/Bangkok", "User-owned setting"]
  ]);
});

test("getWorkbookSetupStatus reports missing tabs before setup and complete tabs after setup", () => {
  const spreadsheet = new FakeSpreadsheet();
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const before = context.getWorkbookSetupStatus();
  context.setupWorkbook();
  const after = context.getWorkbookSetupStatus();

  assert.equal(before.ok, false);
  assert.deepEqual(plain(before.missingSheets), plain(Object.values(context.FINANCE_SHEETS)));
  assert.equal(after.ok, true);
  assert.deepEqual(plain(after.missingSheets), []);
});

test("real workbook setup refuses mock or unknown sheet names", () => {
  assert.throws(() => context.assertRealSheetName_("Mock_Transactions"), /Refusing to setup mock sheet/);
  assert.throws(() => context.assertRealSheetName_("Random_Tab"), /Refusing to setup unknown real app sheet/);
});

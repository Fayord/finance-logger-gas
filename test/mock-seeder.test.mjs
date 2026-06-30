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
    this.resizedColumns = [];
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

  autoResizeColumns(startColumn, columnCount) {
    this.resizedColumns.push([startColumn, columnCount]);
  }

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
vm.runInContext(fs.readFileSync("src/MockSeeder.gs", "utf8"), context);

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("seedMockWorkbook creates only Mock_ tabs and leaves real tabs untouched", () => {
  const spreadsheet = new FakeSpreadsheet();
  const realTransactions = spreadsheet.insertSheet("Transactions");
  realTransactions.getRange(1, 1, 2, 2).setValues([
    ["Real Header", "Keep"],
    ["REAL-001", "Do not edit"]
  ]);
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.seedMockWorkbook();

  assert.equal(result.ok, true);
  assert.equal(context.flushCount, 1);
  assert.deepEqual(
    plain(result.createdSheets),
    plain(Object.values(context.MOCK_FINANCE_SHEETS))
  );
  assert.deepEqual(realTransactions.values, [
    ["Real Header", "Keep"],
    ["REAL-001", "Do not edit"]
  ]);
  assert.equal(spreadsheet.getSheetByName("Transactions"), realTransactions);
  assert.ok(spreadsheet.getSheetByName("Mock_Transactions"));
});

test("seedMockWorkbook reruns cleanly without duplicating mock tabs", () => {
  const spreadsheet = new FakeSpreadsheet();
  context.flushCount = 0;
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const firstResult = context.seedMockWorkbook();
  const mockTransactions = spreadsheet.getSheetByName("Mock_Transactions");
  mockTransactions.getRange(99, 1, 1, 1).setValues([["stale row"]]);
  mockTransactions.getRange(1, 1, 1, 1).createFilter();

  const secondResult = context.seedMockWorkbook();
  const sheetNames = spreadsheet.getSheets().map((sheet) => sheet.getName());
  const transactionPlan = context
    .buildMockWorkbook()
    .sheets.find((sheet) => sheet.name === "Mock_Transactions");

  assert.equal(firstResult.ok, true);
  assert.equal(secondResult.ok, true);
  assert.equal(spreadsheet.getSheets().length, Object.values(context.MOCK_FINANCE_SHEETS).length);
  assert.deepEqual(plain(secondResult.createdSheets), []);
  assert.deepEqual(plain(secondResult.updatedSheets), plain(Object.values(context.MOCK_FINANCE_SHEETS)));
  assert.deepEqual(plain(sheetNames), plain(Object.values(context.MOCK_FINANCE_SHEETS)));
  assert.equal(mockTransactions.values.length, transactionPlan.rows.length + 1);
  assert.equal(mockTransactions.filterRange.numColumns, transactionPlan.headers.length);
});

test("formula view sheets are seeded as formulas, not static copied rows", () => {
  const spreadsheet = new FakeSpreadsheet();
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const result = context.seedMockWorkbook();
  const expensesView = spreadsheet.getSheetByName("Mock_Expenses_View");

  assert.equal(result.ok, true);
  assert.equal(expensesView.values.length, 1);
  assert.match(expensesView.getRange(2, 1).getFormula(), /^=FILTER\(Mock_Transactions!A:R,/);
  assert.match(expensesView.getRange(2, 1).getFormula(), /"Expense"/);
});

test("getMockWorkbookStatus reports missing tabs before seed and complete tabs after seed", () => {
  const spreadsheet = new FakeSpreadsheet();
  context.getFinanceSpreadsheet_ = () => spreadsheet;

  const before = context.getMockWorkbookStatus();
  context.seedMockWorkbook();
  const after = context.getMockWorkbookStatus();

  assert.equal(before.ok, false);
  assert.deepEqual(plain(before.missingSheets), plain(Object.values(context.MOCK_FINANCE_SHEETS)));
  assert.equal(after.ok, true);
  assert.deepEqual(plain(after.missingSheets), []);
  assert.ok(after.sheets.every((sheetStatus) => sheetStatus.exists));
});

test("mock seeder refuses non-mock sheet names", () => {
  assert.throws(() => context.assertMockSheetName_("Transactions"), /Refusing to seed non-mock sheet/);
});

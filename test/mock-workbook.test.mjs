import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const context = {
  console,
  Date,
  Number,
  Object,
  String,
  Boolean
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("src/Schema.js", "utf8"), context);
vm.runInContext(fs.readFileSync("src/TransactionModel.js", "utf8"), context);
vm.runInContext(fs.readFileSync("src/MockWorkbook.js", "utf8"), context);

function getSheet(workbook, name) {
  const sheet = workbook.sheets.find((candidate) => candidate.name === name);
  assert.ok(sheet, `${name} should exist`);
  return sheet;
}

function rowsToObjects(headers, rows) {
  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index]]))
  );
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("mock workbook includes every required mock tab and never targets real tabs", () => {
  const workbook = context.buildMockWorkbook();
  const sheetNames = workbook.sheets.map((sheet) => sheet.name);
  const expectedSheetNames = Object.values(context.MOCK_FINANCE_SHEETS);
  const realSheetNames = Object.values(context.FINANCE_SHEETS);

  assert.deepEqual(plain(sheetNames), plain(expectedSheetNames));

  for (const sheetName of sheetNames) {
    assert.match(sheetName, /^Mock_/);
    assert.equal(realSheetNames.includes(sheetName), false);
  }
});

test("mock transactions cover expense, income, transfer, deleted, and uncertain examples", () => {
  const workbook = context.buildMockWorkbook();
  const transactionsSheet = getSheet(workbook, "Mock_Transactions");
  const transactions = rowsToObjects(transactionsSheet.headers, transactionsSheet.rows);
  const types = new Set(transactions.map((transaction) => transaction.Type));

  assert.deepEqual(types, new Set(["Expense", "Income", "Transfer"]));
  assert.ok(transactions.some((transaction) => transaction["Deleted?"] === true));
  assert.ok(transactions.some((transaction) => transaction["Tax Deduction Status"] === "Check"));
  assert.ok(transactions.some((transaction) => transaction["Taxable?"] === "Check"));
  assert.ok(
    transactions.some(
      (transaction) =>
        transaction["Tier 1"] === "Financial & Admin" && transaction["Tier 2"] === "Missing"
    )
  );
});

test("mock transaction view tabs are formulas filtering Mock_Transactions", () => {
  const workbook = context.buildMockWorkbook();
  const expectedViews = [
    ["Mock_Expenses_View", '"Expense"'],
    ["Mock_Income_View", '"Income"'],
    ["Mock_Transfers_View", '"Transfer"']
  ];

  for (const [sheetName, typeLiteral] of expectedViews) {
    const sheet = getSheet(workbook, sheetName);

    assert.equal(sheet.kind, "formula-view");
    assert.match(sheet.formula, /^=FILTER\(Mock_Transactions!A:R,/);
    assert.match(sheet.formula, /Mock_Transactions!Q:Q<>TRUE\)$/);
    assert.ok(sheet.formula.includes(typeLiteral));
    assert.equal(sheet.rows.length, 0);
  }
});

test("mock balances match opening balances plus active mock transactions", () => {
  const workbook = context.buildMockWorkbook();
  const accountsSheet = getSheet(workbook, "Mock_Accounts");
  const transactionsSheet = getSheet(workbook, "Mock_Transactions");
  const balancesSheet = getSheet(workbook, "Mock_Balances");
  const accounts = rowsToObjects(accountsSheet.headers, accountsSheet.rows);
  const transactions = rowsToObjects(transactionsSheet.headers, transactionsSheet.rows);
  const balances = rowsToObjects(balancesSheet.headers, balancesSheet.rows);
  const expectedBalances = context.calculateBalances(accounts, transactions);

  for (const expectedBalance of expectedBalances) {
    const actualBalance = balances.find(
      (candidate) => candidate["Account ID"] === expectedBalance["Account ID"]
    );

    assert.ok(actualBalance, `${expectedBalance["Account ID"]} balance should exist`);
    assert.equal(actualBalance["Opening Balance"], expectedBalance["Opening Balance"]);
    assert.equal(actualBalance["Transaction Delta"], expectedBalance["Transaction Delta"]);
    assert.equal(actualBalance["Calculated Balance"], expectedBalance["Calculated Balance"]);
  }
});

test("mock category and preset tabs include the planned review coverage", () => {
  const workbook = context.buildMockWorkbook();
  const expenseCategories = getSheet(workbook, "Mock_Expense_Categories");
  const incomeCategories = rowsToObjects(
    getSheet(workbook, "Mock_Income_Categories").headers,
    getSheet(workbook, "Mock_Income_Categories").rows
  );
  const transferCategories = rowsToObjects(
    getSheet(workbook, "Mock_Transfer_Categories").headers,
    getSheet(workbook, "Mock_Transfer_Categories").rows
  );
  const presets = rowsToObjects(getSheet(workbook, "Mock_Presets").headers, getSheet(workbook, "Mock_Presets").rows);

  assert.equal(expenseCategories.rows.length, 40);
  assert.deepEqual(
    plain(incomeCategories.map((row) => row.Category)),
    ["Salary", "Freelance / Business Income", "Gifts", "Refunds", "Interest", "Other Income"]
  );
  assert.deepEqual(
    plain(transferCategories.map((row) => row.Category)),
    [
      "Account Transfer",
      "Credit Card Payment",
      "Investment Transfer",
      "Cash Withdraw / Deposit",
      "Loan Transfer",
      "Other Transfer"
    ]
  );
  assert.deepEqual(
    plain(presets.map((row) => row["Preset Name"])),
    ["Milk Tea", "Metro Wallet", "Salary", "Credit Card Payment", "Investment", "Buffet", "Mom Care"]
  );
});

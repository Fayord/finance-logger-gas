import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const context = {
  console,
  Date,
  Number,
  Object,
  String
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("src/Schema.js", "utf8"), context);
vm.runInContext(fs.readFileSync("src/TransactionModel.js", "utf8"), context);

const workbook = JSON.parse(fs.readFileSync("test/fixtures/mock-workbook.json", "utf8"));

test("normalizes a transaction without touching Google services", () => {
  const transaction = context.normalizeTransaction(
    {
      Type: "Expense",
      Amount: "-85",
      "Tier 1": "Food & Dining",
      "Tier 2": "Sweet Drinks & Snacks",
      Account: "cash"
    },
    { now: "2026-06-30T12:34:56.000Z" }
  );

  assert.equal(transaction["Transaction ID"], "EXP-20260630123456");
  assert.equal(transaction.Date, "2026-06-30");
  assert.equal(transaction.Amount, 85);
  assert.equal(transaction["Deleted?"], false);
});

test("validates transaction-type-specific required fields", () => {
  const invalidTransfer = context.normalizeTransaction(
    {
      Type: "Transfer",
      Amount: 100,
      "Tier 1": "Move Money",
      "From Account": "cash",
      "To Account": "cash"
    },
    { now: "2026-06-30T12:34:56.000Z" }
  );

  const result = context.validateTransaction(invalidTransfer);

  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /must be different/);
});

test("builds filtered view data from one master Transactions table", () => {
  const views = context.buildTransactionViews(workbook.sheets.Transactions);

  assert.equal(views.Expenses_View.length, 1);
  assert.equal(views.Income_View.length, 1);
  assert.equal(views.Transfers_View.length, 1);
  assert.equal(views.Expenses_View[0].Type, "Expense");
});

test("calculates balances from opening balances plus transaction deltas", () => {
  const balances = context.calculateBalances(workbook.sheets.Accounts, workbook.sheets.Transactions);
  const cash = balances.find((row) => row["Account ID"] === "cash");
  const kbank = balances.find((row) => row["Account ID"] === "kbank");

  assert.equal(cash["Transaction Delta"], 915);
  assert.equal(cash["Calculated Balance"], 1915);
  assert.equal(kbank["Transaction Delta"], 4000);
  assert.equal(kbank["Calculated Balance"], 14000);
});

/**
 * Pure transaction helpers. Keep this file free of SpreadsheetApp so it can
 * be tested locally before pushing to Apps Script.
 */
function normalizeTransaction(input, options) {
  var now = options && options.now ? options.now : new Date().toISOString();
  var transaction = {};

  TRANSACTION_HEADERS.forEach(function (header) {
    transaction[header] = input[header] === undefined ? "" : input[header];
  });

  transaction["Transaction ID"] =
    transaction["Transaction ID"] || createLocalTransactionId(transaction.Type, now);
  transaction.Date = transaction.Date || now.slice(0, 10);
  transaction["Created At"] = transaction["Created At"] || now;
  transaction["Updated At"] = now;
  transaction.Amount = Math.abs(Number(transaction.Amount || 0));
  transaction["Deleted?"] = toBoolean(transaction["Deleted?"]);

  return transaction;
}

function validateTransaction(transaction) {
  var errors = [];

  if (!Object.values(TRANSACTION_TYPES).includes(transaction.Type)) {
    errors.push("Type must be Expense, Income, or Transfer.");
  }

  if (!transaction.Date) {
    errors.push("Date is required.");
  }

  if (!Number.isFinite(Number(transaction.Amount)) || Number(transaction.Amount) <= 0) {
    errors.push("Amount must be a positive number.");
  }

  if (transaction.Type === TRANSACTION_TYPES.EXPENSE) {
    requireFields(transaction, ["Tier 1", "Tier 2", "Account"], errors);
  }

  if (transaction.Type === TRANSACTION_TYPES.INCOME) {
    requireFields(transaction, ["Tier 1", "Account"], errors);
  }

  if (transaction.Type === TRANSACTION_TYPES.TRANSFER) {
    requireFields(transaction, ["Tier 1", "From Account", "To Account"], errors);
    if (transaction["From Account"] && transaction["From Account"] === transaction["To Account"]) {
      errors.push("Transfer From Account and To Account must be different.");
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function buildTransactionViews(transactions) {
  var activeTransactions = transactions.filter(function (transaction) {
    return !toBoolean(transaction["Deleted?"]);
  });

  return {
    Expenses_View: activeTransactions.filter(function (transaction) {
      return transaction.Type === TRANSACTION_TYPES.EXPENSE;
    }),
    Income_View: activeTransactions.filter(function (transaction) {
      return transaction.Type === TRANSACTION_TYPES.INCOME;
    }),
    Transfers_View: activeTransactions.filter(function (transaction) {
      return transaction.Type === TRANSACTION_TYPES.TRANSFER;
    })
  };
}

function calculateBalances(accounts, transactions) {
  var balancesById = {};

  accounts.forEach(function (account) {
    var accountId = account["Account ID"];
    balancesById[accountId] = {
      "Account ID": accountId,
      "Display Name": account["Display Name"],
      "Opening Balance": Number(account["Opening Balance"] || 0),
      "Transaction Delta": 0,
      "Calculated Balance": Number(account["Opening Balance"] || 0)
    };
  });

  transactions.forEach(function (transaction) {
    if (toBoolean(transaction["Deleted?"])) {
      return;
    }

    var amount = Number(transaction.Amount || 0);

    if (transaction.Type === TRANSACTION_TYPES.EXPENSE) {
      addDelta(balancesById, transaction.Account, -amount);
    }

    if (transaction.Type === TRANSACTION_TYPES.INCOME) {
      addDelta(balancesById, transaction.Account, amount);
    }

    if (transaction.Type === TRANSACTION_TYPES.TRANSFER) {
      addDelta(balancesById, transaction["From Account"], -amount);
      addDelta(balancesById, transaction["To Account"], amount);
    }
  });

  return Object.keys(balancesById).map(function (accountId) {
    var row = balancesById[accountId];
    row["Calculated Balance"] = row["Opening Balance"] + row["Transaction Delta"];
    return row;
  });
}

function requireFields(transaction, fields, errors) {
  fields.forEach(function (field) {
    if (!transaction[field]) {
      errors.push(field + " is required.");
    }
  });
}

function addDelta(balancesById, accountId, amount) {
  if (!accountId || !balancesById[accountId]) {
    return;
  }

  balancesById[accountId]["Transaction Delta"] += amount;
}

function toBoolean(value) {
  return value === true || String(value).toUpperCase() === "TRUE";
}

function createLocalTransactionId(type, timestamp) {
  var prefix = String(type || "TXN").toUpperCase().slice(0, 3);
  var compactTime = String(timestamp).replace(/[^0-9]/g, "").slice(0, 14);
  return prefix + "-" + compactTime;
}

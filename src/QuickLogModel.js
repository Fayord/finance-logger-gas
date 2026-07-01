/**
 * Pure Quick Log helpers. Keep SpreadsheetApp access in QuickLog.gs.
 */
function buildQuickLogBootstrapData(workbookData, options) {
  var limit = Number((options && options.limit) || getSettingValue_(workbookData.settings, "recentLogLimit", 20));

  return {
    ok: true,
    defaultTransactionType: getSettingValue_(workbookData.settings, "defaultTransactionType", TRANSACTION_TYPES.EXPENSE),
    settings: settingsRowsToObject_(workbookData.settings),
    accounts: sortByOrder_(filterActiveRows_(workbookData.accounts)),
    expenseCategories: sortByOrder_(filterActiveRows_(workbookData.expenseCategories)),
    incomeCategories: sortByOrder_(filterActiveRows_(workbookData.incomeCategories)),
    transferCategories: sortByOrder_(filterActiveRows_(workbookData.transferCategories)),
    presets: sortByOrder_(filterActiveRows_(workbookData.presets)),
    recentTransactions: getRecentTransactionRecords(workbookData.transactions, limit)
  };
}

function createQuickLogTransaction(input, existingTransactions, options) {
  var now = options && options.now ? options.now : new Date().toISOString();
  var transactionInput = Object.assign({}, input);

  if (!transactionInput["Transaction ID"]) {
    transactionInput["Transaction ID"] =
      options && options.transactionId
        ? options.transactionId
        : createUniqueTransactionId_(transactionInput.Type, now, existingTransactions);
  }

  var transaction = normalizeTransaction(transactionInput, { now: now });
  var validation = validateTransaction(transaction);

  if (!validation.valid) {
    return {
      ok: false,
      errors: validation.errors,
      transaction: transaction
    };
  }

  return {
    ok: true,
    transaction: transaction,
    row: transactionToSheetRow(transaction)
  };
}

function updateQuickLogTransaction(transactionId, input, existingTransactions, options) {
  var existingTransaction = findTransactionById_(existingTransactions, transactionId);
  var now = options && options.now ? options.now : new Date().toISOString();

  if (!existingTransaction) {
    return {
      ok: false,
      errors: ["Transaction not found: " + transactionId],
      transaction: null
    };
  }

  var transactionInput = Object.assign({}, existingTransaction, input || {}, {
    "Transaction ID": existingTransaction["Transaction ID"],
    "Created At": existingTransaction["Created At"],
    "Deleted?": existingTransaction["Deleted?"],
    "Deleted At": existingTransaction["Deleted At"]
  });
  var transaction = normalizeTransaction(transactionInput, { now: now });
  var validation = validateTransaction(transaction);

  if (!validation.valid) {
    return {
      ok: false,
      errors: validation.errors,
      transaction: transaction
    };
  }

  return {
    ok: true,
    transaction: transaction,
    row: transactionToSheetRow(transaction)
  };
}

function softDeleteQuickLogTransaction(transactionId, existingTransactions, options) {
  var existingTransaction = findTransactionById_(existingTransactions, transactionId);
  var now = options && options.now ? options.now : new Date().toISOString();

  if (!existingTransaction) {
    return {
      ok: false,
      errors: ["Transaction not found: " + transactionId],
      transaction: null
    };
  }

  var transaction = Object.assign({}, existingTransaction, {
    "Updated At": now,
    "Deleted?": true,
    "Deleted At": existingTransaction["Deleted At"] || now
  });

  return {
    ok: true,
    transaction: transaction,
    row: transactionToSheetRow(transaction)
  };
}

function getRecentTransactionRecords(transactions, limit) {
  var normalizedLimit = Math.max(Number(limit || 20), 1);

  return transactions
    .filter(function (transaction) {
      return !toBoolean(transaction["Deleted?"]);
    })
    .slice()
    .sort(function (left, right) {
      return getTransactionSortValue_(right) - getTransactionSortValue_(left);
    })
    .slice(0, normalizedLimit);
}

function buildBalanceRows(accounts, transactions, existingBalances, options) {
  var existingByAccountId = (existingBalances || []).reduce(function (lookup, balance) {
    lookup[balance["Account ID"]] = balance;
    return lookup;
  }, {});
  var reconciledAt = options && options.reconciledAt ? options.reconciledAt : "";

  return calculateBalances(accounts, transactions).map(function (balance) {
    var existing = existingByAccountId[balance["Account ID"]] || {};
    var manualBalance = existing["Manual Balance"] === undefined ? "" : existing["Manual Balance"];
    var balanceDifference = manualBalance === "" ? "" : Number(manualBalance) - balance["Calculated Balance"];

    return {
      "Account ID": balance["Account ID"],
      "Display Name": balance["Display Name"],
      "Opening Balance": balance["Opening Balance"],
      "Transaction Delta": balance["Transaction Delta"],
      "Calculated Balance": balance["Calculated Balance"],
      "Manual Balance": manualBalance,
      "Balance Difference": balanceDifference,
      "Last Reconciled At": existing["Last Reconciled At"] || reconciledAt,
      Notes: existing.Notes || ""
    };
  });
}

function replaceTransactionRecord_(transactions, replacement) {
  return transactions.map(function (transaction) {
    return transaction["Transaction ID"] === replacement["Transaction ID"] ? replacement : transaction;
  });
}

function transactionToSheetRow(transaction) {
  return TRANSACTION_HEADERS.map(function (header) {
    return transaction[header] === undefined ? "" : transaction[header];
  });
}

function sheetRowsToObjects(rows, headers) {
  return rows.map(function (row) {
    var record = {};

    headers.forEach(function (header, index) {
      record[header] = row[index] === undefined ? "" : row[index];
    });

    return record;
  });
}

function findTransactionById_(transactions, transactionId) {
  return transactions.find(function (transaction) {
    return transaction["Transaction ID"] === transactionId;
  });
}

function filterActiveRows_(rows) {
  return rows.filter(function (row) {
    return row["Active?"] === undefined || toBoolean(row["Active?"]);
  });
}

function sortByOrder_(rows) {
  return rows.slice().sort(function (left, right) {
    var leftOrder = Number(left["Sort Order"] || 999999);
    var rightOrder = Number(right["Sort Order"] || 999999);

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return String(left["Display Name"] || left.Category || left["Tier 1"] || left["Preset Name"] || "").localeCompare(
      String(right["Display Name"] || right.Category || right["Tier 1"] || right["Preset Name"] || "")
    );
  });
}

function settingsRowsToObject_(rows) {
  return rows.reduce(function (settings, row) {
    if (row.Key) {
      settings[row.Key] = row.Value;
    }

    return settings;
  }, {});
}

function getSettingValue_(settingsRows, key, fallback) {
  var match = settingsRows.find(function (row) {
    return row.Key === key;
  });

  return match && match.Value !== "" ? match.Value : fallback;
}

function createUniqueTransactionId_(type, timestamp, existingTransactions) {
  var baseId = createLocalTransactionId(type, timestamp);
  var existingIds = existingTransactions.map(function (transaction) {
    return transaction["Transaction ID"];
  });

  if (existingIds.indexOf(baseId) === -1) {
    return baseId;
  }

  var suffix = 2;
  var candidate = baseId + "-" + suffix;

  while (existingIds.indexOf(candidate) !== -1) {
    suffix += 1;
    candidate = baseId + "-" + suffix;
  }

  return candidate;
}

function getTransactionSortValue_(transaction) {
  var datePart = transaction["Created At"] || transaction["Updated At"] || transaction.Date || "";
  var timestamp = Date.parse(datePart);

  return Number.isFinite(timestamp) ? timestamp : 0;
}

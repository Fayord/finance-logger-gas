/**
 * Quick Log backend functions for Apps Script HTML service calls.
 */
function getQuickLogBootstrap() {
  return getQuickLogBootstrapForSheets_(FINANCE_SHEETS, "real");
}

function getMockQuickLogBootstrap() {
  return getQuickLogBootstrapForSheets_(MOCK_FINANCE_SHEETS, "mock");
}

function getQuickLogBootstrapForSheets_(sheetNames, mode) {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createQuickLogError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    ensureQuickLogSheets_(spreadsheet, sheetNames, mode);

    var workbookData = readQuickLogWorkbookData_(spreadsheet, sheetNames);
    var bootstrap = buildQuickLogBootstrapData(workbookData);

    bootstrap.checkedAt = new Date().toISOString();
    bootstrap.mode = mode;
    bootstrap.spreadsheet = getSpreadsheetSummary_(spreadsheet);

    return toJsonSafeValue_(bootstrap);
  } catch (error) {
    return createQuickLogError_(error && error.message ? error.message : String(error));
  }
}

function createTransaction(input) {
  return createTransactionForSheets_(input, FINANCE_SHEETS, "real");
}

function createMockTransaction(input) {
  return createTransactionForSheets_(input, MOCK_FINANCE_SHEETS, "mock");
}

function createTransactionForSheets_(input, sheetNames, mode) {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createQuickLogError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    ensureQuickLogSheets_(spreadsheet, sheetNames, mode);

    var transactionsSheet = spreadsheet.getSheetByName(sheetNames.TRANSACTIONS);
    var workbookData = readQuickLogWorkbookData_(spreadsheet, sheetNames);
    var existingTransactions = workbookData.transactions;
    var result = createQuickLogTransaction(input || {}, existingTransactions, {
      now: new Date().toISOString(),
      transactionId: createGasTransactionId_(input && input.Type),
      referenceData: workbookData
    });

    if (!result.ok) {
      return {
        ok: false,
        message: "Transaction validation failed.",
        errors: result.errors,
        transaction: result.transaction
      };
    }

    transactionsSheet
      .getRange(transactionsSheet.getLastRow() + 1, 1, 1, TRANSACTION_HEADERS.length)
      .setValues([result.row]);

    var updatedTransactions = existingTransactions.concat([result.transaction]);
    var updatedBalances = refreshBalancesForSheets_(spreadsheet, sheetNames);
    SpreadsheetApp.flush();

    return toJsonSafeValue_({
      ok: true,
      message: "Transaction created.",
      createdAt: result.transaction["Created At"],
      mode: mode,
      transaction: result.transaction,
      balances: updatedBalances,
      recentTransactions: getRecentTransactionRecords(updatedTransactions, getRecentLogLimit_(spreadsheet, sheetNames))
    });
  } catch (error) {
    return createQuickLogError_(error && error.message ? error.message : String(error));
  }
}

function updateTransaction(transactionId, input) {
  return updateTransactionForSheets_(transactionId, input, FINANCE_SHEETS, "real");
}

function updateMockTransaction(transactionId, input) {
  return updateTransactionForSheets_(transactionId, input, MOCK_FINANCE_SHEETS, "mock");
}

function updateTransactionForSheets_(transactionId, input, sheetNames, mode) {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createQuickLogError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    ensureQuickLogSheets_(spreadsheet, sheetNames, mode);

    var transactionsSheet = spreadsheet.getSheetByName(sheetNames.TRANSACTIONS);
    var workbookData = readQuickLogWorkbookData_(spreadsheet, sheetNames);
    var existingRows = readSheetObjectsWithRowNumbers_(transactionsSheet, TRANSACTION_HEADERS);
    var existingTransactions = workbookData.transactions;
    var targetRow = existingRows.find(function (row) {
      return row.record["Transaction ID"] === transactionId;
    });
    var result = updateQuickLogTransaction(transactionId, input || {}, existingTransactions, {
      now: new Date().toISOString(),
      referenceData: workbookData
    });

    if (!result.ok) {
      return {
        ok: false,
        message: "Transaction update failed.",
        errors: result.errors,
        transaction: result.transaction
      };
    }

    transactionsSheet.getRange(targetRow.rowNumber, 1, 1, TRANSACTION_HEADERS.length).setValues([result.row]);

    var updatedTransactions = replaceTransactionRecord_(existingTransactions, result.transaction);
    var updatedBalances = refreshBalancesForSheets_(spreadsheet, sheetNames);
    SpreadsheetApp.flush();

    return toJsonSafeValue_({
      ok: true,
      message: "Transaction updated.",
      updatedAt: result.transaction["Updated At"],
      mode: mode,
      transaction: result.transaction,
      balances: updatedBalances,
      recentTransactions: getRecentTransactionRecords(updatedTransactions, getRecentLogLimit_(spreadsheet, sheetNames))
    });
  } catch (error) {
    return createQuickLogError_(error && error.message ? error.message : String(error));
  }
}

function softDeleteTransaction(transactionId) {
  return softDeleteTransactionForSheets_(transactionId, FINANCE_SHEETS, "real");
}

function softDeleteMockTransaction(transactionId) {
  return softDeleteTransactionForSheets_(transactionId, MOCK_FINANCE_SHEETS, "mock");
}

function softDeleteTransactionForSheets_(transactionId, sheetNames, mode) {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createQuickLogError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    ensureQuickLogSheets_(spreadsheet, sheetNames, mode);

    var transactionsSheet = spreadsheet.getSheetByName(sheetNames.TRANSACTIONS);
    var existingRows = readSheetObjectsWithRowNumbers_(transactionsSheet, TRANSACTION_HEADERS);
    var existingTransactions = existingRows.map(function (row) {
      return row.record;
    });
    var targetRow = existingRows.find(function (row) {
      return row.record["Transaction ID"] === transactionId;
    });
    var result = softDeleteQuickLogTransaction(transactionId, existingTransactions, {
      now: new Date().toISOString()
    });

    if (!result.ok) {
      return {
        ok: false,
        message: "Transaction delete failed.",
        errors: result.errors,
        transaction: result.transaction
      };
    }

    transactionsSheet.getRange(targetRow.rowNumber, 1, 1, TRANSACTION_HEADERS.length).setValues([result.row]);

    var updatedTransactions = replaceTransactionRecord_(existingTransactions, result.transaction);
    var updatedBalances = refreshBalancesForSheets_(spreadsheet, sheetNames);
    SpreadsheetApp.flush();

    return toJsonSafeValue_({
      ok: true,
      message: "Transaction deleted.",
      deletedAt: result.transaction["Deleted At"],
      mode: mode,
      transaction: result.transaction,
      balances: updatedBalances,
      recentTransactions: getRecentTransactionRecords(updatedTransactions, getRecentLogLimit_(spreadsheet, sheetNames))
    });
  } catch (error) {
    return createQuickLogError_(error && error.message ? error.message : String(error));
  }
}

function getRecentTransactions(limit) {
  return getRecentTransactionsForSheets_(limit, FINANCE_SHEETS, "real");
}

function getRecentMockTransactions(limit) {
  return getRecentTransactionsForSheets_(limit, MOCK_FINANCE_SHEETS, "mock");
}

function runMockQuickLogSmokeTest() {
  return runMockQuickLogCheck();
}

function runMockQuickLogCheck() {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createQuickLogError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    var realTransactions = spreadsheet.getSheetByName(FINANCE_SHEETS.TRANSACTIONS);
    var realTransactionsSheetExists = Boolean(realTransactions);
    var realRowCountBefore = realTransactions ? realTransactions.getLastRow() : null;
    var seedResult = seedMockWorkbook();

    if (!seedResult.ok) {
      return seedResult;
    }

    var createResult = createMockTransaction({
      Type: TRANSACTION_TYPES.EXPENSE,
      Date: new Date().toISOString().slice(0, 10),
      Amount: 42.5,
      "Tier 1": "Food & Dining",
      "Tier 2": "Sweet Drinks & Snacks",
      Account: "cash-wallet",
      Memo: "Automated mock smoke test"
    });

    if (!createResult.ok) {
      return createResult;
    }

    var transactionId = createResult.transaction["Transaction ID"];
    var updateResult = updateMockTransaction(transactionId, {
      Amount: 43,
      Memo: "Automated mock smoke test edited"
    });

    if (!updateResult.ok) {
      return updateResult;
    }

    var deleteResult = softDeleteMockTransaction(transactionId);

    if (!deleteResult.ok) {
      return deleteResult;
    }

    var recentResult = getRecentMockTransactions(20);
    var realRowCountAfter = realTransactions ? realTransactions.getLastRow() : null;

    return toJsonSafeValue_({
      ok: true,
      mode: "mock",
      message: realTransactionsSheetExists
        ? "Mock Quick Log smoke test passed. Real Transactions was not edited."
        : "Mock Quick Log smoke test passed. Real Transactions does not exist yet, so no real rows could be edited.",
      checkedAt: new Date().toISOString(),
      spreadsheet: getSpreadsheetSummary_(spreadsheet),
      transactionId: transactionId,
      realTransactionsSheetExists: realTransactionsSheetExists,
      realTransactionsRowCountBefore: realRowCountBefore,
      realTransactionsRowCountAfter: realRowCountAfter,
      realTransactionsUntouched: realRowCountBefore === realRowCountAfter,
      steps: {
        seed: seedResult.ok,
        create: createResult.ok,
        update: updateResult.ok,
        softDelete: deleteResult.ok,
        deletedHiddenFromRecent:
          recentResult.ok &&
          !recentResult.transactions.some(function (transaction) {
            return transaction["Transaction ID"] === transactionId;
          })
      },
      finalTransaction: {
        id: deleteResult.transaction["Transaction ID"],
        amount: deleteResult.transaction.Amount,
        memo: deleteResult.transaction.Memo,
        deleted: Boolean(deleteResult.transaction["Deleted?"]),
        deletedAt: deleteResult.transaction["Deleted At"]
      }
    });
  } catch (error) {
    return createQuickLogError_(error && error.message ? error.message : String(error));
  }
}

function getRecentTransactionsForSheets_(limit, sheetNames, mode) {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createQuickLogError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    ensureQuickLogSheets_(spreadsheet, sheetNames, mode);

    var transactions = readSheetObjects_(
      spreadsheet.getSheetByName(sheetNames.TRANSACTIONS),
      TRANSACTION_HEADERS
    );

    return toJsonSafeValue_({
      ok: true,
      checkedAt: new Date().toISOString(),
      mode: mode,
      transactions: getRecentTransactionRecords(transactions, limit || getRecentLogLimit_(spreadsheet, sheetNames))
    });
  } catch (error) {
    return createQuickLogError_(error && error.message ? error.message : String(error));
  }
}

function readQuickLogWorkbookData_(spreadsheet, sheetNames) {
  return {
    transactions: readSheetObjects_(spreadsheet.getSheetByName(sheetNames.TRANSACTIONS), TRANSACTION_HEADERS),
    accounts: readSheetObjects_(spreadsheet.getSheetByName(sheetNames.ACCOUNTS), ACCOUNT_HEADERS),
    expenseCategories: readSheetObjects_(
      spreadsheet.getSheetByName(sheetNames.EXPENSE_CATEGORIES),
      CATEGORY_HEADERS
    ),
    incomeCategories: readSheetObjects_(
      spreadsheet.getSheetByName(sheetNames.INCOME_CATEGORIES),
      INCOME_CATEGORY_HEADERS
    ),
    transferCategories: readSheetObjects_(
      spreadsheet.getSheetByName(sheetNames.TRANSFER_CATEGORIES),
      TRANSFER_CATEGORY_HEADERS
    ),
    presets: readSheetObjects_(spreadsheet.getSheetByName(sheetNames.PRESETS), PRESET_HEADERS),
    settings: readSheetObjects_(spreadsheet.getSheetByName(sheetNames.SETTINGS), SETTING_HEADERS)
  };
}

function readSheetObjects_(sheet, headers) {
  return readSheetObjectsWithRowNumbers_(sheet, headers).map(function (row) {
    return row.record;
  });
}

function readSheetObjectsWithRowNumbers_(sheet, headers) {
  if (!sheet) {
    return [];
  }

  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  var rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  return sheetRowsToObjects(rows, headers)
    .map(function (record, index) {
      return {
        rowNumber: index + 2,
        record: record
      };
    })
    .filter(function (row) {
      return Object.keys(row.record).some(function (key) {
        return row.record[key] !== "";
      });
    });
}

function ensureQuickLogSheets_(spreadsheet, sheetNames, mode) {
  var missingSheets = [
    sheetNames.TRANSACTIONS,
    sheetNames.ACCOUNTS,
    sheetNames.EXPENSE_CATEGORIES,
    sheetNames.INCOME_CATEGORIES,
    sheetNames.TRANSFER_CATEGORIES,
    sheetNames.PRESETS,
    sheetNames.SETTINGS
  ].filter(function (sheetName) {
    return !spreadsheet.getSheetByName(sheetName);
  });

  if (missingSheets.length > 0) {
    throw new Error(
      "Missing required " +
        mode +
        " Quick Log sheets. Run " +
        (mode === "mock" ? "seedMockWorkbook()" : "setupWorkbook()") +
        " first: " +
        missingSheets.join(", ")
    );
  }
}

function getRecentLogLimit_(spreadsheet, sheetNames) {
  var settings = readSheetObjects_(spreadsheet.getSheetByName(sheetNames.SETTINGS), SETTING_HEADERS);
  return Number(getSettingValue_(settings, "recentLogLimit", 20));
}

function refreshBalancesForSheets_(spreadsheet, sheetNames) {
  var balancesSheet = spreadsheet.getSheetByName(sheetNames.BALANCES);

  if (!balancesSheet) {
    return [];
  }

  var accounts = readSheetObjects_(spreadsheet.getSheetByName(sheetNames.ACCOUNTS), ACCOUNT_HEADERS);
  var transactions = readSheetObjects_(
    spreadsheet.getSheetByName(sheetNames.TRANSACTIONS),
    TRANSACTION_HEADERS
  );
  var existingBalances = readSheetObjects_(balancesSheet, BALANCE_HEADERS);
  var balances = buildBalanceRows(accounts, transactions, existingBalances, {
    reconciledAt: new Date().toISOString()
  });
  var rows = balances.map(function (balance) {
    return BALANCE_HEADERS.map(function (header) {
      return balance[header] === undefined ? "" : balance[header];
    });
  });

  if (balancesSheet.getFilter()) {
    balancesSheet.getFilter().remove();
  }

  balancesSheet.clear();
  balancesSheet.getRange(1, 1, 1, BALANCE_HEADERS.length).setValues([BALANCE_HEADERS]);
  balancesSheet.setFrozenRows(1);

  if (rows.length > 0) {
    balancesSheet.getRange(2, 1, rows.length, BALANCE_HEADERS.length).setValues(rows);
  }

  balancesSheet.getRange(1, 1, 1, BALANCE_HEADERS.length).setFontWeight("bold");
  balancesSheet.autoResizeColumns(1, BALANCE_HEADERS.length);

  if (rows.length > 0) {
    balancesSheet.getRange(1, 1, rows.length + 1, BALANCE_HEADERS.length).createFilter();
  }

  return balances;
}

function createGasTransactionId_(type) {
  var prefix = String(type || "TXN").toUpperCase().slice(0, 3);
  return prefix + "-" + Utilities.getUuid();
}

function createQuickLogError_(message) {
  return {
    ok: false,
    message: message,
    checkedAt: new Date().toISOString()
  };
}

function toJsonSafeValue_(value) {
  if (value === null || value === undefined) {
    return value === undefined ? "" : null;
  }

  if (Object.prototype.toString.call(value) === "[object Date]") {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(function (item) {
      return toJsonSafeValue_(item);
    });
  }

  if (typeof value === "object") {
    return Object.keys(value).reduce(function (safeObject, key) {
      safeObject[key] = toJsonSafeValue_(value[key]);
      return safeObject;
    }, {});
  }

  return value;
}

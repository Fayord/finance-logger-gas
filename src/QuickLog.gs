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

    return bootstrap;
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
    var existingTransactions = readSheetObjects_(transactionsSheet, TRANSACTION_HEADERS);
    var result = createQuickLogTransaction(input || {}, existingTransactions, {
      now: new Date().toISOString(),
      transactionId: createGasTransactionId_(input && input.Type)
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
    SpreadsheetApp.flush();

    var updatedTransactions = existingTransactions.concat([result.transaction]);

    return {
      ok: true,
      message: "Transaction created.",
      createdAt: result.transaction["Created At"],
      mode: mode,
      transaction: result.transaction,
      recentTransactions: getRecentTransactionRecords(updatedTransactions, getRecentLogLimit_(spreadsheet, sheetNames))
    };
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
    var existingRows = readSheetObjectsWithRowNumbers_(transactionsSheet, TRANSACTION_HEADERS);
    var existingTransactions = existingRows.map(function (row) {
      return row.record;
    });
    var targetRow = existingRows.find(function (row) {
      return row.record["Transaction ID"] === transactionId;
    });
    var result = updateQuickLogTransaction(transactionId, input || {}, existingTransactions, {
      now: new Date().toISOString()
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
    SpreadsheetApp.flush();

    return {
      ok: true,
      message: "Transaction updated.",
      updatedAt: result.transaction["Updated At"],
      mode: mode,
      transaction: result.transaction,
      recentTransactions: getRecentTransactionRecords(
        replaceTransactionRecord_(existingTransactions, result.transaction),
        getRecentLogLimit_(spreadsheet, sheetNames)
      )
    };
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
    SpreadsheetApp.flush();

    return {
      ok: true,
      message: "Transaction deleted.",
      deletedAt: result.transaction["Deleted At"],
      mode: mode,
      transaction: result.transaction,
      recentTransactions: getRecentTransactionRecords(
        replaceTransactionRecord_(existingTransactions, result.transaction),
        getRecentLogLimit_(spreadsheet, sheetNames)
      )
    };
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
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createQuickLogError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    var realTransactions = spreadsheet.getSheetByName(FINANCE_SHEETS.TRANSACTIONS);
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

    return {
      ok: true,
      mode: "mock",
      message: "Mock Quick Log smoke test passed. Real Transactions was not edited.",
      checkedAt: new Date().toISOString(),
      spreadsheet: getSpreadsheetSummary_(spreadsheet),
      transactionId: transactionId,
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
      finalTransaction: deleteResult.transaction
    };
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

    return {
      ok: true,
      checkedAt: new Date().toISOString(),
      mode: mode,
      transactions: getRecentTransactionRecords(transactions, limit || getRecentLogLimit_(spreadsheet, sheetNames))
    };
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

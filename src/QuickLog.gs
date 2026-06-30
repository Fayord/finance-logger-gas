/**
 * Quick Log backend functions for Apps Script HTML service calls.
 */
function getQuickLogBootstrap() {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createQuickLogError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    ensureQuickLogSheets_(spreadsheet);

    var workbookData = readQuickLogWorkbookData_(spreadsheet);
    var bootstrap = buildQuickLogBootstrapData(workbookData);

    bootstrap.checkedAt = new Date().toISOString();
    bootstrap.spreadsheet = getSpreadsheetSummary_(spreadsheet);

    return bootstrap;
  } catch (error) {
    return createQuickLogError_(error && error.message ? error.message : String(error));
  }
}

function createTransaction(input) {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createQuickLogError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    ensureQuickLogSheets_(spreadsheet);

    var transactionsSheet = spreadsheet.getSheetByName(FINANCE_SHEETS.TRANSACTIONS);
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
      transaction: result.transaction,
      recentTransactions: getRecentTransactionRecords(updatedTransactions, getRecentLogLimit_(spreadsheet))
    };
  } catch (error) {
    return createQuickLogError_(error && error.message ? error.message : String(error));
  }
}

function getRecentTransactions(limit) {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createQuickLogError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    ensureQuickLogSheets_(spreadsheet);

    var transactions = readSheetObjects_(
      spreadsheet.getSheetByName(FINANCE_SHEETS.TRANSACTIONS),
      TRANSACTION_HEADERS
    );

    return {
      ok: true,
      checkedAt: new Date().toISOString(),
      transactions: getRecentTransactionRecords(transactions, limit || getRecentLogLimit_(spreadsheet))
    };
  } catch (error) {
    return createQuickLogError_(error && error.message ? error.message : String(error));
  }
}

function readQuickLogWorkbookData_(spreadsheet) {
  return {
    transactions: readSheetObjects_(spreadsheet.getSheetByName(FINANCE_SHEETS.TRANSACTIONS), TRANSACTION_HEADERS),
    accounts: readSheetObjects_(spreadsheet.getSheetByName(FINANCE_SHEETS.ACCOUNTS), ACCOUNT_HEADERS),
    expenseCategories: readSheetObjects_(
      spreadsheet.getSheetByName(FINANCE_SHEETS.EXPENSE_CATEGORIES),
      CATEGORY_HEADERS
    ),
    incomeCategories: readSheetObjects_(
      spreadsheet.getSheetByName(FINANCE_SHEETS.INCOME_CATEGORIES),
      INCOME_CATEGORY_HEADERS
    ),
    transferCategories: readSheetObjects_(
      spreadsheet.getSheetByName(FINANCE_SHEETS.TRANSFER_CATEGORIES),
      TRANSFER_CATEGORY_HEADERS
    ),
    presets: readSheetObjects_(spreadsheet.getSheetByName(FINANCE_SHEETS.PRESETS), PRESET_HEADERS),
    settings: readSheetObjects_(spreadsheet.getSheetByName(FINANCE_SHEETS.SETTINGS), SETTING_HEADERS)
  };
}

function readSheetObjects_(sheet, headers) {
  if (!sheet) {
    return [];
  }

  var lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  var rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();

  return sheetRowsToObjects(rows, headers).filter(function (row) {
    return Object.keys(row).some(function (key) {
      return row[key] !== "";
    });
  });
}

function ensureQuickLogSheets_(spreadsheet) {
  var missingSheets = [
    FINANCE_SHEETS.TRANSACTIONS,
    FINANCE_SHEETS.ACCOUNTS,
    FINANCE_SHEETS.EXPENSE_CATEGORIES,
    FINANCE_SHEETS.INCOME_CATEGORIES,
    FINANCE_SHEETS.TRANSFER_CATEGORIES,
    FINANCE_SHEETS.PRESETS,
    FINANCE_SHEETS.SETTINGS
  ].filter(function (sheetName) {
    return !spreadsheet.getSheetByName(sheetName);
  });

  if (missingSheets.length > 0) {
    throw new Error("Missing required Quick Log sheets. Run setupWorkbook() first: " + missingSheets.join(", "));
  }
}

function getRecentLogLimit_(spreadsheet) {
  var settings = readSheetObjects_(spreadsheet.getSheetByName(FINANCE_SHEETS.SETTINGS), SETTING_HEADERS);
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

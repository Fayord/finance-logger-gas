/**
 * Returns a read-only connection report for the Google Sheet.
 *
 * This is the first real GAS smoke test: it proves the deployed web app can
 * read workbook metadata before we wire transaction writes.
 *
 * @return {Object}
 */
function getConnectionStatus() {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return {
        ok: false,
        message:
          "No spreadsheet found. Bind this Apps Script project to the Google Sheet, or set Script Property FINANCE_LOGGER_SHEET_ID.",
        checkedAt: new Date().toISOString(),
        spreadsheet: null,
        expectedSheets: getExpectedSheetNames_(),
        foundSheets: [],
        missingSheets: getExpectedSheetNames_()
      };
    }

    var foundSheets = spreadsheet.getSheets().map(function (sheet) {
      return sheet.getName();
    });
    var expectedSheets = getExpectedSheetNames_();
    var missingSheets = expectedSheets.filter(function (sheetName) {
      return foundSheets.indexOf(sheetName) === -1;
    });

    return {
      ok: missingSheets.length === 0,
      message:
        missingSheets.length === 0
          ? "Connected to the bound Google Sheet and all expected tabs exist."
          : "Connected to the bound Google Sheet, but some expected tabs are missing.",
      checkedAt: new Date().toISOString(),
      spreadsheet: {
        id: spreadsheet.getId(),
        name: spreadsheet.getName(),
        url: spreadsheet.getUrl()
      },
      expectedSheets: expectedSheets,
      foundSheets: foundSheets,
      missingSheets: missingSheets
    };
  } catch (error) {
    return {
      ok: false,
      message: error && error.message ? error.message : String(error),
      checkedAt: new Date().toISOString(),
      spreadsheet: null,
      expectedSheets: getExpectedSheetNames_(),
      foundSheets: [],
      missingSheets: getExpectedSheetNames_()
    };
  }
}

function getFinanceSpreadsheet_() {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  if (activeSpreadsheet) {
    return activeSpreadsheet;
  }

  var configuredSheetId = PropertiesService.getScriptProperties().getProperty(
    "FINANCE_LOGGER_SHEET_ID"
  );

  if (!configuredSheetId) {
    return null;
  }

  return SpreadsheetApp.openById(configuredSheetId);
}

function getExpectedSheetNames_() {
  return [
    FINANCE_SHEETS.TRANSACTIONS,
    FINANCE_SHEETS.EXPENSES_VIEW,
    FINANCE_SHEETS.INCOME_VIEW,
    FINANCE_SHEETS.TRANSFERS_VIEW,
    FINANCE_SHEETS.ACCOUNTS,
    FINANCE_SHEETS.BALANCES,
    FINANCE_SHEETS.EXPENSE_CATEGORIES,
    FINANCE_SHEETS.INCOME_CATEGORIES,
    FINANCE_SHEETS.TRANSFER_CATEGORIES,
    FINANCE_SHEETS.PRESETS,
    FINANCE_SHEETS.SETTINGS
  ];
}

/**
 * Applies dropdown validation to user-editable workbook columns.
 */
function applyWorkbookValidations() {
  return applyWorkbookValidationsForSheets_(FINANCE_SHEETS, "real");
}

function applyMockWorkbookValidations() {
  return applyWorkbookValidationsForSheets_(MOCK_FINANCE_SHEETS, "mock");
}

function applyWorkbookValidationsForSheets_(sheetNames, mode) {
  var spreadsheet = getFinanceSpreadsheet_();

  if (!spreadsheet) {
    return {
      ok: false,
      mode: mode,
      message: "No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.",
      validations: []
    };
  }

  return {
    ok: true,
    mode: mode,
    message: "Workbook dropdown validations applied.",
    validations: applyWorkbookValidationsToSpreadsheet_(spreadsheet, sheetNames)
  };
}

function applyWorkbookValidationsToSpreadsheet_(spreadsheet, sheetNames) {
  if (!SpreadsheetApp.newDataValidation) {
    return [];
  }

  var transactionsSheet = spreadsheet.getSheetByName(sheetNames.TRANSACTIONS);
  var accountsSheet = spreadsheet.getSheetByName(sheetNames.ACCOUNTS);
  var presetsSheet = spreadsheet.getSheetByName(sheetNames.PRESETS);

  if (!transactionsSheet) {
    return [];
  }

  var categoryValues = getTransactionCategoryValidationValues_(spreadsheet, sheetNames);
  var accountValues = readValidationColumnValues_(accountsSheet, 1);
  var presetValues = readValidationColumnValues_(presetsSheet, 2);
  var applied = [];

  applied = applied.concat([
    setColumnListValidation_(transactionsSheet, 5, Object.values(TRANSACTION_TYPES), "Type"),
    setColumnListValidation_(transactionsSheet, 7, categoryValues.tier1, "Tier 1"),
    setColumnListValidation_(transactionsSheet, 8, categoryValues.tier2, "Tier 2"),
    setColumnListValidation_(transactionsSheet, 9, accountValues, "Account"),
    setColumnListValidation_(transactionsSheet, 10, accountValues, "From Account"),
    setColumnListValidation_(transactionsSheet, 11, accountValues, "To Account"),
    setColumnListValidation_(transactionsSheet, 12, ["Yes", "No", "Check"], "Taxable?"),
    setColumnListValidation_(transactionsSheet, 13, ["Yes", "No", "Check"], "Tax Deduction Status"),
    setColumnListValidation_(transactionsSheet, 16, presetValues, "Preset Used"),
    setColumnListValidation_(transactionsSheet, 17, ["TRUE", "FALSE"], "Deleted?")
  ]);

  return applied.filter(Boolean);
}

function getTransactionCategoryValidationValues_(spreadsheet, sheetNames) {
  var expenseCategoriesSheet = spreadsheet.getSheetByName(sheetNames.EXPENSE_CATEGORIES);
  var incomeCategoriesSheet = spreadsheet.getSheetByName(sheetNames.INCOME_CATEGORIES);
  var transferCategoriesSheet = spreadsheet.getSheetByName(sheetNames.TRANSFER_CATEGORIES);

  return {
    tier1: uniqueValidationValues_(
      readValidationColumnValues_(expenseCategoriesSheet, 1)
        .concat(readValidationColumnValues_(incomeCategoriesSheet, 1))
        .concat(readValidationColumnValues_(transferCategoriesSheet, 1))
    ),
    tier2: uniqueValidationValues_(readValidationColumnValues_(expenseCategoriesSheet, 2))
  };
}

function readValidationColumnValues_(sheet, column) {
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  return sheet
    .getRange(2, column, sheet.getLastRow() - 1, 1)
    .getValues()
    .map(function (row) {
      return row[0];
    })
    .filter(Boolean);
}

function uniqueValidationValues_(values) {
  return Array.from(
    values.reduce(function (lookup, value) {
      lookup.set(String(value), value);
      return lookup;
    }, new Map()).values()
  );
}

function setColumnListValidation_(sheet, column, values, label) {
  var listValues = uniqueValidationValues_(values);

  if (listValues.length === 0) {
    return null;
  }

  var rowCount = getValidationRowCount_(sheet);
  var range = sheet.getRange(2, column, rowCount, 1);

  if (!range.setDataValidation) {
    return null;
  }

  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(listValues, true)
    .setAllowInvalid(false)
    .build();

  range.setDataValidation(rule);

  return {
    sheet: sheet.getName(),
    column: column,
    label: label,
    values: listValues.length,
    rows: rowCount
  };
}

function getValidationRowCount_(sheet) {
  if (sheet.getMaxRows) {
    return Math.max(sheet.getMaxRows() - 1, 1);
  }

  return 999;
}

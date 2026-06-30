/**
 * Creates missing real app tabs and seeds empty reference tabs safely.
 *
 * Existing real data rows are not cleared or overwritten.
 *
 * @return {Object}
 */
function setupWorkbook() {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createWorkbookSetupError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    var plan = buildWorkbookSetupPlan();
    var createdSheets = [];
    var updatedSheets = [];
    var skippedSheets = [];

    plan.sheets.forEach(function (plannedSheet) {
      assertRealSheetName_(plannedSheet.name);

      var sheet = spreadsheet.getSheetByName(plannedSheet.name);
      var created = false;

      if (!sheet) {
        sheet = spreadsheet.insertSheet(plannedSheet.name);
        created = true;
        createdSheets.push(plannedSheet.name);
      }

      var result = applySetupSheet_(sheet, plannedSheet, created);

      if (!created && result.updated) {
        updatedSheets.push(plannedSheet.name);
      }

      if (!created && result.skipped) {
        skippedSheets.push(plannedSheet.name);
      }
    });

    SpreadsheetApp.flush();

    return {
      ok: true,
      message: "Workbook setup complete. Existing real data rows were not cleared.",
      setupAt: new Date().toISOString(),
      spreadsheet: getSpreadsheetSummary_(spreadsheet),
      createdSheets: createdSheets,
      updatedSheets: updatedSheets,
      skippedSheets: skippedSheets,
      sheets: getWorkbookSetupStatusFromSpreadsheet_(spreadsheet)
    };
  } catch (error) {
    return createWorkbookSetupError_(error && error.message ? error.message : String(error));
  }
}

/**
 * Returns status for real app tabs without modifying the workbook.
 *
 * @return {Object}
 */
function getWorkbookSetupStatus() {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createWorkbookSetupError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    var sheets = getWorkbookSetupStatusFromSpreadsheet_(spreadsheet);
    var missingSheets = sheets
      .filter(function (sheetStatus) {
        return !sheetStatus.exists;
      })
      .map(function (sheetStatus) {
        return sheetStatus.name;
      });

    return {
      ok: missingSheets.length === 0,
      message:
        missingSheets.length === 0
          ? "All expected real app tabs exist."
          : "Some expected real app tabs are missing.",
      checkedAt: new Date().toISOString(),
      spreadsheet: getSpreadsheetSummary_(spreadsheet),
      missingSheets: missingSheets,
      sheets: sheets
    };
  } catch (error) {
    return createWorkbookSetupError_(error && error.message ? error.message : String(error));
  }
}

function applySetupSheet_(sheet, plannedSheet, created) {
  var hasExistingRows = sheet.getLastRow() > 0;
  var shouldSeedRows = created || !hasExistingRows;

  if (plannedSheet.mode === "formula-view") {
    writeSetupFormulaView_(sheet, plannedSheet);
    return { updated: true, skipped: false };
  }

  if (!hasExistingRows) {
    writeSetupHeaders_(sheet, plannedSheet.headers);
  } else {
    ensureSetupHeaders_(sheet, plannedSheet.headers);
  }

  if (plannedSheet.rows.length > 0 && shouldSeedRows) {
    sheet.getRange(2, 1, plannedSheet.rows.length, plannedSheet.headers.length).setValues(plannedSheet.rows);
    styleSetupSheet_(sheet, plannedSheet.headers.length, plannedSheet.rows.length + 1);
    return { updated: true, skipped: false };
  }

  styleSetupSheet_(sheet, plannedSheet.headers.length, Math.max(sheet.getLastRow(), 1));

  return {
    updated: !hasExistingRows,
    skipped: hasExistingRows && plannedSheet.rows.length > 0
  };
}

function writeSetupFormulaView_(sheet, plannedSheet) {
  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }

  sheet.clear();
  writeSetupHeaders_(sheet, plannedSheet.headers);
  sheet.getRange(2, 1).setFormula(plannedSheet.formula);
  styleSetupSheet_(sheet, plannedSheet.headers.length, 2);
}

function writeSetupHeaders_(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
}

function ensureSetupHeaders_(sheet, headers) {
  var existingHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var hasDifferentHeader = headers.some(function (header, index) {
    return existingHeaders[index] !== header;
  });

  if (!hasDifferentHeader) {
    return;
  }

  var hasOnlyBlankHeader = existingHeaders.every(function (value) {
    return value === "";
  });

  if (hasOnlyBlankHeader) {
    writeSetupHeaders_(sheet, headers);
  }
}

function styleSetupSheet_(sheet, columnCount, rowCount) {
  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }

  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, columnCount).setFontWeight("bold");
  sheet.autoResizeColumns(1, columnCount);

  if (rowCount > 1) {
    sheet.getRange(1, 1, rowCount, columnCount).createFilter();
  }
}

function getWorkbookSetupStatusFromSpreadsheet_(spreadsheet) {
  return buildWorkbookSetupPlan().sheets.map(function (plannedSheet) {
    var sheet = spreadsheet.getSheetByName(plannedSheet.name);
    var formula = "";

    if (sheet && plannedSheet.formula) {
      formula = sheet.getRange(2, 1).getFormula();
    }

    return {
      name: plannedSheet.name,
      exists: Boolean(sheet),
      kind: plannedSheet.kind,
      plannedRows: plannedSheet.rows.length,
      actualRows: sheet ? Math.max(sheet.getLastRow() - 1, 0) : 0,
      plannedColumns: plannedSheet.headers.length,
      actualColumns: sheet ? sheet.getLastColumn() : 0,
      formula: formula
    };
  });
}

function assertRealSheetName_(sheetName) {
  if (String(sheetName).indexOf(MOCK_SHEET_PREFIX) === 0) {
    throw new Error("Refusing to setup mock sheet as real app sheet: " + sheetName);
  }

  if (getExpectedSheetNames_().indexOf(sheetName) === -1) {
    throw new Error("Refusing to setup unknown real app sheet: " + sheetName);
  }
}

function getSpreadsheetSummary_(spreadsheet) {
  return {
    id: spreadsheet.getId(),
    name: spreadsheet.getName(),
    url: spreadsheet.getUrl()
  };
}

function createWorkbookSetupError_(message) {
  return {
    ok: false,
    message: message,
    checkedAt: new Date().toISOString(),
    sheets: []
  };
}

/**
 * Rebuilds only Mock_ tabs in the configured finance spreadsheet.
 *
 * @return {Object}
 */
function seedMockWorkbook() {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createMockSeederError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    var workbook = buildMockWorkbook();
    var createdSheets = [];
    var updatedSheets = [];

    workbook.sheets.forEach(function (plannedSheet) {
      assertMockSheetName_(plannedSheet.name);

      var sheet = spreadsheet.getSheetByName(plannedSheet.name);

      if (!sheet) {
        sheet = spreadsheet.insertSheet(plannedSheet.name);
        createdSheets.push(plannedSheet.name);
      } else {
        updatedSheets.push(plannedSheet.name);
      }

      writeMockSheet_(sheet, plannedSheet);
    });

    SpreadsheetApp.flush();

    return {
      ok: true,
      message: "Mock workbook seeded. Only Mock_ tabs were created or updated.",
      seededAt: new Date().toISOString(),
      spreadsheet: {
        id: spreadsheet.getId(),
        name: spreadsheet.getName(),
        url: spreadsheet.getUrl()
      },
      createdSheets: createdSheets,
      updatedSheets: updatedSheets,
      sheets: getMockWorkbookStatusFromSpreadsheet_(spreadsheet)
    };
  } catch (error) {
    return createMockSeederError_(error && error.message ? error.message : String(error));
  }
}

/**
 * Returns status for the expected Mock_ tabs without modifying the workbook.
 *
 * @return {Object}
 */
function getMockWorkbookStatus() {
  try {
    var spreadsheet = getFinanceSpreadsheet_();

    if (!spreadsheet) {
      return createMockSeederError_("No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.");
    }

    var sheets = getMockWorkbookStatusFromSpreadsheet_(spreadsheet);
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
          ? "All expected Mock_ tabs exist."
          : "Some expected Mock_ tabs are missing.",
      checkedAt: new Date().toISOString(),
      spreadsheet: {
        id: spreadsheet.getId(),
        name: spreadsheet.getName(),
        url: spreadsheet.getUrl()
      },
      missingSheets: missingSheets,
      sheets: sheets
    };
  } catch (error) {
    return createMockSeederError_(error && error.message ? error.message : String(error));
  }
}

/**
 * Returns a compact review report for the planned mock workbook and current Mock_ tab status.
 *
 * @return {Object}
 */
function getMockReviewReport() {
  try {
    var spreadsheet = getFinanceSpreadsheet_();
    var report = buildMockWorkbookReviewReport();

    if (!spreadsheet) {
      return Object.assign({}, report, {
        ok: false,
        message: "No spreadsheet found. Set Script Property FINANCE_LOGGER_SHEET_ID.",
        checkedAt: new Date().toISOString(),
        sheets: []
      });
    }

    var sheets = getMockWorkbookStatusFromSpreadsheet_(spreadsheet);
    var missingSheets = sheets
      .filter(function (sheetStatus) {
        return !sheetStatus.exists;
      })
      .map(function (sheetStatus) {
        return sheetStatus.name;
      });

    return Object.assign({}, report, {
      ok: missingSheets.length === 0,
      message:
        missingSheets.length === 0
          ? "Mock workbook review report is ready."
          : "Seed mock workbook before reviewing live Mock_ tabs.",
      checkedAt: new Date().toISOString(),
      spreadsheet: getSpreadsheetSummary_(spreadsheet),
      missingSheets: missingSheets,
      liveSheets: sheets
    });
  } catch (error) {
    return createMockSeederError_(error && error.message ? error.message : String(error));
  }
}

function writeMockSheet_(sheet, plannedSheet) {
  var headers = plannedSheet.headers;
  var rowCount = plannedSheet.rows.length + 1;
  var columnCount = headers.length;

  if (sheet.getFilter()) {
    sheet.getFilter().remove();
  }

  sheet.clear();
  sheet.getRange(1, 1, 1, columnCount).setValues([headers]);
  sheet.setFrozenRows(1);

  if (plannedSheet.rows.length > 0) {
    sheet.getRange(2, 1, plannedSheet.rows.length, columnCount).setValues(plannedSheet.rows);
  }

  if (plannedSheet.formula) {
    sheet.getRange(2, 1).setFormula(plannedSheet.formula);
  }

  sheet.getRange(1, 1, 1, columnCount).setFontWeight("bold");
  sheet.autoResizeColumns(1, columnCount);

  if (rowCount > 1 && columnCount > 0) {
    sheet.getRange(1, 1, rowCount, columnCount).createFilter();
  }
}

function getMockWorkbookStatusFromSpreadsheet_(spreadsheet) {
  return buildMockWorkbook().sheets.map(function (plannedSheet) {
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

function assertMockSheetName_(sheetName) {
  if (String(sheetName).indexOf(MOCK_SHEET_PREFIX) !== 0) {
    throw new Error("Refusing to seed non-mock sheet: " + sheetName);
  }
}

function createMockSeederError_(message) {
  return {
    ok: false,
    message: message,
    checkedAt: new Date().toISOString(),
    sheets: []
  };
}

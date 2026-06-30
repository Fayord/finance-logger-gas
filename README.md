# finance-logger-gas
Mobile-first Google Sheets + Google Apps Script finance logger for expenses, income, and transfers.

## Stack

- Google Sheets as the finance data source of truth
- Google Apps Script V8 for backend logic and HTML service
- `@google/clasp` for syncing local `src/` files to Apps Script
- ESLint + Prettier for local code quality
- `@types/google-apps-script` for Apps Script API type hints

## Folder Structure

```text
src/
  appsscript.json   Apps Script manifest
  Code.gs           Web app entry point and shared Apps Script helpers
  Index.html        HTML service entry page
docs/
  sheet-schema.md                         Google Sheets tab and column schema
  specs/
    personal-finance-logging-web-app.md   Main product specification
  reference/
    expense-categories-2-tier.md          Baseline expense category taxonomy
    google-sheets-apps-script-clasp-stack.md
                                           Local Apps Script + clasp workflow notes
  prototypes/
    quick-log-mockup.html                 Standalone Quick Log UI prototype
.github/workflows/
  ci.yml            GitHub Actions lint check
```

Local-only files such as `.clasp.json`, `.clasprc.json`, `.env*`, `node_modules/`, and `.npm-cache/` are ignored by Git.

## Setup

```bash
npm ci
npm run check
```

`npm run check` runs ESLint and local Node tests against mock workbook data, so core transaction logic can be verified before pushing to the real Apps Script project.

Create a real `.clasp.json` locally from `.clasp.example.json` after you have an Apps Script project ID. Do not commit the real `.clasp.json` unless the project owner explicitly chooses that workflow.

## First GAS Connection Test

The scaffold includes a read-only `getConnectionStatus()` smoke test. After pushing to a bound Apps Script project, open the web app and click `Check connection` to verify:

- the app can read the bound Google Sheet
- the expected tabs exist
- which tabs are missing before full implementation begins

If the Apps Script project is bound to the Google Sheet, no Sheet URL is needed in code. If the Apps Script project is standalone, add this Script Property in Apps Script project settings:

```text
FINANCE_LOGGER_SHEET_ID=<your Google Sheet ID>
```

The real `.clasp.json` is local-only and ignored by Git.

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
  sheet-schema.md   Google Sheets tab and column schema
.github/workflows/
  ci.yml            GitHub Actions lint check
```

Local-only files such as `.clasp.json`, `.clasprc.json`, `.env*`, `node_modules/`, and `.npm-cache/` are ignored by Git.

## Setup

```bash
npm ci
npm run check
```

Create a real `.clasp.json` locally from `.clasp.example.json` after you have an Apps Script project ID. Do not commit the real `.clasp.json` unless the project owner explicitly chooses that workflow.

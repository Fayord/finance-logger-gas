# Implementation Overview

This file is the project status map: what has been built, why it exists, what comes next, and what input is needed from the owner.

## Current Goal

Build a mobile-first personal finance logger where:

- Google Sheets is the data source of truth.
- Google Apps Script is the backend and web app host.
- The first real product experience is a fast Quick Log page for expense, income, and transfer entries.
- Local tests protect the core behavior before code is pushed to the real Apps Script project.

The selected workbook design is Approach 1:

- One real source-of-truth `Transactions` sheet.
- `Expenses_View`, `Income_View`, and `Transfers_View` are formula/filter views generated from `Transactions`.
- No separate source tables for expense, income, or transfer transactions.

## What Is Done

### Project Scaffold

- Added Node/clasp tooling with `package.json`.
- Added local quality commands:
  - `npm run lint`
  - `npm test`
  - `npm run check`
- Added Apps Script source under `src/`.
- Added `.clasp.example.json`.
- Kept local `.clasp.json`, credentials, environment files, and dependencies out of Git.

### Documentation And Repo Structure

- Organized product docs under `docs/`.
- Added `docs/sheet-schema.md` for the workbook shape.
- Moved the standalone UI prototype to `docs/prototypes/quick-log-mockup.html`.
- Added project agent guidance in `AGENTS.md`.
- Added project-level `impeccable` skill under `.agents/skills/impeccable`.

### Local Transaction Logic

- Added schema constants for transactions, accounts, balances, categories, presets, settings, and mock tabs.
- Added local pure transaction helpers for:
  - normalizing transaction input
  - validating transactions
  - building type-filtered views
  - calculating balances from opening balances plus active transactions
- Added local tests and mock workbook fixtures.

### GAS Connection Smoke Test

- Added a web app page with a `Check connection` button.
- Added server-side `getConnectionStatus()`.
- It verifies that Apps Script can resolve the spreadsheet and report expected/missing sheets.

### Mock Workbook Seeder

- Added a safe mock-data seeder that writes only `Mock_...` tabs.
- Public GAS functions:
  - `seedMockWorkbook()`
  - `getMockWorkbookStatus()`
- Mock tabs include:
  - `Mock_Transactions`
  - `Mock_Expenses_View`
  - `Mock_Income_View`
  - `Mock_Transfers_View`
  - `Mock_Accounts`
  - `Mock_Balances`
  - `Mock_Expense_Categories`
  - `Mock_Income_Categories`
  - `Mock_Transfer_Categories`
  - `Mock_Presets`
  - `Mock_Settings`
- Real tabs like `Transactions`, `Accounts`, and `Settings` are never edited by the mock seeder.
- Added UI buttons:
  - `Seed mock workbook`
  - `Check mock workbook`
- Added tests for the mock workbook plan and Apps Script-style adapter behavior.

### Safe Real Workbook Setup

- Added safe real workbook setup functions:
  - `setupWorkbook()`
  - `getWorkbookSetupStatus()`
- Added UI buttons:
  - `Setup real workbook`
  - `Check real workbook`
- Setup behavior:
  - creates missing real tabs
  - writes/ensures headers
  - builds formula views from `Transactions`
  - seeds categories/settings only when those sheets are empty
  - does not clear existing real transaction rows
  - refuses mock or unknown sheet names
- Added local tests for safe setup behavior.

### Quick Log Backend

- Added pure Quick Log helpers for local testing.
- Added GAS backend functions:
  - `getQuickLogBootstrap()`
  - `createTransaction(input)`
  - `updateTransaction(transactionId, input)`
  - `softDeleteTransaction(transactionId)`
  - `getRecentTransactions(limit)`
- `getQuickLogBootstrap()` reads active accounts, categories, presets, settings, and recent transactions.
- `createTransaction(input)` validates by transaction type, normalizes amount as positive, creates a unique ID, and appends only to the real `Transactions` sheet.
- `updateTransaction(transactionId, input)` validates edits, preserves the original ID and created timestamp, and updates the matching real row.
- `softDeleteTransaction(transactionId)` marks `Deleted?` and `Deleted At` without removing the row.
- `getRecentTransactions(limit)` returns recent non-deleted rows only.
- Added a read-only UI button:
  - `Check quick log bootstrap`
- Added local tests for Quick Log bootstrap, transaction create/edit/delete, validation, append/update behavior, and hidden soft-deleted rows.

### Mobile Quick Log UI

- Replaced the temporary JSON-control page with a mobile-first Quick Log interface in Apps Script HTML service.
- Added Expense / Income / Transfer switching with dynamic fields.
- Added preset chips, recent logs, edit mode, soft delete confirmation, and reload controls.
- Added a `Real` / `Mock` mode switch:
  - real mode writes to `Transactions`
  - mock mode writes only to `Mock_Transactions`
  - mock mode lets create/edit/delete be tested before real accounts and presets are configured
- Added a `Run mock smoke test` workbook tool that seeds mock tabs, creates a mock transaction, edits it, soft-deletes it, and verifies the real `Transactions` row count did not change.
- Kept workbook setup/mock/diagnostic controls in a secondary `Workbook tools` panel.
- Added `PRODUCT.md` so future UI work has a stable product-register design context.

### Apps Script Sync

- Source has been pushed to the configured Apps Script project with `npm run gas:push:force`.
- The current web app/dev deployment can run the connection, mock seeder, and real setup functions.

## Current Git State

Current working convention:

- Local branch: `main`
- The local branch may be ahead of `origin/main` after each completed feature unit.
- Use `git status --short --branch` to confirm whether GitHub has the latest local commits.
- Commit after each complete verified unit.

Action needed eventually:

- Push Git when ready so GitHub also has the latest verified local commits.

## What Needs To Happen Next

### Phase 1: Quick Log Backend

Status: implemented for create/list/bootstrap.

Implemented functions:

- `getQuickLogBootstrap()`
  - reads active accounts, categories, presets, settings, and recent transactions
  - returns everything the Quick Log UI needs to render
- `createTransaction(input)`
  - validates required fields by transaction type
  - normalizes amount as positive
  - creates a unique transaction ID
  - appends to real `Transactions`
  - returns the created transaction and updated recent list
- `getRecentTransactions(limit)`
  - returns recent non-deleted transactions

Local tests cover:

- expense creation
- income creation
- transfer creation
- transaction validation by type
- missing required fields
- positive amount normalization
- deleted rows hidden from recent list
- no writes to generated view sheets

### Phase 2: Edit And Soft Delete Backend

Status: implemented.

Implemented functions:

- `updateTransaction(transactionId, input)`
- `softDeleteTransaction(transactionId)`

Local tests cover:

- updating an existing row by transaction ID
- preserving `Transaction ID` and `Created At` during edits
- refusing updates to missing IDs
- refusing invalid edits
- soft delete sets `Deleted? = TRUE` and `Deleted At`
- deleted transactions stay in the sheet but disappear from normal recent logs

### Phase 3: Quick Log UI In Apps Script

Status: first functional UI implemented with real and mock modes.

Implemented UI:

- Expense / Income / Transfer switcher
- dynamic fields per type
- account picker
- category picker
- preset buttons
- submit transaction
- recent 10-20 logs
- edit recent log
- delete recent log with confirmation
- real/mock mode switch
- mock-mode create/edit/delete against `Mock_Transactions`
- one-click mock Quick Log smoke test

Remaining Phase 3 polish:

- Browser-test the Apps Script `/dev` deployment on mobile and desktop widths.
- Seed mock workbook, switch the UI to `Mock`, then test create/edit/delete without touching real tabs.
- Improve empty states once real accounts/presets are configured.
- Tighten account/category picker ergonomics after real config is available.
- Add clearer loading skeletons if the GAS calls feel slow.

### Phase 4: Real Configuration

After the Quick Log flow works with safe sample/default data, replace or refine the workbook setup with the owner’s real lists:

- real accounts
- real favorite accounts
- real income categories
- real transfer categories
- real preset shortcuts
- settings defaults

Do this only after the user reviews the mock workbook and agrees the shape is correct.

### Phase 5: Deployment And Owner Testing

Once the full Quick Log flow is implemented:

- run `npm run check`
- commit source
- push to Apps Script
- test via the Apps Script `/dev` URL first
- create or update a versioned Apps Script deployment only when the dev version is accepted
- push Git so repository source stays authoritative

## Current Blockers

There is no hard engineering blocker right now.

The main product dependency is review/approval:

- Confirm the mock workbook shape is complete enough.
- Confirm the mock Quick Log mode behaves correctly in the Apps Script web app.
- Confirm the real workbook tabs created by `setupWorkbook()` look acceptable.
- Confirm that Approach 1 remains the chosen data model.

The main operational dependency is access:

- Apps Script push requires local clasp authentication and permission to the target Apps Script project.
- The Google Sheet must be reachable by the Apps Script project, either because the script is bound to the sheet or because the `FINANCE_LOGGER_SHEET_ID` Script Property is set.

## What I Need From You Later

No real finance data is needed for the next backend implementation step.

For real configuration later, I will need:

- Account list:
  - display name
  - account type
  - opening balance
  - favorite or not
  - active or inactive
  - optional last 4 digits and notes
- Default accounts:
  - default expense account
  - default income account
  - default transfer from/to accounts
- Presets:
  - name
  - type
  - default amount if any
  - category
  - account/from/to account
  - memo
  - tax defaults if useful
- Category changes:
  - expense categories to add/remove/rename
  - income categories to add/remove/rename
  - transfer categories to add/remove/rename
- Settings preferences:
  - default timezone
  - recent log count
  - default tax values
  - whether to show inactive accounts in picker/search

Avoid sending sensitive tokens or OAuth credentials. Sheet IDs and Apps Script IDs should stay in local config or Script Properties unless you explicitly choose otherwise.

## What You Need To Test Now

If you want to review the current safe workbook pieces:

1. Open the Apps Script web app dev URL.
2. Click `Check connection`.
3. Click `Seed mock workbook`.
4. Review only the `Mock_...` tabs in the Google Sheet.
5. Click `Check mock workbook`.
6. Switch the Quick Log page to `Mock`.
7. Click `Run mock smoke test` for an automated mock create/edit/delete check.
8. Create a sample expense, income, and transfer manually in `Mock` mode.
9. Edit one mock recent log.
10. Delete one mock recent log and confirm it is soft-deleted.
11. Click `Setup real workbook` only when you are comfortable creating the real empty app tabs.
12. Click `Check real workbook`.

The mock seeder and mock Quick Log mode should never modify non-mock tabs.

## Recommended Next Action

Browser-test the Apps Script `/dev` deployment.

This is the best next step because the full Quick Log path can now be tested safely in `Mock` mode before you provide real accounts, presets, and settings.

# AGENTS.md

Guidance for Codex and other coding agents working in this repository.

## Project

This repo is for a mobile-first personal finance logger built with Google Sheets and Google Apps Script. The product goal is fast daily logging for:

- Expense: money spent
- Income: money received
- Transfer: money moved between the user's own accounts

Google Sheets is the source of truth. The web app is the input layer.

Current repo state: this repository contains the initial Apps Script/clasp scaffold, product docs, sheet schema notes, a project-level `impeccable` design skill, and a standalone HTML Quick Log prototype.

## Primary References

Read these before making product or architecture changes:

- `README.md`: short project summary
- `docs/specs/personal-finance-logging-web-app.md`: main product spec
- `docs/reference/expense-categories-2-tier.md`: expense category taxonomy
- `docs/reference/google-sheets-apps-script-clasp-stack.md`: recommended Apps Script + clasp + Git workflow
- `docs/prototypes/quick-log-mockup.html`: current visual/prototype reference

## Product Principles

- Optimize the first version for fast logging. A normal expense should take about 5-10 seconds.
- Keep the MVP focused on one excellent Quick Log page.
- Do not build insights, dashboards, charts, or tax calculation features until logging feels smooth.
- Store structured fields whenever possible. Use memo only for extra human notes.
- Treat tax fields as review flags, not as tax software.
- Keep transfers separate from spending. Paying a credit card and investing are transfers when the original spending or asset movement is logged elsewhere.

## MVP Scope

Must-have features:

- Expense / Income / Transfer switcher
- Dynamic form by transaction type
- Expense Tier 1 + Tier 2 categories
- Income Tier 1 only
- Transfer Tier 1 only
- Account picker with favorites
- `Taxable?` for income
- `Tax Deduction Status` for expense
- Preset catalog buttons
- Submit new transaction
- Recent 10-20 logs
- Edit recent log
- Delete recent log with confirmation
- Soft delete

Later features:

- Category insights
- Monthly dashboards
- Charts
- Sweet drinks, buffet, and Mom Care summaries
- Tax review page
- Full account balance dashboard
- Web-app settings management

## Data Rules

- Store all amounts as positive numbers. The transaction `Type` determines whether the amount is money out, money in, or money moved.
- Each transaction needs a unique `Transaction ID` for edit/delete operations.
- Prefer soft delete over hard delete:
  - `Deleted? = TRUE`
  - `Deleted At = timestamp`
- Hide deleted rows by default.
- Recent logs should show the last 10-20 non-deleted transactions.
- Income and expense tax fields use `Yes`, `No`, or `Check`, not booleans.

## Transaction Forms

Expense required fields:

- Date
- Amount
- Tier 1
- Tier 2
- Account

Expense optional fields:

- Tax Deduction Status
- Tax Note
- Memo

Income required fields:

- Date
- Amount
- Income Category / Tier 1
- Account Received

Income optional fields:

- Taxable?
- Tax Note
- Memo

Transfer required fields:

- Date
- Amount
- Transfer Category / Tier 1
- From Account
- To Account

Transfer optional fields:

- Memo

## Recommended Google Sheets Tabs

- `Transactions`
- `Expenses_View`
- `Income_View`
- `Transfers_View`
- `Balances`
- `Expense_Categories`
- `Income_Categories`
- `Transfer_Categories`
- `Accounts`
- `Presets`
- `Settings`

Use the sheet structure from `docs/specs/personal-finance-logging-web-app.md` unless the user explicitly changes it.

Transaction storage approach:

- Use one master `Transactions` sheet as the source of truth.
- `Expenses_View`, `Income_View`, and `Transfers_View` are generated formula/filter views only.
- Do not write independent transaction rows into type-specific sheets.
- Do not add an `All_Transactions` sheet unless the user changes the storage approach.

## Category Rules

- Expense categories use two tiers. Use `docs/reference/expense-categories-2-tier.md` as the baseline taxonomy.
- Income categories use one tier only.
- Transfer categories use one tier only.
- Do not force Tier 2 on income or transfers.

## Account Rules

The account picker should not be one large flat dropdown. Support:

- favorite accounts
- grouped account lists
- search
- active / inactive accounts
- short display names
- full account names

Account types from the spec:

- Cash
- Bank
- Wallet
- Credit Card
- Credit Line
- Investment
- Other

## Preset Rules

- Presets are shortcuts that prefill some or all transaction fields.
- A preset does not need to fill every required field.
- After selecting a preset, the user must still be able to edit any field before submitting.
- Presets should support type, amount, categories, accounts, tax defaults, memo, active status, and sort order.

## UI Guidance

- Build mobile-first.
- Keep the Quick Log page lightweight and focused.
- Use transaction type colors:
  - Expense: red
  - Income: green
  - Transfer: blue
- Use amber/yellow or gray for edit state. Edit mode is a state, not a transaction type.
- Delete actions should use a red danger style and require confirmation.
- Recent logs need edit and delete actions.
- Edit mode should refill the form, show an edit banner, change the submit text to `Save Changes`, and provide `Cancel Edit`.

## Technical Direction

Follow the clasp stack doc for local Apps Script workflow changes:

- Use Node.js 20+.
- Use `@google/clasp` for Apps Script sync.
- Prefer `src/` as the Apps Script root.
- Track `src/appsscript.json` and Apps Script source files in Git.
- Keep generated dependencies and secrets out of Git.
- Prefer plain `.gs` or `.js` for simple Apps Script automation unless the user asks for TypeScript.
- Use Script Properties for environment-specific IDs or secrets.
- Do not hardcode Sheet IDs, email addresses, tokens, or credentials.
- For HTML Service web apps, keep an explicit `webapp` block in `src/appsscript.json`.
  This prevents clasp redeploys from producing a deployment that is not openable as a web app.
  Current private default:

```json
"webapp": {
  "executeAs": "USER_DEPLOYING",
  "access": "MYSELF"
}
```

Change `access` only after the user explicitly chooses who should be able to open the app.

Current repo layout:

```text
src/
  appsscript.json
  Code.gs
  Menu.gs
  Sheets.gs
docs/
  sheet-schema.md
  specs/
    personal-finance-logging-web-app.md
  reference/
    expense-categories-2-tier.md
    google-sheets-apps-script-clasp-stack.md
  prototypes/
    quick-log-mockup.html
.clasp.example.json
.gitignore
eslint.config.mjs
jsconfig.json
package.json
README.md
```

## Security

Never commit:

- `node_modules/`
- `.clasprc.json`
- `.clasp.json`, unless the user explicitly decides this private repo should track it
- `.env`
- `.env.*`, except `.env.example`
- OAuth refresh credentials
- Google Sheet IDs in source code when Script Properties can be used

## Development Workflow

Expected checks and sync commands are:

- `npm run lint`
- `npm test`
- `npm run check`
- `npm run gas:pull` before local work when remote Apps Script may have changed
- `npm run gas:push` after local Apps Script changes are verified

Commit workflow:

- Commit frequently after each complete, verified unit of work.
- Run `npm run check` before each commit once the Node/clasp scaffold exists.
- Commit local source before and after GAS sync work when the sync changes source files, so Git remains the code source of truth.
- Do not leave verified source changes uncommitted when the user asks for implementation plus commit.

Apps Script web app deployment workflow:

- Confirm `src/appsscript.json` has the expected `webapp` block before creating or updating deployments.
- Run `npm run check` before `clasp push`, `clasp version`, or `clasp deploy`.
- Use `clasp deployments` to confirm which deployment ID is `@HEAD` and which ID is versioned.
- Do not assume every `/dev` URL is the current latest code. `/dev` is tied to a deployment ID; use the deployment ID reported as `@HEAD`.
- For `/exec`, create a new version from the pushed source, then redeploy the intended existing deployment ID to that version.
- After deployment, run `clasp deployments` again and report the exact deployment ID and version, for example `AKfy... @10`.
- If a web app URL says `Sorry, unable to open the file at this time`, check deployment type/access and the `webapp` manifest before changing UI code.
- If browser testing redirects to Google sign-in, do not treat that as proof the app page is broken; verify source/deployment with clasp and ask the user to test while signed into the owning Google account.

If Apps Script browser-editor changes happen, pull them back locally immediately and commit them.

Use pure helpers in `src/` plus mock workbook fixtures under `test/` for local verification. Keep SpreadsheetApp access behind thin adapters so business logic can be tested before pushing to the real Apps Script project.

Connection smoke test:

- `src/Connection.gs` exposes `getConnectionStatus()`.
- The first deployed GAS test should be read-only.
- Prefer a bound Apps Script project so `SpreadsheetApp.getActiveSpreadsheet()` works without storing a Sheet ID.
- If the project is standalone, use Script Property `FINANCE_LOGGER_SHEET_ID`; do not commit the real Sheet ID.

## Source Of Truth

Once initialized:

```text
Git repo -> Apps Script project -> Google Sheet runtime
```

Git should be the source of truth for code. Google Sheets remains the source of truth for transaction data.

## Open Questions For The User

Ask the user before locking in these choices:

- Should the project file be named `AGENTS.md` or `Agents.md`? `AGENTS.md` is the common agent-guide convention, but the user requested `Agents.md`.
- Should `.clasp.json` be committed for this repo, or should only `.clasp.example.json` be committed? The stack doc recommends the safer default of not committing the real `.clasp.json`.
- Should this project start with a dev/staging/prod setup, or is a single Google Sheet and Apps Script project enough for the first version?
- Should the initial implementation be plain Apps Script `.gs` / `.js`, or should TypeScript and a build step be introduced?
- Should `docs/prototypes/quick-log-mockup.html` remain only a prototype reference, or should its UI be migrated into the Apps Script HTML service as the starting point?

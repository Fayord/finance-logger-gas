# Google Sheets + Apps Script Git Stack with clasp

Last verified: 2026-06-30

This stack lets you develop Google Apps Script locally, keep the source in Git, and push/pull code between your repo and the Apps Script project attached to a Google Sheet.

## Key point

`clasp` tracks and syncs the Apps Script project: `.gs`, `.js`, `.html`, and `appsscript.json` files.

It does not version the live Google Sheet cells, formulas, formatting, or data by itself. For the Sheet itself, use one of these patterns:

1. Keep the Sheet as the runtime UI/data store and version only the Apps Script code in Git.
2. Keep Sheet schema in Git, such as tab names, headers, named ranges, validation rules, and seed data.
3. Export important tabs to CSV/JSON and commit those exports if the data also needs Git history.
4. Use separate dev/staging/prod Sheet copies when you need safe deployments.

For most Apps Script automations, option 1 plus a lightweight schema/config file is the cleanest setup.

---

## Recommended stack

| Layer | Tool | Purpose |
| --- | --- | --- |
| Source control | Git + GitHub/GitLab/Bitbucket | Main source of truth for code |
| Apps Script sync | `@google/clasp` | Pull/push Apps Script files between local repo and Google |
| Runtime target | Google Sheet + bound Apps Script project | Spreadsheet UI/data plus automation code |
| Local dev | VS Code or any editor | Edit code locally with Git history |
| Node tooling | Node.js 20+ and npm | Run clasp, lint, format, and CI |
| Type hints | `@types/google-apps-script` | Better autocomplete for Apps Script APIs |
| Quality | ESLint + Prettier | Catch mistakes before pushing |
| CI/CD | GitHub Actions | Lint/test on pull requests and optionally push to Apps Script on merge |
| Secrets/config | Script Properties + GitHub Secrets | Keep Sheet IDs, tokens, and credentials out of Git |

---

## Recommended repo layout

```text
my-sheet-automation/
  src/
    appsscript.json
    Code.gs
    Menu.gs
    Sheets.gs
  docs/
    sheet-schema.md
  .github/
    workflows/
      ci.yml
      push-to-apps-script.yml
  .clasp.example.json
  .gitignore
  eslint.config.mjs
  jsconfig.json
  package.json
  README.md
```

Use `src/` as the Apps Script root. This keeps `package.json`, `node_modules`, docs, and workflow files outside the files that clasp pushes to Apps Script.

---

## Prerequisites

1. Install Node.js 20 or newer.
2. Have Git installed.
3. Have access to the Google Sheet and its Apps Script project.
4. Enable the Apps Script API for your Google account:
   - Open `https://script.google.com/home/usersettings`
   - Turn on `Google Apps Script API`
5. Create a remote Git repo.

---

## Initial setup: existing Google Sheet

Use this when you already have a Google Sheet and Apps Script code attached to it.

### 1. Open the Apps Script project

In the Google Sheet:

```text
Extensions -> Apps Script
```

Then open:

```text
Project Settings -> IDs -> Script ID
```

Copy the Script ID.

### 2. Create the local repo

```bash
mkdir my-sheet-automation
cd my-sheet-automation
git init
npm init -y
npm install --save-dev @google/clasp @types/google-apps-script eslint globals prettier
mkdir src docs
```

### 3. Authenticate clasp

```bash
npx clasp login
```

This creates an OAuth credential file on your machine, usually `~/.clasprc.json`. Do not commit that file.

### 4. Clone the Apps Script project

For current clasp 3.x style:

```bash
npx clasp clone-script <SCRIPT_ID> --rootDir src
```

Common alias form, also supported in many setups:

```bash
npx clasp clone <SCRIPT_ID> --rootDir src
```

After cloning, you should have at least:

```text
.clasp.json
src/appsscript.json
src/*.gs
```

### 5. Create a safe example config

Create `.clasp.example.json`:

```json
{
  "scriptId": "PASTE_SCRIPT_ID_HERE",
  "rootDir": "src"
}
```

Keep your real `.clasp.json` local or in GitHub Secrets, especially if the repo is public or shared broadly.

---

## Initial setup: new Apps Script project bound to an existing Sheet

Use this when the Sheet exists but the Apps Script project is new.

Copy the Spreadsheet ID from the Sheet URL:

```text
https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
```

Then run:

```bash
mkdir my-sheet-automation
cd my-sheet-automation
git init
npm init -y
npm install --save-dev @google/clasp @types/google-apps-script eslint globals prettier
mkdir src docs
npx clasp login
npx clasp create-script --title "My Sheet Automation" --type sheets --parentId <SPREADSHEET_ID> --rootDir src
```

Common alias form:

```bash
npx clasp create "My Sheet Automation" --type sheets --parentId <SPREADSHEET_ID>
```

If the alias creates files in the repo root, move the Apps Script files into `src/` and set `.clasp.json` to:

```json
{
  "scriptId": "YOUR_SCRIPT_ID",
  "rootDir": "src"
}
```

---

## package.json scripts

Update `package.json` like this:

```json
{
  "name": "my-sheet-automation",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "gas:login": "clasp login",
    "gas:open": "clasp open-script",
    "gas:pull": "clasp pull",
    "gas:push": "clasp push",
    "gas:push:force": "clasp push --force",
    "gas:watch": "clasp push --watch",
    "gas:versions": "clasp versions",
    "gas:version": "clasp version",
    "lint": "eslint src --ext .js,.gs",
    "format": "prettier --write .",
    "check": "npm run lint"
  },
  "devDependencies": {
    "@google/clasp": "^3",
    "@types/google-apps-script": "latest",
    "eslint": "latest",
    "globals": "latest",
    "prettier": "latest"
  }
}
```

If npm generated exact versions during install, keep those exact versions instead of replacing them with `latest`.

---

## .gitignore

Create `.gitignore`:

```gitignore
node_modules/
npm-debug.log*
.DS_Store
.env
.env.*
!.env.example

# clasp/auth files
.clasprc.json
.clasp.json

# build output, if using a bundler later
dist/
build/
coverage/
```

Notes:

- Never commit `.clasprc.json`; it contains OAuth refresh credentials.
- For private single-developer repos, some teams commit `.clasp.json` because it only maps the repo to a Script ID. Safer default: do not commit it; commit `.clasp.example.json` instead.
- In CI, write `.clasp.json` from a GitHub Secret.

---

## ESLint config

Create `eslint.config.mjs`:

```js
import globals from "globals";

export default [
  {
    files: ["src/**/*.js", "src/**/*.gs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.es2021,
        SpreadsheetApp: "readonly",
        ScriptApp: "readonly",
        PropertiesService: "readonly",
        Logger: "readonly",
        HtmlService: "readonly",
        UrlFetchApp: "readonly",
        Utilities: "readonly",
        Session: "readonly",
        DriveApp: "readonly",
        GmailApp: "readonly",
        Browser: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-undef": "error"
    }
  }
];
```

Add more Apps Script globals as your project uses them.

---

## VS Code type hints

Create `jsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "checkJs": false,
    "types": ["google-apps-script"]
  },
  "include": ["src/**/*.js", "src/**/*.gs"]
}
```

---

## Apps Script manifest

Your `src/appsscript.json` should be tracked in Git. Example for a Sheet-bound script in Bangkok timezone:

```json
{
  "timeZone": "Asia/Bangkok",
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "MYSELF"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/script.container.ui"
  ]
}
```

Only add scopes you actually need. If your script opens other spreadsheets, uses Drive, calls external APIs, sends email, or manages triggers, you will need additional scopes.

For HTML Service web apps, keep the `webapp` block explicit. Without it, a clasp redeploy can leave you with a deployment that exists but is not openable as the web app URL you expect. Use `MYSELF` for private owner testing unless the user explicitly wants broader access.

### Web app deployment checklist

Use this checklist before changing `/dev` or `/exec` deployments:

1. Confirm `src/appsscript.json` includes the intended `webapp` config.
2. Run local checks.
3. Push source to Apps Script.
4. Create a new Apps Script version from the pushed source.
5. Redeploy the intended existing deployment ID to that version.
6. Run `clasp deployments` and record the exact deployment ID/version pair.
7. Test the correct URL while signed into an account that has access.

Important deployment details:

- A `/dev` URL is tied to a deployment ID. It is not enough to say "use `/dev`"; use the deployment ID that `clasp deployments` reports as `@HEAD`.
- A `/exec` URL serves a fixed version. After local changes, create a new version and redeploy the intended `/exec` deployment ID to that version.
- If the page says `Sorry, unable to open the file at this time`, check the deployment type, access setting, and `webapp` manifest before debugging UI code.
- If unauthenticated browser tooling is redirected to Google sign-in, verify source and deployment metadata with clasp, then ask the owner to test from the signed-in Google account.

---

## Daily development workflow

### Normal local edit cycle

```bash
git pull
npm ci
npm run gas:pull
# edit files in src/
npm run check
npm run gas:push
git status
git add src package.json package-lock.json eslint.config.mjs jsconfig.json docs .github .gitignore .clasp.example.json
git commit -m "Update sheet automation"
git push
```

### Faster live development

```bash
npm run gas:watch
```

This pushes changes as you edit. Use it only while actively developing.

### When you edit in the Apps Script browser editor

Avoid this once Git is the source of truth. If you must make an emergency browser edit:

```bash
npm run gas:pull
git diff
git add src
git commit -m "Pull emergency Apps Script editor change"
git push
```

---

## Source-of-truth rule

After initial setup:

```text
Git repo -> Apps Script project -> Google Sheet runtime
```

The repo should be the source of truth for code. The Apps Script editor should mostly be used for:

- Running/debugging functions.
- Checking logs and executions.
- Reviewing authorization prompts.
- Emergency hotfixes that are immediately pulled back into Git.

---

## GitHub Actions: CI only

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6
        with:
          node-version: "20"
          cache: npm
      - run: npm ci
      - run: npm run check
```

---

## GitHub Actions: push Apps Script on main

Use this if you want merges to `main` to automatically push to the Apps Script project.

### Required GitHub Secrets

Add these in your GitHub repo:

```text
Settings -> Secrets and variables -> Actions -> New repository secret
```

| Secret | Value |
| --- | --- |
| `CLASPRC_JSON` | Contents of your local `~/.clasprc.json` after `npx clasp login` |
| `CLASP_JSON_PROD` | Contents of the production `.clasp.json` |

Example `CLASP_JSON_PROD`:

```json
{
  "scriptId": "YOUR_PROD_SCRIPT_ID",
  "rootDir": "src"
}
```

### Workflow file

Create `.github/workflows/push-to-apps-script.yml`:

```yaml
name: Push to Apps Script

on:
  push:
    branches: [main]

jobs:
  push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6
        with:
          node-version: "20"
          cache: npm
      - run: npm ci
      - run: npm run check

      - name: Write clasp credentials
        shell: bash
        run: |
          printf '%s' '${{ secrets.CLASPRC_JSON }}' > "$HOME/.clasprc.json"
          printf '%s' '${{ secrets.CLASP_JSON_PROD }}' > .clasp.json

      - name: Push source to Apps Script
        run: npm run gas:push:force

      - name: Create Apps Script version
        run: npx clasp version "main-${GITHUB_SHA::7}"
```

Important: `clasp push --force` overwrites remote Apps Script files without confirmation. This is good for CI only if `main` is the source of truth.

---

## Dev/staging/prod setup

For serious projects, do not develop against the production Sheet.

Recommended environments:

```text
develop branch -> dev Sheet copy -> dev Apps Script project
main branch    -> prod Sheet     -> prod Apps Script project
```

Use separate GitHub Secrets:

```text
CLASP_JSON_DEV
CLASP_JSON_PROD
CLASPRC_JSON
```

Each `.clasp.json` points to a different Apps Script project:

```json
{
  "scriptId": "DEV_OR_PROD_SCRIPT_ID",
  "rootDir": "src"
}
```

If each Apps Script project is bound to its own Sheet, the same code can use:

```js
function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}
```

If the script is standalone or needs to open a specific Sheet ID, store the Sheet ID in Script Properties instead of hardcoding it:

```js
function getSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("Missing Script Property: SPREADSHEET_ID");
  return SpreadsheetApp.openById(id);
}
```

Set script properties manually in the Apps Script UI or with a small admin-only setup function.

---

## Tracking the Google Sheet schema in Git

Create `docs/sheet-schema.md`:

```md
# Sheet schema

## Tabs

### Orders

Required headers:

- Order ID
- Created At
- Customer Email
- Status
- Total

### Settings

Required keys:

- ENV
- NOTIFICATION_EMAIL
```

Optional: add an Apps Script function that validates the schema:

```js
function validateSheetSchema() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const required = {
    Orders: ["Order ID", "Created At", "Customer Email", "Status", "Total"],
    Settings: ["Key", "Value"]
  };

  Object.entries(required).forEach(([sheetName, headers]) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Missing sheet: ${sheetName}`);

    const actual = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    headers.forEach((header, index) => {
      if (actual[index] !== header) {
        throw new Error(`Missing header ${header} in ${sheetName}`);
      }
    });
  });
}
```

Run this after deployment or before key automations.

---

## Optional: TypeScript stack

Use TypeScript only if you want stronger typing or npm package bundling. Current clasp does not transpile TypeScript for you, so you need a separate build step.

Typical TypeScript layout:

```text
src-ts/
  index.ts
src/
  appsscript.json
  bundle.js
```

Suggested extra tools:

```bash
npm install --save-dev typescript esbuild
```

Example scripts:

```json
{
  "scripts": {
    "build": "esbuild src-ts/index.ts --bundle --platform=node --target=es2020 --outfile=src/bundle.js",
    "gas:push": "npm run build && clasp push",
    "gas:push:force": "npm run build && clasp push --force",
    "check": "npm run build && npm run lint"
  }
}
```

For simple Sheet automation, plain `.gs` or `.js` files are usually easier.

---

## Useful commands

| Task | Command |
| --- | --- |
| Login | `npx clasp login` |
| Open Apps Script editor | `npm run gas:open` |
| Pull cloud code to local | `npm run gas:pull` |
| Push local code to cloud | `npm run gas:push` |
| Watch and push while editing | `npm run gas:watch` |
| Create a version | `npm run gas:version -- "message"` |
| List versions | `npm run gas:versions` |
| Run lint | `npm run lint` |
| Format files | `npm run format` |

---

## Common mistakes

### 1. Editing in Apps Script and locally at the same time

Pick one source of truth. Recommended: Git. If browser edits happen, pull them immediately and commit.

### 2. Committing credentials

Never commit:

```text
~/.clasprc.json
.clasprc.json
.env
```

Treat `CLASPRC_JSON` as a secret because it can let CI push to your Apps Script projects.

### 3. Expecting clasp to version Sheet data

clasp is for Apps Script source, not spreadsheet data. Version important Sheet structure as docs, JSON, or CSV if needed.

### 4. Using production Sheet for development

Make a dev copy of the Sheet and bind a separate dev Apps Script project to it.

### 5. Hardcoding Sheet IDs or emails

Use Script Properties for environment-specific values.

---

## Minimal start checklist

```text
[ ] Enable Apps Script API in Google account settings
[ ] Create or open the Apps Script project attached to the Sheet
[ ] Copy Script ID
[ ] Create local Git repo
[ ] Install @google/clasp and dev tools
[ ] Run npx clasp login
[ ] Clone script into src/
[ ] Add .gitignore and .clasp.example.json
[ ] Commit src/appsscript.json and src/*.gs
[ ] Push repo to GitHub
[ ] Decide whether CI only checks or also pushes to Apps Script
[ ] Add GitHub Secrets if using CI push
[ ] Stop editing code directly in Apps Script editor unless emergency
```

---

## References

- Google Apps Script clasp guide: https://developers.google.com/apps-script/guides/clasp
- Google Apps Script manifest guide: https://developers.google.com/apps-script/concepts/manifests
- Google Apps Script projects guide: https://developers.google.com/apps-script/guides/projects
- clasp GitHub repo: https://github.com/google/clasp
- GitHub Actions checkout: https://github.com/actions/checkout
- GitHub Actions setup-node: https://github.com/actions/setup-node

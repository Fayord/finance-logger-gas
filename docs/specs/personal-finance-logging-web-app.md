# Personal Finance Logging Web App Specs

## Project Overview

This web app is a personal finance logging system built with **Google Sheets** and **Google Apps Script**.

The app replaces an older Notion-based logging system that was too limited for structured finance tracking.

The goal is to make daily logging fast, clean, and easy to analyze later.

The system should support three main transaction types:

| Type | Meaning |
|---|---|
| Expense | Money spent |
| Income | Money received |
| Transfer | Money moved between own accounts |

The first version should focus on logging first. Insights, charts, and deeper analysis can be built later as separate pages.

---

# Core Principles

## 1. Log Fast First

The main purpose of the app is to make daily logging fast.

The logging page should feel lightweight, not like accounting software.

A normal expense should take around 5–10 seconds to log.

The app should prioritize:

- fast input
- clean data
- low friction
- easy editing
- simple review

---

## 2. Different Log Types Need Different Detail

Expense needs more detail than income and transfer.

| Type | Category Depth |
|---|---|
| Expense | Tier 1 + Tier 2 |
| Income | Tier 1 only |
| Transfer | Tier 1 only |

Expense has many behavior patterns, so Tier 2 is useful.

Income and transfer have fewer categories, so forcing Tier 2 would slow down logging without much benefit.

---

## 3. Transfers Are Not Expenses

Transfers should be separated from real spending.

Examples of transfer:

- moving money between banks
- paying a credit card
- investing money
- moving money to wallet
- withdrawing cash
- depositing cash

Paying a credit card is not an expense if the original purchase was already logged as an expense.

Investment transfer is not normal spending. It is money moving from a bank account to an investment account.

| Type | Affects Spending Total? | Affects Net Worth? |
|---|---:|---:|
| Expense | Yes | Yes |
| Income | No | Yes |
| Transfer | No | No, only moves money between accounts |

---

## 4. Google Sheets Is the Source of Truth

The web app is only the input layer.

Google Sheets stores the actual transaction data.

This makes it easy to:

- edit mistakes manually
- filter rows
- build pivot tables
- create monthly reports
- export data later
- connect to Looker Studio later

---

## 5. Use Structured Fields, Not Only Memo

The old system should be improved by storing important information in structured fields.

Memo is still useful, but it should only be used for final details.

Examples:

| Field | Example |
|---|---|
| Date | 2026-06-30 |
| Type | Expense |
| Tier 1 | Food & Dining |
| Tier 2 | Sweet Drinks & Snacks |
| Amount | 85 |
| Account | KBank |
| Memo | ชานม |
| Taxable? | Check |
| Tax Deduction Status | No |

---

## 6. Tax Fields Are Review Flags

The app should not try to fully calculate tax.

Tax-related fields are used to flag items for later review.

Use:

```text
Yes / No / Check
```

Do not use a simple boolean because some income or expenses may be uncertain.

The app should help collect information for later review, not act as tax software.

---

## 7. Presets Reduce Friction

Common logs should be easy to prefill.

A preset can fill some or all fields.

Examples:

- Food KBank
- 53 baht Metro Wallet
- Salary Bangkok Bank
- Milk Tea
- Pay Credit Card
- Invest

Presets are especially useful because many logs are repetitive.

---

## 8. Recent Logs Must Be Editable

Mistakes often happen right after logging.

The app should show the last 10–20 transactions and allow quick editing or deleting.

Editing should refill the form with the existing transaction data.

Deleting should require confirmation.

Soft delete is preferred over hard delete.

---

## 9. Accounts Need Favorites and Grouping

The user has many accounts, cards, wallets, and cash locations.

A flat dropdown would be too hard to use.

The app should support:

- account groups
- favorite accounts
- search
- active / inactive accounts
- short display names

---

## 10. Insights Are Separate From Logging

The main logging page should stay focused on input.

Category insights should be a separate page later.

Examples of insight pages:

- monthly summary
- sweet drinks total
- buffet total
- mom care total
- tax review
- account balance review

---

# Transaction Types

## Expense

Expense means money spent.

Expense should use:

- Tier 1 category
- Tier 2 category
- Account
- Amount
- Optional tax deduction status
- Optional memo

Example:

| Field | Value |
|---|---|
| Type | Expense |
| Amount | 85 |
| Tier 1 | Food & Dining |
| Tier 2 | Sweet Drinks & Snacks |
| Account | KBank |
| Tax Deduction Status | No |
| Memo | ชานม |

---

## Income

Income means money received.

Income should use Tier 1 only.

Example categories:

- Salary
- Bonus
- Interest
- Gift
- Dividend
- Freelance / Business Income
- Refund / Reimbursement
- Cashback / Reward
- Other Income

Income should include a tax review field.

Example:

| Field | Value |
|---|---|
| Type | Income |
| Amount | 50,000 |
| Tier 1 | Salary |
| Account | Bangkok Bank |
| Taxable? | Yes |
| Memo | June salary |

---

## Transfer

Transfer means money moving between own accounts.

Transfer should use Tier 1 only.

Example categories:

- Transfer Between Accounts
- Pay Credit Card
- Invest
- Withdraw Cash
- Deposit Cash
- Loan Transfer
- Other Transfer

Transfer should use:

- From Account
- To Account
- Amount
- Optional memo

Example:

| Field | Value |
|---|---|
| Type | Transfer |
| Amount | 10,000 |
| Tier 1 | Invest |
| From Account | KBank |
| To Account | Broker |
| Memo | DCA fund |

---

# Tax Design

## Taxable?

`Taxable?` is for income.

It means:

> Should this income probably be included when reviewing or preparing personal income tax?

Options:

| Value | Meaning | Example |
|---|---|---|
| Yes | Likely tax-related income | Salary, bonus, freelance income |
| No | Usually not tax income | Refund, cashback, own-account transfer |
| Check | Need to review later | Interest, dividend, unusual gift |

Examples:

| Income Category | Default Taxable? | Note |
|---|---|---|
| Salary | Yes | Normal taxable income |
| Bonus | Yes | Usually taxable |
| Freelance / Business Income | Yes | Usually taxable |
| Interest | Check | Review yearly amount / withholding |
| Dividend | Check | Review withholding / tax treatment |
| Gift Received | Check | Depends on source and amount |
| Refund / Reimbursement | No | Usually money returned |
| Cashback / Reward | No | Usually small/non-core income |
| Other Income | Check | Review case by case |

---

## Tax Deduction Status

`Tax Deduction Status` is for expense.

It means:

> Can this expense possibly be used as a personal tax deduction?

Options:

| Value | Meaning | Example |
|---|---|---|
| Yes | Probably deductible | Approved tax campaign purchase, insurance, donation |
| No | Normal non-deductible expense | Coffee, buffet, taxi |
| Check | Need to review later | Receipt exists, campaign may apply |

Recommended default:

```text
No
```

Optional supporting fields for later:

| Field | Purpose |
|---|---|
| Tax Campaign | Easy E-Receipt, Insurance, Donation, Other |
| Tax Doc? | Yes / No / Check |
| Tax Note | Receipt number, e-tax invoice, shop name |

For MVP, only use:

```text
Tax Deduction Status
Tax Note
```

---

# Main Web App Pages

## Page 1: Quick Log

This is the main daily-use page.

It should include:

- transaction type switcher
- amount input
- dynamic category fields
- account picker
- memo field
- tax review fields
- preset buttons
- submit button
- recent transactions
- edit/delete actions

The page should stay focused on logging only.

---

## Page 2: Insights / Review

This page can be built later.

It should include:

- monthly spending summary
- income summary
- transfer summary
- sweet drinks and snacks total
- buffet spending total
- mom care total
- tax review list
- account balance review

This should not be part of the MVP logging page.

---

## Page 3: Settings

In the MVP, settings can live directly in Google Sheets.

Later, the web app can manage:

- expense categories
- income categories
- transfer categories
- accounts
- presets
- default account
- favorite accounts
- inactive accounts

---

# Quick Log Page Behavior

## Dynamic Form by Type

The form should change depending on transaction type.

### Expense Form

Fields:

| Field | Required? |
|---|---:|
| Date | Yes |
| Amount | Yes |
| Tier 1 | Yes |
| Tier 2 | Yes |
| Account | Yes |
| Tax Deduction Status | Optional |
| Tax Note | Optional |
| Memo | Optional |

---

### Income Form

Fields:

| Field | Required? |
|---|---:|
| Date | Yes |
| Amount | Yes |
| Income Category / Tier 1 | Yes |
| Account Received | Yes |
| Taxable? | Optional |
| Tax Note | Optional |
| Memo | Optional |

---

### Transfer Form

Fields:

| Field | Required? |
|---|---:|
| Date | Yes |
| Amount | Yes |
| Transfer Category / Tier 1 | Yes |
| From Account | Yes |
| To Account | Yes |
| Memo | Optional |

---

# Visual Design Rules

## Transaction Type Colors

Use simple color cues:

| Type / Mode | Suggested Color |
|---|---|
| Expense | Red |
| Income | Green |
| Transfer | Blue |
| Edit Mode | Amber/yellow banner + gray button |
| Delete | Red danger style |

Expense, income, and transfer colors show transaction type.

Edit mode should not use red, green, or blue because edit is not a transaction type. It is a state.

---

## Create Mode

In normal mode, the submit button should match transaction type.

Examples:

```text
Add Expense
Add Income
Add Transfer
```

---

## Edit Mode

When clicking edit from recent logs:

- form fills with existing transaction data
- an edit banner appears
- submit button changes text
- cancel edit button appears
- transaction type color remains visible
- edit state uses amber/yellow or gray visual cue

Example banner:

```text
Editing Transaction
Sweet Drinks & Snacks · ฿53 · KBank
```

Submit button:

```text
Save Changes
```

Cancel button:

```text
Cancel Edit
```

---

## Delete Confirmation

Delete should require confirmation.

Example confirmation:

```text
Are you sure you want to delete this transaction?

฿53 · Sweet Drinks & Snacks · Metro Wallet

[Cancel] [Delete]
```

Soft delete is preferred.

---

# Recent Logs Feature

Show the last 10–20 non-deleted transactions.

Each transaction should show:

- type
- amount
- category
- subcategory if available
- account or from/to account
- memo
- date/time
- edit button
- delete button

Example expense card:

```text
[Expense] ฿53
Sweet Drinks & Snacks
Account: Metro Wallet
Memo: Milk tea
Today 14:32

[Edit] [Delete]
```

Example income card:

```text
[Income] ฿50,000
Salary
To: Bangkok Bank
Taxable?: Yes
Today 09:00

[Edit] [Delete]
```

Example transfer card:

```text
[Transfer] ฿10,000
Invest
KBank → Broker
Memo: DCA fund
Today 12:00

[Edit] [Delete]
```

---

# Edit / Delete Technical Design

Each transaction row should have a unique transaction ID.

Example formats:

```text
TXN-20260630-153012-8392
```

or

```text
timestamp + random number
```

Recommended technical fields:

| Field | Purpose |
|---|---|
| Transaction ID | Used to edit/delete exact row |
| Created At | When first logged |
| Updated At | When edited |
| Deleted? | Soft delete flag |
| Deleted At | When deleted |

Delete should be a soft delete:

```text
Deleted? = TRUE
Deleted At = timestamp
```

The app should hide deleted rows by default.

---

# Preset Catalog

## Purpose

Presets are shortcuts that prefill transaction fields.

A preset can prefill some or all fields.

Examples:

| Preset | Behavior |
|---|---|
| Food KBank | Expense, Food & Dining, Eating Out, KBank |
| Metro Wallet 53 | Expense, 53 baht, Transit, Wallet |
| Salary Bangkok Bank | Income, Salary, Bangkok Bank |
| Milk Tea | Expense, Sweet Drinks & Snacks |
| Buffet GF | Expense, Eating Out - Buffet |
| Pay KTC | Transfer, Pay Credit Card, Bank to KTC |
| Invest | Transfer, Invest, Bank to Broker |

---

## Preset Rules

Presets should not require every field.

A preset may fill only:

- type
- category
- account

Or it may fill more:

- type
- amount
- category
- account
- memo

After clicking a preset, the user can still edit any field before submitting.

---

## Presets Sheet Structure

Suggested sheet tab:

```text
Presets
```

Columns:

| Column | Example |
|---|---|
| Preset ID | PRESET-001 |
| Preset Name | Milk Tea |
| Type | Expense |
| Amount | blank or 53 |
| Tier 1 | Food & Dining |
| Tier 2 | Sweet Drinks & Snacks |
| Income Category | blank |
| Transfer Category | blank |
| Account | KBank |
| From Account | blank |
| To Account | blank |
| Taxable? | blank |
| Tax Deduction Status | No |
| Memo | ชานม |
| Active? | TRUE |
| Sort Order | 1 |

---

# Account Design

## Account Picker Principle

The user has many accounts.

The app should not show one huge dropdown as the first experience.

Instead, it should support:

- favorite account buttons
- grouped account list
- account search
- active / inactive state
- short display name
- full account name

---

## Account Types

| Account Type | Meaning |
|---|---|
| Cash | Physical money |
| Bank | Normal bank account |
| Wallet | E-wallet / app wallet |
| Credit Card | Credit card |
| Credit Line | Ready credit / cash plus |
| Investment | Broker / investment account |
| Other | Special cases |

---

## Account Master Fields

Suggested sheet tab:

```text
Accounts
```

Columns:

| Column | Example |
|---|---|
| Account ID | ACC-001 |
| Display Name | KTC 8897 |
| Full Name | KTC World Rewards 8897 |
| Account Type | Credit Card |
| Last 4 Digits | 8897 |
| Favorite? | TRUE |
| Active? | TRUE |
| Default Expense? | TRUE |
| Default Income? | FALSE |
| Default Transfer From? | FALSE |
| Default Transfer To? | FALSE |
| Sort Order | 1 |
| Notes | Main credit card |

---

## Suggested Account Groups

### Cash

| Account |
|---|
| Cash Wallet |
| Home Cash - Coins |
| Home Cash - Notes |
| Bag Cash - Coins |

Original names:

- wallet
- home coin
- Home bank
- Bag coin

---

### Bank Accounts

| Account |
|---|
| KBank |
| Bangkok Bank |
| UOB One Account |
| UOB Premier 3770 |
| UOB Preferred 3635 |
| Krungsri Now 2802 |
| KBank eBook |
| KBank Make |
| TTB Me Save |
| LHB You |
| Dime! Save |
| KKP Start Saving |
| UOB TMRW Everyday |
| UOB TMRW Saving |
| CIMB Chill D |
| iBank |
| Alpha |
| SCB |
| TTB All Free |

---

### Wallet / E-Money

| Account |
|---|
| TrueMoney |
| The1 Red |

---

### Credit Cards

| Account |
|---|
| Bangkok M Live 7116 |
| KTC World Rewards 8897 |
| KTC Visa 9369 |
| TTB Disney Credit |
| Krungsri Signature 1851 |
| UOB One 5313 |
| Lotus Beyond 6673 |
| KBank The Passion 7066 |
| Citi Premier 8041 |
| Citi Premier 9108 |
| CardX Beyond 5993 |
| Bangkok Visa Card 0119 |

---

### Credit Line / Loan-like Accounts

| Account |
|---|
| UOB Cash Plus |
| Citi Ready Credit |

---

# Google Sheets Structure

## Recommended Tabs

| Sheet Tab | Purpose |
|---|---|
| Transactions | Main transaction log |
| Expense_Categories | Expense Tier 1 and Tier 2 |
| Income_Categories | Income categories |
| Transfer_Categories | Transfer categories |
| Accounts | Account master |
| Presets | Preset catalog |
| Settings | Defaults and app options |

---

## Transactions Sheet Columns

Recommended columns:

| Column | Required? | Notes |
|---|---:|---|
| Transaction ID | Yes | Unique ID for edit/delete |
| Date | Yes | Transaction date |
| Created At | Yes | Timestamp when created |
| Updated At | Optional | Timestamp when edited |
| Type | Yes | Expense / Income / Transfer |
| Amount | Yes | Positive number only |
| Tier 1 | Yes | Expense Tier 1 / Income Category / Transfer Category |
| Tier 2 | Optional | Mainly for expense |
| Account | Conditional | Expense or income account |
| From Account | Conditional | Transfer source |
| To Account | Conditional | Transfer destination |
| Taxable? | Optional | Income only: Yes / No / Check |
| Tax Deduction Status | Optional | Expense only: Yes / No / Check |
| Tax Note | Optional | Free text for tax review |
| Memo | Optional | Details |
| Preset Used | Optional | Preset name or ID |
| Deleted? | Yes | FALSE by default |
| Deleted At | Optional | Timestamp when soft deleted |

Important rule:

```text
Amount should always be stored as a positive number.
```

The transaction `Type` controls whether the amount means money out, money in, or money moved.

---

# MVP Scope

## Must Have

| Feature | Include? |
|---|---:|
| Expense / Income / Transfer switcher | Yes |
| Dynamic form by type | Yes |
| Expense Tier 1 + Tier 2 | Yes |
| Income Tier 1 only | Yes |
| Transfer Tier 1 only | Yes |
| Account picker with favorites | Yes |
| Taxable? for income | Yes |
| Tax Deduction Status for expense | Yes |
| Preset catalog buttons | Yes |
| Submit new transaction | Yes |
| Recent 10–20 logs | Yes |
| Edit recent log | Yes |
| Delete recent log with confirmation | Yes |
| Soft delete | Yes |

---

## Later

| Feature | Include Later? |
|---|---:|
| Category insights page | Later |
| Sweet drinks total | Later |
| Buffet total | Later |
| Mom Care total | Later |
| Tax review page | Later |
| Monthly dashboard | Later |
| Charts | Later |
| Full account balance dashboard | Later |
| Settings management in web app | Later |

---

# Final MVP Direction

The first version should focus on building one excellent **Quick Log page**.

The Quick Log page should include:

- fast expense / income / transfer logging
- presets
- account favorites
- tax review flags
- recent logs
- edit and delete

Do not build the insights dashboard until logging feels smooth.

Best rule:

```text
Log fast first. Analyze later.
```

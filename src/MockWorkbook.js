/**
 * Deterministic mock workbook data for local review and GAS seeding.
 * Keep this file free of SpreadsheetApp so tests can validate it locally.
 */
var MOCK_EXPENSE_CATEGORIES = Object.freeze([
  ["Housing & Living", "Rent", "ค่าสัญญาห้องเดือน 9, ค่าห้อง", true, 10],
  ["Housing & Living", "Electricity", "ค่าไฟ", true, 20],
  ["Housing & Living", "Water", "ค่าน้ำ", true, 30],
  ["Housing & Living", "Internet", "ค่าเน็ตบ้าน", true, 40],
  ["Housing & Living", "Phone", "ค่าโทรศัพท์", true, 50],
  ["Housing & Living", "House Supplies", "น้ำยาซักผ้า, ถุงซักผ้า, ทิชชู่", true, 60],
  ["Housing & Living", "Furniture", "เครื่องซักผ้า, เครื่องดูดฝุ่น, ชั้นวางของ", true, 70],
  ["Food & Dining", "Eating Out", "ข้าวแกง, ร้านอาหารทั่วไป", true, 80],
  ["Food & Dining", "Eating Out - Buffet", "บุฟเฟต์, หมูกระทะ, ชาบู, ปิ้งย่าง", true, 90],
  ["Food & Dining", "Delivery", "GrabFood, Lineman", true, 100],
  ["Food & Dining", "Groceries", "หมู, ผักจาก Tops", true, 110],
  ["Food & Dining", "Sweet Drinks & Snacks", "ชา, กาแฟ, น้ำหวาน, น้ำผลไม้, ขนม", true, 120],
  ["Transportation", "Transit", "BTS, MRT", true, 130],
  ["Transportation", "Taxi / Grab", "Grab, Win", true, 140],
  ["Health & Personal Care", "Doctor", "คลินิกหมอผิวหนัง, ค่าพยาบาล", true, 150],
  ["Health & Personal Care", "Medicine", "ยาคุม, ที่ตรวจโควิด", true, 160],
  ["Health & Personal Care", "Dental", "ทำฟัน, รีเทนเนอร์", true, 170],
  ["Health & Personal Care", "Clothes", "กางเกง, เสื้อแจ็คเก็ต", true, 180],
  ["Health & Personal Care", "Shoes", "รองเท้า vivo", true, 190],
  ["Health & Personal Care", "Haircut", "ตัดผม", true, 200],
  ["Health & Personal Care", "Skincare", "Retinol, Sunscreen", true, 210],
  ["Mom Care", "Monthly Gift", "ให้เงินแม่ทุกเดือน, เงินเดือนให้แม่", true, 220],
  ["Mom Care", "Health Care", "ค่ายาแม่, ค่าหาหมอแม่", true, 230],
  ["Career & Professional", "Software", "Cursor, Google developer fee", true, 240],
  ["Career & Professional", "Learning", "ซื้อหนังสือโปรแกรม", true, 250],
  ["Fun & Play", "Entertainment", "Netflix, Spotify, ดูหนัง", true, 260],
  ["Fun & Play", "Gaming", "Game Pass, Steam", true, 270],
  ["Fun & Play", "Gadgets", "Power bank, ที่ทำความสะอาดหูฟัง", true, 280],
  ["Fun & Play", "Gifts", "ของขวัญ, เลี้ยงคนอื่น, จ่ายให้คนอื่น", true, 290],
  ["Business Ventures", "Gummy Business", "วัตถุดิบกัมมี่, ค่าส่ง", true, 300],
  ["Business Ventures", "Camera Business", "เลนส์, ค่าซ่อม", true, 310],
  ["Business Ventures", "Condo Food", "หมู, ผักทำอาหารขาย", true, 320],
  ["Business Ventures", "Market Food", "ค่าเช่าที่ตลาด", true, 330],
  ["Business Ventures", "Loan Business", "เงินหมุนเวียนปล่อยกู้", true, 340],
  ["Financial & Admin", "Taxes", "จ่ายภาษีงวด 2", true, 350],
  ["Financial & Admin", "Insurance", "จ่ายประกัน", true, 360],
  ["Financial & Admin", "Loans", "จ่ายคืน loan", true, 370],
  ["Financial & Admin", "Investments", "ซื้อกองทุน", true, 380],
  ["Financial & Admin", "Other", "Easybills, ค่าธรรมเนียม, จิปาถะ", true, 390],
  ["Financial & Admin", "Missing", "ลืมจด, เงินหาย", true, 400]
]);

function buildMockWorkbook() {
  var accounts = getMockAccounts_();
  var transactions = getMockTransactions_();
  var balances = calculateBalances(accounts, transactions).map(function (balance) {
    var manualBalance = getMockManualBalance_(balance["Account ID"], balance["Calculated Balance"]);
    var balanceDifference = manualBalance === "" ? "" : manualBalance - balance["Calculated Balance"];

    return {
      "Account ID": balance["Account ID"],
      "Display Name": balance["Display Name"],
      "Opening Balance": balance["Opening Balance"],
      "Transaction Delta": balance["Transaction Delta"],
      "Calculated Balance": balance["Calculated Balance"],
      "Manual Balance": manualBalance,
      "Balance Difference": balanceDifference,
      "Last Reconciled At": "2026-06-30T18:00:00.000Z",
      Notes: getMockBalanceNote_(balance["Account ID"])
    };
  });

  return {
    generatedAt: "2026-06-30T12:00:00.000Z",
    sheets: [
      createDataSheet_(MOCK_FINANCE_SHEETS.TRANSACTIONS, TRANSACTION_HEADERS, transactions),
      createFormulaSheet_(
        MOCK_FINANCE_SHEETS.EXPENSES_VIEW,
        TRANSACTION_HEADERS,
        '=FILTER(Mock_Transactions!A:R, Mock_Transactions!E:E="Expense", Mock_Transactions!Q:Q<>TRUE)'
      ),
      createFormulaSheet_(
        MOCK_FINANCE_SHEETS.INCOME_VIEW,
        TRANSACTION_HEADERS,
        '=FILTER(Mock_Transactions!A:R, Mock_Transactions!E:E="Income", Mock_Transactions!Q:Q<>TRUE)'
      ),
      createFormulaSheet_(
        MOCK_FINANCE_SHEETS.TRANSFERS_VIEW,
        TRANSACTION_HEADERS,
        '=FILTER(Mock_Transactions!A:R, Mock_Transactions!E:E="Transfer", Mock_Transactions!Q:Q<>TRUE)'
      ),
      createDataSheet_(MOCK_FINANCE_SHEETS.ACCOUNTS, ACCOUNT_HEADERS, accounts),
      createDataSheet_(MOCK_FINANCE_SHEETS.BALANCES, BALANCE_HEADERS, balances),
      createArraySheet_(
        MOCK_FINANCE_SHEETS.EXPENSE_CATEGORIES,
        CATEGORY_HEADERS,
        MOCK_EXPENSE_CATEGORIES
      ),
      createArraySheet_(
        MOCK_FINANCE_SHEETS.INCOME_CATEGORIES,
        INCOME_CATEGORY_HEADERS,
        getMockIncomeCategories_()
      ),
      createArraySheet_(
        MOCK_FINANCE_SHEETS.TRANSFER_CATEGORIES,
        TRANSFER_CATEGORY_HEADERS,
        getMockTransferCategories_()
      ),
      createDataSheet_(MOCK_FINANCE_SHEETS.PRESETS, PRESET_HEADERS, getMockPresets_()),
      createArraySheet_(MOCK_FINANCE_SHEETS.SETTINGS, SETTING_HEADERS, getMockSettings_())
    ]
  };
}

function getMockWorkbookSheetNames() {
  return buildMockWorkbook().sheets.map(function (sheet) {
    return sheet.name;
  });
}

function createDataSheet_(name, headers, rows) {
  return {
    name: name,
    headers: headers.slice(),
    rows: rows.map(function (row) {
      return headers.map(function (header) {
        return row[header] === undefined ? "" : row[header];
      });
    }),
    kind: "data"
  };
}

function createArraySheet_(name, headers, rows) {
  return {
    name: name,
    headers: headers.slice(),
    rows: rows.map(function (row) {
      return row.slice();
    }),
    kind: "data"
  };
}

function createFormulaSheet_(name, headers, formula) {
  return {
    name: name,
    headers: headers.slice(),
    rows: [],
    formula: formula,
    kind: "formula-view"
  };
}

function getMockAccounts_() {
  return [
    mockAccount_("cash-wallet", "Cash", "Cash Wallet", "Cash", 2500, "", true, true, true, false, false, false, 10, "Daily physical cash."),
    mockAccount_("kbank-main", "KBank", "Kasikorn Main Account", "Bank", 25000, "1234", true, true, true, true, true, false, 20, "Main bank account."),
    mockAccount_("uob-savings", "UOB Save", "UOB TMRW Saving", "Bank", 18000, "3770", false, true, false, false, true, false, 30, "Secondary savings."),
    mockAccount_("truemoney", "TrueMoney", "TrueMoney Wallet", "Wallet", 1200, "", true, true, true, false, false, true, 40, "Transit and small purchases."),
    mockAccount_("ktc-card", "KTC 8897", "KTC World Rewards 8897", "Credit Card", 0, "8897", true, true, true, false, false, false, 50, "Main credit card."),
    mockAccount_("uob-cash-plus", "UOB Cash+", "UOB Cash Plus", "Credit Line", -15000, "", false, true, false, false, true, false, 60, "Loan-like credit line."),
    mockAccount_("dime-invest", "Dime Invest", "Dime Investment Account", "Investment", 50000, "", false, true, false, false, false, true, 70, "Investment account."),
    mockAccount_("old-wallet", "Old Wallet", "Inactive Wallet", "Wallet", 300, "", false, false, false, false, false, false, 80, "Inactive account kept for history.")
  ];
}

function mockAccount_(
  accountId,
  displayName,
  fullName,
  accountType,
  openingBalance,
  last4Digits,
  favorite,
  active,
  defaultExpense,
  defaultIncome,
  defaultTransferFrom,
  defaultTransferTo,
  sortOrder,
  notes
) {
  return {
    "Account ID": accountId,
    "Display Name": displayName,
    "Full Name": fullName,
    "Account Type": accountType,
    "Opening Balance": openingBalance,
    "Last 4 Digits": last4Digits,
    "Favorite?": favorite,
    "Active?": active,
    "Default Expense?": defaultExpense,
    "Default Income?": defaultIncome,
    "Default Transfer From?": defaultTransferFrom,
    "Default Transfer To?": defaultTransferTo,
    "Sort Order": sortOrder,
    Notes: notes
  };
}

function getMockTransactions_() {
  return [
    mockTransaction_("MOCK-EXP-001", "2026-06-01", "Expense", 65, "Food & Dining", "Sweet Drinks & Snacks", "truemoney", "", "", "", "No", "", "Milk tea after lunch", "Milk Tea", false, ""),
    mockTransaction_("MOCK-EXP-002", "2026-06-02", "Expense", 320, "Food & Dining", "Eating Out - Buffet", "ktc-card", "", "", "", "No", "", "Shabu buffet", "Buffet", false, ""),
    mockTransaction_("MOCK-EXP-003", "2026-06-03", "Expense", 1580, "Mom Care", "Monthly Gift", "kbank-main", "", "", "", "Check", "Review support transfer deductibility.", "Mom care monthly support", "Mom Care", false, ""),
    mockTransaction_("MOCK-EXP-004", "2026-06-04", "Expense", 1290, "Career & Professional", "Software", "ktc-card", "", "", "", "Check", "Possible business software expense.", "Cursor subscription", "", false, ""),
    mockTransaction_("MOCK-EXP-005", "2026-06-05", "Expense", 45, "Transportation", "Transit", "truemoney", "", "", "", "No", "", "MRT fare", "Metro Wallet", false, ""),
    mockTransaction_("MOCK-EXP-006", "2026-06-06", "Expense", 999, "Financial & Admin", "Missing", "cash-wallet", "", "", "", "Check", "Uncertain category and account; needs review.", "Missing receipt example", "", false, ""),
    mockTransaction_("MOCK-INC-001", "2026-06-07", "Income", 55000, "Salary", "", "kbank-main", "", "", "Yes", "", "", "Salary for June", "Salary", false, ""),
    mockTransaction_("MOCK-INC-002", "2026-06-08", "Income", 8000, "Freelance / Business Income", "", "uob-savings", "", "", "Check", "", "Review invoice tax handling.", "Website maintenance project", "", false, ""),
    mockTransaction_("MOCK-INC-003", "2026-06-09", "Income", 450, "Refunds", "", "truemoney", "", "", "No", "", "", "Refund from food delivery", "", false, ""),
    mockTransaction_("MOCK-TRF-001", "2026-06-10", "Transfer", 5000, "Account Transfer", "", "", "kbank-main", "uob-savings", "", "", "", "Move savings", "", false, ""),
    mockTransaction_("MOCK-TRF-002", "2026-06-11", "Transfer", 320, "Credit Card Payment", "", "", "kbank-main", "ktc-card", "", "", "", "Pay KTC buffet charge", "Credit Card Payment", false, ""),
    mockTransaction_("MOCK-TRF-003", "2026-06-12", "Transfer", 10000, "Investment Transfer", "", "", "uob-savings", "dime-invest", "", "", "", "Monthly investment", "Investment", false, ""),
    mockTransaction_("MOCK-TRF-004", "2026-06-13", "Transfer", 2000, "Cash Withdraw / Deposit", "", "", "kbank-main", "cash-wallet", "", "", "", "ATM cash refill", "", false, ""),
    mockTransaction_("MOCK-EXP-DEL", "2026-06-14", "Expense", 120, "Fun & Play", "Entertainment", "cash-wallet", "", "", "", "No", "", "Soft-deleted mistaken row", "", true, "2026-06-14T10:30:00.000Z")
  ];
}

function mockTransaction_(
  transactionId,
  date,
  type,
  amount,
  tier1,
  tier2,
  account,
  fromAccount,
  toAccount,
  taxable,
  taxDeductionStatus,
  taxNote,
  memo,
  presetUsed,
  deleted,
  deletedAt
) {
  var timestamp = date + "T09:00:00.000Z";

  return {
    "Transaction ID": transactionId,
    Date: date,
    "Created At": timestamp,
    "Updated At": timestamp,
    Type: type,
    Amount: amount,
    "Tier 1": tier1,
    "Tier 2": tier2,
    Account: account,
    "From Account": fromAccount,
    "To Account": toAccount,
    "Taxable?": taxable,
    "Tax Deduction Status": taxDeductionStatus,
    "Tax Note": taxNote,
    Memo: memo,
    "Preset Used": presetUsed,
    "Deleted?": deleted,
    "Deleted At": deletedAt
  };
}

function getMockIncomeCategories_() {
  return [
    ["Salary", "Yes", true, 10],
    ["Freelance / Business Income", "Check", true, 20],
    ["Gifts", "Check", true, 30],
    ["Refunds", "No", true, 40],
    ["Interest", "Check", true, 50],
    ["Other Income", "Check", true, 60]
  ];
}

function getMockTransferCategories_() {
  return [
    ["Account Transfer", true, 10],
    ["Credit Card Payment", true, 20],
    ["Investment Transfer", true, 30],
    ["Cash Withdraw / Deposit", true, 40],
    ["Loan Transfer", true, 50],
    ["Other Transfer", true, 60]
  ];
}

function getMockPresets_() {
  return [
    mockPreset_("PRESET-MILK-TEA", "Milk Tea", "Expense", 65, "Food & Dining", "Sweet Drinks & Snacks", "", "", "truemoney", "", "", "", "No", "Milk tea", true, 10),
    mockPreset_("PRESET-METRO", "Metro Wallet", "Expense", 45, "Transportation", "Transit", "", "", "truemoney", "", "", "", "No", "MRT/BTS fare", true, 20),
    mockPreset_("PRESET-SALARY", "Salary", "Income", "", "Salary", "", "Salary", "", "kbank-main", "", "", "Yes", "", "Monthly salary", true, 30),
    mockPreset_("PRESET-CARD-PAY", "Credit Card Payment", "Transfer", "", "Credit Card Payment", "", "", "Credit Card Payment", "", "kbank-main", "ktc-card", "", "", "Pay credit card", true, 40),
    mockPreset_("PRESET-INVEST", "Investment", "Transfer", 10000, "Investment Transfer", "", "", "Investment Transfer", "", "uob-savings", "dime-invest", "", "", "Monthly investment", true, 50),
    mockPreset_("PRESET-BUFFET", "Buffet", "Expense", 320, "Food & Dining", "Eating Out - Buffet", "", "", "ktc-card", "", "", "", "No", "Buffet meal", true, 60),
    mockPreset_("PRESET-MOM", "Mom Care", "Expense", 1580, "Mom Care", "Monthly Gift", "", "", "kbank-main", "", "", "", "Check", "Mom support", true, 70)
  ];
}

function mockPreset_(
  presetId,
  presetName,
  type,
  amount,
  tier1,
  tier2,
  incomeCategory,
  transferCategory,
  account,
  fromAccount,
  toAccount,
  taxable,
  taxDeductionStatus,
  memo,
  active,
  sortOrder
) {
  return {
    "Preset ID": presetId,
    "Preset Name": presetName,
    Type: type,
    Amount: amount,
    "Tier 1": tier1,
    "Tier 2": tier2,
    "Income Category": incomeCategory,
    "Transfer Category": transferCategory,
    Account: account,
    "From Account": fromAccount,
    "To Account": toAccount,
    "Taxable?": taxable,
    "Tax Deduction Status": taxDeductionStatus,
    Memo: memo,
    "Active?": active,
    "Sort Order": sortOrder
  };
}

function getMockSettings_() {
  return [
    ["timezone", "Asia/Bangkok", "Display and default date timezone."],
    ["currency", "THB", "Default currency for the first version."],
    ["recentLogLimit", 20, "Number of recent non-deleted logs to show."],
    ["defaultTransactionType", "Expense", "Initial Quick Log mode."],
    ["mockWorkbookVersion", "2026-06-30", "Deterministic mock workbook seed version."]
  ];
}

function getMockManualBalance_(accountId, calculatedBalance) {
  if (accountId === "cash-wallet") {
    return calculatedBalance - 20;
  }

  if (accountId === "kbank-main") {
    return calculatedBalance;
  }

  return "";
}

function getMockBalanceNote_(accountId) {
  if (accountId === "cash-wallet") {
    return "Manual count differs by 20 for reconciliation review.";
  }

  if (accountId === "old-wallet") {
    return "Inactive account still appears for historical completeness.";
  }

  return "";
}

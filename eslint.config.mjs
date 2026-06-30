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
        Browser: "readonly",
        FINANCE_SHEETS: "readonly",
        TRANSACTION_TYPES: "readonly",
        TRANSACTION_HEADERS: "readonly",
        ACCOUNT_HEADERS: "readonly",
        BALANCE_HEADERS: "readonly",
        VIEW_SHEETS_BY_TYPE: "readonly",
        normalizeTransaction: "readonly",
        validateTransaction: "readonly",
        buildTransactionViews: "readonly",
        calculateBalances: "readonly",
        getConnectionStatus: "readonly"
      }
    },
    rules: {
      "no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^(doGet|doPost|onOpen|onEdit|include|getConnectionStatus|FINANCE_SHEETS|TRANSACTION_TYPES|TRANSACTION_HEADERS|ACCOUNT_HEADERS|BALANCE_HEADERS|VIEW_SHEETS_BY_TYPE|normalizeTransaction|validateTransaction|buildTransactionViews|calculateBalances)$"
        }
      ],
      "no-undef": "error"
    }
  }
];

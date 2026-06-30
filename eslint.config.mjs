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
      "no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^(doGet|doPost|onOpen|onEdit|include)$"
        }
      ],
      "no-undef": "error"
    }
  }
];

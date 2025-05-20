const Node = {
  "id": "da7992a63ec8bb2b",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "1e97f626957f10f8",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 480,
  "wires": [
    [
      "43afb89812ec7f8c"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
CREATE TABLE IF NOT EXISTS accountingRules (
    reference NVARCHAR(255) NULL,
    sender NVARCHAR(255) NULL,
    typeDescription NVARCHAR(255) NULL,
    amount1 NVARCHAR(20) NULL,
    amount2 NVARCHAR(20) NULL,
    operator NVARCHAR(2) NULL,
    text NVARCHAR(255) NULL,
    account NVARCHAR(50) NULL,
    accountSecondary NVARCHAR(50) NULL,
    accountTertiary NVARCHAR(50) NULL,
    note NVARCHAR(255) NULL,
    activeBool BOOLEAN,
    exceptionBool BOOLEAN,
    tempBool BOOLEAN DEFAULT FALSE,
    lastUsed NVARCHAR(10) NULL,
    ruleID INT PRIMARY KEY,
    relatedBankAccount NVARCHAR(31) NULL,
    postWithCPR BOOLEAN DEFAULT FALSE,
    cpr NVARCHAR(10) NULL, 
    FOREIGN KEY (relatedBankAccount) REFERENCES bankAccounts(bankAccount) ON DELETE SET NULL
);
`

module.exports = Node;
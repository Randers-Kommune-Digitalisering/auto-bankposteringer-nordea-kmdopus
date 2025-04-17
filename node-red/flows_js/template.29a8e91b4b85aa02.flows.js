const Node = {
  "id": "29a8e91b4b85aa02",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "d992b55d9d319a30",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 240,
  "wires": [
    [
      "dd7888da58645ebb"
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
    note NVARCHAR(255) NULL,
    activeBool BOOLEAN,
    exceptionBool BOOLEAN,
    tempBool BOOLEAN DEFAULT FALSE,
    lastUsed NVARCHAR(10) NULL,
    ruleID INT PRIMARY KEY,
    relatedBankAccount NVARCHAR(31) NULL,
    postWithCPR BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (relatedBankAccount) REFERENCES bankAccounts(bankAccount) ON DELETE SET NULL
);
`

module.exports = Node;
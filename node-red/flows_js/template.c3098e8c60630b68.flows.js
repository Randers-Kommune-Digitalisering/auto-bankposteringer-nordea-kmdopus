const Node = {
  "id": "c3098e8c60630b68",
  "type": "template",
  "z": "431f85f122b4636d",
  "g": "5126da366c0f2bdb",
  "name": "Byg SQL-tabel til konteringsregler",
  "field": "configs.database.accountingRules",
  "fieldType": "global",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 240,
  "y": 260,
  "wires": [
    [
      "7b6dac14defeedc2"
    ]
  ],
  "icon": "font-awesome/fa-pencil",
  "info": ""
}

Node.info = `
RuleID should not be renamed, as it breaks other nodes' functionality.
`

Node.template = `
CREATE TABLE IF NOT EXISTS accountingRules (
    Reference NVARCHAR(255) NULL,
    Afsender NVARCHAR(255) NULL,
    Posteringstype NVARCHAR(255) NULL,
    Beløb1 NVARCHAR(20) NULL,
    Beløb2 NVARCHAR(20) NULL,
    Operator NVARCHAR(2) NULL,
    Posteringstekst NVARCHAR(255) NULL,
    Artskonto NVARCHAR(50) NULL,
    PSP NVARCHAR(50) NULL,
    Notat NVARCHAR(255) NULL,
    ActiveBool BOOLEAN,
    ExceptionBool BOOLEAN,
    LastUsed NVARCHAR(10) NULL,
    RuleID INT PRIMARY KEY,
    relatedBankAccount NVARCHAR(31) NULL,
    FOREIGN KEY (relatedBankAccount) REFERENCES bankAccounts(bankAccount) ON DELETE SET NULL
);
`

module.exports = Node;
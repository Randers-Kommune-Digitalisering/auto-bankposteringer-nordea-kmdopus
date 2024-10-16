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
  "x": 200,
  "y": 400,
  "wires": [
    [
      "c7d56102c53e8e83"
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
    Advisliste NVARCHAR(255) NULL,
    Afsender NVARCHAR(255) NULL,
    Posteringstype NVARCHAR(255) NULL,
    Beløb1 DECIMAL(18,2) NULL,
    Beløb2 DECIMAL(18,2) NULL,
    Operator NVARCHAR(2) NULL,
    Posteringstekst NVARCHAR(255) NULL,
    Artskonto NVARCHAR(50) NULL,
    PSP NVARCHAR(50) NULL,
    Notat NVARCHAR(255) NULL,
    ActiveBool BOOLEAN,
    ExceptionBool BOOLEAN,
    LastUsed NVARCHAR(10) NULL,
    RuleID INT PRIMARY KEY
);
`

module.exports = Node;
const Node = {
  "id": "a0732a0c8e4fd114",
  "type": "template",
  "z": "431f85f122b4636d",
  "name": "Build accountingRules db table",
  "field": "configs.database.accountingRules",
  "fieldType": "global",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 410,
  "y": 80,
  "wires": [
    [
      "ce41aad1a3978514"
    ]
  ],
  "icon": "font-awesome/fa-pencil",
  "info": ""
}

Node.info = `
RuleID should not be renamed, as it breaks other nodes' functionality.
`

Node.template = `
CREATE TABLE IF NOT EXISTS {{global.configs.names.accountingRules}} (
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
    RuleID INT PRIMARY KEY
);
`

module.exports = Node;
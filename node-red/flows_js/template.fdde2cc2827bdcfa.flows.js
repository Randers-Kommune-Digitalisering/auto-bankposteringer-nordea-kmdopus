const Node = {
  "id": "fdde2cc2827bdcfa",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "9e8459915626dabc",
  "name": "SQL query \"CREATE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 905,
  "y": 240,
  "wires": [
    [
      "cec013e5592b6995"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

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
    Active BOOLEAN,
    \`Exception\` BOOLEAN,
    RuleID INT PRIMARY KEY
);
`

module.exports = Node;
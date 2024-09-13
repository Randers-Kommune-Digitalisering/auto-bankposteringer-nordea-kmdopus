const Node = {
  "id": "e349260c2e91fc0a",
  "type": "template",
  "z": "431f85f122b4636d",
  "name": "Build masterData db table",
  "field": "configs.database.masterData",
  "fieldType": "global",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 390,
  "y": 160,
  "wires": [
    [
      "ce41aad1a3978514"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

Node.template = `
CREATE TABLE IF NOT EXISTS {{global.configs.names.masterData}} (
    admName NVARCHAR(63),
    admEmail NVARCHAR(63),
    admID NVARCHAR(31) PRIMARY KEY,
    erpSystem NVARCHAR(31),
    integrationBool BOOL DEFAULT 0
);
`

module.exports = Node;
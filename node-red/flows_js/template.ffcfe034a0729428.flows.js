const Node = {
  "id": "ffcfe034a0729428",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "24481f222bcf4517",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 1135,
  "y": 240,
  "wires": [
    [
      "096c9db9233bb226"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
CREATE TABLE IF NOT EXISTS admSysData (
    accessToken NVARCHAR(256) NULL,
    refreshToken NVARCHAR(256) NULL,
    admName NVARCHAR(63),
    admEmail NVARCHAR(63),
    admID NVARCHAR(31) PRIMARY KEY,
    erpSystem NVARCHAR(31),
    integrationBool BOOL DEFAULT 0
);
`

module.exports = Node;
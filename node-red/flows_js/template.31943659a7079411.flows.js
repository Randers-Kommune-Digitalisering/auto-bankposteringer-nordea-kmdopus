const Node = {
  "id": "31943659a7079411",
  "type": "template",
  "z": "431f85f122b4636d",
  "g": "5126da366c0f2bdb",
  "name": "Byg SQL-tabel til stamdata",
  "field": "configs.database.admSysData",
  "fieldType": "global",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 220,
  "y": 100,
  "wires": [
    [
      "717d728ce8e15e1b"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

Node.template = `
CREATE TABLE IF NOT EXISTS admSysData (
    admName NVARCHAR(63),
    admEmail NVARCHAR(63),
    admID NVARCHAR(31) PRIMARY KEY,
    erpSystem NVARCHAR(31),
    integrationBool BOOL DEFAULT 0
);
`

module.exports = Node;
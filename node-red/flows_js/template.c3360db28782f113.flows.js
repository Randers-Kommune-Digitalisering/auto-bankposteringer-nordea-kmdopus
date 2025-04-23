const Node = {
  "id": "c3360db28782f113",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "ed2d8f9a9a392f4a",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 820,
  "wires": [
    [
      "faa74247d7af1f66"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
CREATE TABLE IF NOT EXISTS admSysData (
    accessToken TEXT NULL,
    refreshToken TEXT NULL,
    admName NVARCHAR(63),
    admEmail NVARCHAR(63),
    admID NVARCHAR(31) PRIMARY KEY,
    erpSystem NVARCHAR(31),
    integrationBool BOOL DEFAULT 0
);
`

module.exports = Node;
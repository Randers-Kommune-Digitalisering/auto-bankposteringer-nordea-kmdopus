const Node = {
  "id": "a12985ba394dbc8f",
  "type": "template",
  "z": "431f85f122b4636d",
  "g": "5126da366c0f2bdb",
  "name": "Byg SQL-tabel til bankkonti",
  "field": "configs.database.bankAccounts",
  "fieldType": "global",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 200,
  "y": 180,
  "wires": [
    [
      "12b79b33b84ebcc0"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

Node.template = `
CREATE TABLE IF NOT EXISTS bankAccounts (
    bankAccount NVARCHAR(31) NULL PRIMARY KEY,
    bankAccountName NVARCHAR(63) NULL,
    statusAccount int NULL,
    intermediateAccount int NULL
);
`

module.exports = Node;
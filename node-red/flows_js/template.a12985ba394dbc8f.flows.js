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
  "x": 180,
  "y": 320,
  "wires": [
    [
      "2395eb909756205f"
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
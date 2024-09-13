const Node = {
  "id": "737da55ebea83c21",
  "type": "template",
  "z": "431f85f122b4636d",
  "name": "Build bankAccounts db table",
  "field": "configs.database.bankAccounts",
  "fieldType": "global",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 400,
  "y": 120,
  "wires": [
    [
      "ce41aad1a3978514"
    ]
  ],
  "icon": "font-awesome/fa-pencil"
}

Node.template = `
CREATE TABLE IF NOT EXISTS {{global.configs.names.bankAccounts}} (
    bankAccount NVARCHAR(31) NULL PRIMARY KEY,
    bankAccountName NVARCHAR(63) NULL,
    statusAccount int NULL,
    intermediateAccount int NULL
);
`

module.exports = Node;
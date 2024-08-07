const Node = {
  "id": "0325a96c08c090ca",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "ab09acdf85426f34",
  "name": "SQL query \"CREATE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 740,
  "wires": [
    [
      "4505fbf639348b82"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
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
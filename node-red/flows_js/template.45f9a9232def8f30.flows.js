const Node = {
  "id": "45f9a9232def8f30",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "2aeaecfc9bd7fe9c",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 1040,
  "wires": [
    [
      "406c6201dd312690"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
CREATE TABLE IF NOT EXISTS bankAccounts (
    bankAccount NVARCHAR(31) NULL PRIMARY KEY,
    bankAccountName NVARCHAR(63) NULL,
    statusAccount CHAR(8) NULL,
    intermediateAccount CHAR(8) NULL
);
`

module.exports = Node;
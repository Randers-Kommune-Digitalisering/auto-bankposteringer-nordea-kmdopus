const Node = {
  "id": "8a5d1a455862d6c7",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "991be0015ce8239a",
  "name": "SQL query \"CREATE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 600,
  "wires": [
    [
      "b21467ac639384e7"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.template = `
CREATE TABLE IF NOT EXISTS masterData (
    admName NVARCHAR(63),
    admEmail NVARCHAR(63),
    admID NVARCHAR(31) PRIMARY KEY,
    erpSystem NVARCHAR(31),
    integrationBool BOOL DEFAULT 0
);
`

module.exports = Node;
const Node = {
  "id": "fdde2cc2827bdcfa",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "9e8459915626dabc",
  "name": "SQL query \"CREATE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 835,
  "y": 380,
  "wires": [
    [
      "cec013e5592b6995"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.template = `
CREATE TABLE IF NOT EXISTS accountingRules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    data NVARCHAR(4000)
)
`

module.exports = Node;
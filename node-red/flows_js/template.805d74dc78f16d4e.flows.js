const Node = {
  "id": "805d74dc78f16d4e",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "e93b981aeb463a07",
  "name": "SQL query \"DROP\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 585,
  "y": 460,
  "wires": [
    [
      "a98d7a03dbedfecd"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DROP TABLE accountingRules
`

module.exports = Node;
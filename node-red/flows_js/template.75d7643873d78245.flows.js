const Node = {
  "id": "75d7643873d78245",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "9a13326620241f51",
  "name": "SQL query \"SELECT\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 145,
  "y": 460,
  "wires": [
    [
      "b1bcd68602246442"
    ]
  ],
  "icon": "font-awesome/fa-search",
  "l": false
}

Node.template = `
SELECT * FROM accountingRules
`

module.exports = Node;
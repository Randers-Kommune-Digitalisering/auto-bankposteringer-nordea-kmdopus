const Node = {
  "id": "244b7c3a6ce0fba5",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "d257a29977308abc",
  "name": "Drop",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 1935,
  "y": 240,
  "wires": [
    [
      "2036376208bf964c"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

Node.template = `
DROP TABLE accountingRules
`

module.exports = Node;
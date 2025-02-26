const Node = {
  "id": "244b7c3a6ce0fba5",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "d992b55d9d319a30",
  "name": "Drop",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 135,
  "y": 480,
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
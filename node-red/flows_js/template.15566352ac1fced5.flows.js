const Node = {
  "id": "15566352ac1fced5",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "d992b55d9d319a30",
  "name": "Select all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 135,
  "y": 440,
  "wires": [
    [
      "1b85e041a8aa909f"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT * FROM accountingRules
`

module.exports = Node;
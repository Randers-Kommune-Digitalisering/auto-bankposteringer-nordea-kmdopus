const Node = {
  "id": "e28dd10da98a8d3b",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "d992b55d9d319a30",
  "name": "Select",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 480,
  "wires": [
    [
      "9208b7ba656edc3c"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT * FROM accountingRules
`

module.exports = Node;
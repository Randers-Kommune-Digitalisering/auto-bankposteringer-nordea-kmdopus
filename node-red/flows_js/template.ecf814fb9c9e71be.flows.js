const Node = {
  "id": "ecf814fb9c9e71be",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "704dc03174bd43e2",
  "name": "Select all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 835,
  "y": 360,
  "wires": [
    [
      "403da516a8c098ac"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT * FROM transactionsWithNoMatch
`

module.exports = Node;
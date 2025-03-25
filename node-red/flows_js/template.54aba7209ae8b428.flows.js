const Node = {
  "id": "54aba7209ae8b428",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "704dc03174bd43e2",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 835,
  "y": 240,
  "wires": [
    [
      "9177bdbf7796f59d"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
{{global.configs.database.transactionsWithNoMatch}}
`

module.exports = Node;
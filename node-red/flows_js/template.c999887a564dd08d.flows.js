const Node = {
  "id": "c999887a564dd08d",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "79633097bdfca497",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 1435,
  "y": 240,
  "wires": [
    [
      "523286d0fe67fe92"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
{{global.configs.database.bankAccounts}}
`

module.exports = Node;
const Node = {
  "id": "c86bd7d572d91122",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "SQL query \"CREATE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 105,
  "y": 260,
  "wires": [
    [
      "18403c0f1aa57038"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.template = `
{{global.configs.database.accountingRules}}
`

module.exports = Node;
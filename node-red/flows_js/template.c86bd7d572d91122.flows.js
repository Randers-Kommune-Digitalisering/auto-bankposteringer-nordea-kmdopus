const Node = {
  "id": "c86bd7d572d91122",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 150,
  "y": 280,
  "wires": [
    [
      "28890701147343a3"
    ]
  ],
  "icon": "font-awesome/fa-search-plus"
}

Node.template = `
{{global.configs.database.accountingRules}}
`

module.exports = Node;
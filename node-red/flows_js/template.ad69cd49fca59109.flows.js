const Node = {
  "id": "ad69cd49fca59109",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "e57ddaa2ec0eda65",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 690,
  "y": 380,
  "wires": [
    [
      "4e6903b8a626d514"
    ]
  ],
  "icon": "font-awesome/fa-search-plus"
}

Node.template = `
{{global.configs.database.bankAccounts}}
`

module.exports = Node;
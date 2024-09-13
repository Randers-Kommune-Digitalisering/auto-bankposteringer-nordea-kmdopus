const Node = {
  "id": "ad69cd49fca59109",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "e57ddaa2ec0eda65",
  "name": "SQL query \"CREATE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 105,
  "y": 460,
  "wires": [
    [
      "fd5ff5b282934a0f"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.template = `
{{global.configs.database.bankAccounts}}
`

module.exports = Node;
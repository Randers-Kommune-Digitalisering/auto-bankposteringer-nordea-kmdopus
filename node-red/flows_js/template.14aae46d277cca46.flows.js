const Node = {
  "id": "14aae46d277cca46",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "77f345d4689dee38",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 150,
  "y": 940,
  "wires": [
    [
      "6d215927b9411c92"
    ]
  ],
  "icon": "font-awesome/fa-search-plus"
}

Node.template = `
{{global.configs.database.transactionsWithNoMatch}}
`

module.exports = Node;
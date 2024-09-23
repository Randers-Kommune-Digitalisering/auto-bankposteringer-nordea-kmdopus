const Node = {
  "id": "59b7c5db6e53357e",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "883c8c287020e842",
  "name": "SQL query \"CREATE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 105,
  "y": 400,
  "wires": [
    [
      "87c35f9bef263b1c"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.template = `
{{global.configs.database.masterData}}
`

module.exports = Node;
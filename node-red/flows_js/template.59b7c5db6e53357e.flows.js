const Node = {
  "id": "59b7c5db6e53357e",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "883c8c287020e842",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 690,
  "y": 200,
  "wires": [
    [
      "e64865c17df968aa"
    ]
  ],
  "icon": "font-awesome/fa-search-plus"
}

Node.template = `
{{global.configs.database.masterData}}
`

module.exports = Node;
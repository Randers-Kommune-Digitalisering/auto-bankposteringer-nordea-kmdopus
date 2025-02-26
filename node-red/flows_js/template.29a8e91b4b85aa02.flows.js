const Node = {
  "id": "29a8e91b4b85aa02",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "d992b55d9d319a30",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 135,
  "y": 240,
  "wires": [
    [
      "d6562eeddebb1091"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
{{global.configs.database.accountingRules}}
`

module.exports = Node;
const Node = {
  "id": "ffcfe034a0729428",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "24481f222bcf4517",
  "name": "Create",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 1135,
  "y": 240,
  "wires": [
    [
      "096c9db9233bb226"
    ]
  ],
  "icon": "font-awesome/fa-database",
  "l": false
}

Node.template = `
{{global.configs.database.admSysData}}
`

module.exports = Node;
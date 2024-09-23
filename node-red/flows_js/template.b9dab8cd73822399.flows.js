const Node = {
  "id": "b9dab8cd73822399",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "08a9715c85ab97c1",
  "name": "SQL query \"SELECT\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 835,
  "y": 260,
  "wires": [
    [
      "8b08e0633852321c"
    ]
  ],
  "icon": "font-awesome/fa-search",
  "l": false
}

Node.template = `
SELECT * FROM {{global.configs.names.accountingRules}}
`

module.exports = Node;
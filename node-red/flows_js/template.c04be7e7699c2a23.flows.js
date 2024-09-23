const Node = {
  "id": "c04be7e7699c2a23",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "59157a3330ff3d2f",
  "name": "SQL query \"DELETE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 425,
  "y": 260,
  "wires": [
    [
      "7862c5126461b57c"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DELETE FROM {{global.configs.names.accountingRules}}
`

module.exports = Node;
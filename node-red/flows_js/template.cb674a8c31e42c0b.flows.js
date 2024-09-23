const Node = {
  "id": "cb674a8c31e42c0b",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "83a83adf1d5ad76d",
  "name": "SQL query \"SELECT\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 835,
  "y": 540,
  "wires": [
    [
      "fb8f4917c8c0c561"
    ]
  ],
  "icon": "font-awesome/fa-search",
  "l": false
}

Node.template = `
SELECT * FROM {{global.configs.names.bankAccounts}}
`

module.exports = Node;
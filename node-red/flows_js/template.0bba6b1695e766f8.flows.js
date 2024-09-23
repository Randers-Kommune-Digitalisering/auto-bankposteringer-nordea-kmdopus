const Node = {
  "id": "0bba6b1695e766f8",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "e8e6c41949b01e67",
  "name": "SQL query \"DELETE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 425,
  "y": 540,
  "wires": [
    [
      "49cf3a9727a7fe0f"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DELETE FROM {{global.configs.names.bankAccounts}}
`

module.exports = Node;
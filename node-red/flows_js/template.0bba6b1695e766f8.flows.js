const Node = {
  "id": "0bba6b1695e766f8",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "e57ddaa2ec0eda65",
  "name": "Delete all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 160,
  "y": 740,
  "wires": [
    [
      "2dc8bea8c9379d77"
    ]
  ],
  "icon": "font-awesome/fa-search-minus"
}

Node.template = `
DELETE FROM bankAccounts
`

module.exports = Node;
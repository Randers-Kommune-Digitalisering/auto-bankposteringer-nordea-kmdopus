const Node = {
  "id": "cb674a8c31e42c0b",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "e57ddaa2ec0eda65",
  "name": "Select all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 700,
  "y": 620,
  "wires": [
    [
      "c10c0878045be6f9"
    ]
  ],
  "icon": "font-awesome/fa-search"
}

Node.template = `
SELECT * FROM bankAccounts
`

module.exports = Node;
const Node = {
  "id": "93497ce1a8b8aa39",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "7c1507aa54800ed5",
  "name": "SQL query \"SELECT\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 865,
  "y": 740,
  "wires": [
    [
      "16d864c6cc535d5a"
    ]
  ],
  "icon": "font-awesome/fa-search",
  "l": false
}

Node.template = `
SELECT * FROM bankAccounts
`

module.exports = Node;
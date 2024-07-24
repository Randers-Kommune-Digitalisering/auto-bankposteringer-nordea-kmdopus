const Node = {
  "id": "c5aad48489925aca",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "db9c10bd096dcbc3",
  "name": "SQL query \"DELETE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 735,
  "y": 300,
  "wires": [
    [
      "69e0cf3b52615cfc"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DELETE FROM accountingRules
`

module.exports = Node;
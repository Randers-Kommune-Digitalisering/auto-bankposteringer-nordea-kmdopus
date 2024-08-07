const Node = {
  "id": "7101b581a5a4a7f1",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "b56ac63d41e82307",
  "name": "SQL query \"DELETE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 415,
  "y": 760,
  "wires": [
    [
      "a1a80db5f82d0235"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DELETE FROM bankAccounts
`

module.exports = Node;
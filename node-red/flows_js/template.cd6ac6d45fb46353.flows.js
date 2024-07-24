const Node = {
  "id": "cd6ac6d45fb46353",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "db9c10bd096dcbc3",
  "name": "SQL query \"INSERT\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 875,
  "y": 280,
  "wires": [
    [
      "53eed35d5539b46b"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.template = `
INSERT INTO konteringsregler (data)
VALUES {{{values}}};
`

module.exports = Node;
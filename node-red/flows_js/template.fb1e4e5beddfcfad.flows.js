const Node = {
  "id": "fb1e4e5beddfcfad",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "9e5398bb4491a461",
  "name": "SQL query \"DELETE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 415,
  "y": 620,
  "wires": [
    [
      "5514d45ca5a293ec"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DELETE FROM masterData
`

module.exports = Node;
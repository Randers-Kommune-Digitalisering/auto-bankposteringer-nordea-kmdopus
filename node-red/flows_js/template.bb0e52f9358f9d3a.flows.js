const Node = {
  "id": "bb0e52f9358f9d3a",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "4de35340ec27d363",
  "name": "SQL query \"DELETE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 415,
  "y": 480,
  "wires": [
    [
      "edf243caadc4c49f"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DELETE FROM accountingRules
`

module.exports = Node;
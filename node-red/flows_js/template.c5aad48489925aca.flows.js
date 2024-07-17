const Node = {
  "id": "c5aad48489925aca",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "name": "SQL",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 970,
  "y": 220,
  "wires": [
    [
      "69e0cf3b52615cfc"
    ]
  ]
}

Node.template = `
DELETE FROM konteringsregler
`

module.exports = Node;
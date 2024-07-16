const Node = {
  "id": "75d7643873d78245",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "name": "SQL",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 830,
  "y": 280,
  "wires": [
    [
      "b1bcd68602246442"
    ]
  ]
}

Node.template = `
SELECT * FROM konteringsregler
`

module.exports = Node;
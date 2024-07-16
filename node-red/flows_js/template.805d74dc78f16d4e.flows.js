const Node = {
  "id": "805d74dc78f16d4e",
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
  "y": 460,
  "wires": [
    [
      "a98d7a03dbedfecd"
    ]
  ]
}

Node.template = `
DROP TABLE konteringsregler
`

module.exports = Node;
const Node = {
  "id": "cd6ac6d45fb46353",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "name": "SQL",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 1010,
  "y": 180,
  "wires": [
    [
      "53eed35d5539b46b"
    ]
  ]
}

Node.template = `
INSERT INTO konteringsregler (data)
VALUES {{{values}}};
`

module.exports = Node;
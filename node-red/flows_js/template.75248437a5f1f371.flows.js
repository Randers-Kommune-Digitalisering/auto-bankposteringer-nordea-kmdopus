const Node = {
  "id": "75248437a5f1f371",
  "type": "template",
  "z": "VueExample",
  "name": "SQL",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 710,
  "y": 520,
  "wires": [
    [
      "b0f9717f75d67dd4"
    ]
  ]
}

Node.template = `
INSERT INTO
    konteringsregler (data)
VALUES
    ('{{{payload}}}')
`

module.exports = Node;
const Node = {
  "id": "bb10105206ec4421",
  "type": "template",
  "z": "b0363dafd369e927",
  "name": "",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 340,
  "y": 500,
  "wires": [
    [
      "8f7d63f6fce1b7b1"
    ]
  ]
}

Node.template = `
SELECT * FROM runHistory
`

module.exports = Node;
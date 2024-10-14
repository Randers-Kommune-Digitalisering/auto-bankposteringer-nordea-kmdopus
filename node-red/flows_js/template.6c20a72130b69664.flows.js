const Node = {
  "id": "6c20a72130b69664",
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
  "y": 80,
  "wires": [
    [
      "3d54f3b0d71bfbe3"
    ]
  ]
}

Node.template = `
DROP TABLE runHistory 
`

module.exports = Node;
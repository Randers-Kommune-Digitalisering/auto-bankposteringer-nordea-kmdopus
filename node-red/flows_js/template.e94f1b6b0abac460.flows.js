const Node = {
  "id": "e94f1b6b0abac460",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "1e97f626957f10f8",
  "name": "Select",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 720,
  "wires": [
    [
      "741e956f908de302"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT * FROM accountingRules
`

module.exports = Node;
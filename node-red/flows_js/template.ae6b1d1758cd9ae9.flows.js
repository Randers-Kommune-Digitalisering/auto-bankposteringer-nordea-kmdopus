const Node = {
  "id": "ae6b1d1758cd9ae9",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "1e97f626957f10f8",
  "name": "Select all",
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
      "465846f48f2f1959"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT * FROM accountingRules
`

module.exports = Node;
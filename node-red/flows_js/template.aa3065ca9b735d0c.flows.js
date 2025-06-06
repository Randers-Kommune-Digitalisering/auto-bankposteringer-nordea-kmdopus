const Node = {
  "id": "aa3065ca9b735d0c",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "d185a894a0ce7b49",
  "name": "Select all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 1340,
  "wires": [
    [
      "9d6f6396bc55dbd0"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT * FROM typeDescriptions
`

module.exports = Node;
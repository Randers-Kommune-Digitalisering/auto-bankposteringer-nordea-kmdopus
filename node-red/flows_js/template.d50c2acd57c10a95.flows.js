const Node = {
  "id": "d50c2acd57c10a95",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "bae1c13f6f716fe4",
  "name": "Select all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 1020,
  "wires": [
    [
      "8e3ea26efdd6d667"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT * FROM transactionsWithNoMatch
`

module.exports = Node;
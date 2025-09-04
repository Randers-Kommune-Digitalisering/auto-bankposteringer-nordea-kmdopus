const Node = {
  "id": "b2e562bea3ec8ca7",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "30b2fd7f3bc3b0a9",
  "name": "Insert",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 1160,
  "wires": [
    [
      "87aa8f1a5f50958e"
    ]
  ],
  "icon": "font-awesome/fa-plus",
  "l": false
}

Node.template = `
INSERT INTO runHistory (bookingDate) VALUES ("{{global.dates.bookingDate}}")
`

module.exports = Node;
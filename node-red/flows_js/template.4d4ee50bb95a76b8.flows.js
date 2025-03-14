const Node = {
  "id": "4d4ee50bb95a76b8",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "24481f222bcf4517",
  "name": "Select all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 1095,
  "y": 320,
  "wires": [
    [
      "c14479aa4f04859e"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT * FROM masterData
`

module.exports = Node;
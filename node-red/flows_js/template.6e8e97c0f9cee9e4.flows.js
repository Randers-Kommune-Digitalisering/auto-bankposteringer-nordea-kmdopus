const Node = {
  "id": "6e8e97c0f9cee9e4",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "24481f222bcf4517",
  "name": "Delete all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 620,
  "wires": [
    [
      "bc8e10bc5542fd25"
    ]
  ],
  "icon": "font-awesome/fa-minus",
  "l": false
}

Node.template = `
DELETE FROM admSysData
`

module.exports = Node;
const Node = {
  "id": "b6cc7d327238eada",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "ed2d8f9a9a392f4a",
  "name": "Delete all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 860,
  "wires": [
    [
      "f5c251c5704de0d4"
    ]
  ],
  "icon": "font-awesome/fa-minus",
  "l": false
}

Node.template = `
DELETE FROM admSysData
`

module.exports = Node;
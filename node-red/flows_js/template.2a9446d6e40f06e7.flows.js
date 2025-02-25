const Node = {
  "id": "2a9446d6e40f06e7",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "883c8c287020e842",
  "name": "Delete all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 700,
  "y": 340,
  "wires": [
    [
      "3116e0f4e3484858"
    ]
  ],
  "icon": "font-awesome/fa-search-minus"
}

Node.template = `
DELETE FROM masterData
`

module.exports = Node;
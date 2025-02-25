const Node = {
  "id": "87979ca976751599",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "883c8c287020e842",
  "name": "Select all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 700,
  "y": 400,
  "wires": [
    [
      "9df19e45e466d48e"
    ]
  ],
  "icon": "font-awesome/fa-search"
}

Node.template = `
SELECT * FROM masterData
`

module.exports = Node;
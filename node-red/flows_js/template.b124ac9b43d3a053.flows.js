const Node = {
  "id": "b124ac9b43d3a053",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "77f345d4689dee38",
  "name": "Select all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 800,
  "y": 600,
  "wires": [
    [
      "329966e98f869e52"
    ]
  ],
  "icon": "font-awesome/fa-search"
}

Node.template = `
SELECT * FROM transactionsWithNoMatch
`

module.exports = Node;
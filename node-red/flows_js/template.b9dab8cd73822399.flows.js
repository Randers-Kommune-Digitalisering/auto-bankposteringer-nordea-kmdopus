const Node = {
  "id": "b9dab8cd73822399",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "Select all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 160,
  "y": 400,
  "wires": [
    [
      "846b3397f7a1c665"
    ]
  ],
  "icon": "font-awesome/fa-search"
}

Node.template = `
SELECT * FROM accountingRules
`

module.exports = Node;
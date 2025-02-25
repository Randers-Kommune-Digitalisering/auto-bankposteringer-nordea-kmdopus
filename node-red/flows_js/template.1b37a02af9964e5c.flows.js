const Node = {
  "id": "1b37a02af9964e5c",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "Drop",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 340,
  "y": 460,
  "wires": [
    [
      "1a91648648f8ba18"
    ]
  ],
  "icon": "font-awesome/fa-search-minus"
}

Node.template = `
DROP TABLE accountingRules
`

module.exports = Node;
const Node = {
  "id": "c04be7e7699c2a23",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "Delete all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 160,
  "y": 340,
  "wires": [
    [
      "96ae014bece8f2dd"
    ]
  ],
  "icon": "font-awesome/fa-search-minus"
}

Node.template = `
DELETE FROM accountingRules
`

module.exports = Node;
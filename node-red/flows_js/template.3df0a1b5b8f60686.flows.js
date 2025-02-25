const Node = {
  "id": "3df0a1b5b8f60686",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "ef673a2e295a52ea",
  "name": "Delete",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 150,
  "y": 460,
  "wires": [
    [
      "97b1a39b0bbca630"
    ]
  ],
  "icon": "font-awesome/fa-search-minus"
}

Node.template = `
DELETE FROM
    accountingRules
WHERE
    RuleID = {{uid}}
`

module.exports = Node;
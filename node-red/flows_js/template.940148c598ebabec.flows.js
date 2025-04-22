const Node = {
  "id": "940148c598ebabec",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "1e97f626957f10f8",
  "name": "Delete",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 600,
  "wires": [
    [
      "6933f3c645c88921"
    ]
  ],
  "icon": "font-awesome/fa-minus",
  "l": false
}

Node.template = `
DELETE FROM
    accountingRules
WHERE
    ruleID = {{uid}}
`

module.exports = Node;
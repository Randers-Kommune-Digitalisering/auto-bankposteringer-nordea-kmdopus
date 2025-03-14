const Node = {
  "id": "55629a06679aa5d9",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "d992b55d9d319a30",
  "name": "Delete",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 360,
  "wires": [
    [
      "d6562eeddebb1091"
    ]
  ],
  "icon": "font-awesome/fa-minus",
  "l": false
}

Node.template = `
DELETE FROM
    accountingRules
WHERE
    RuleID = {{uid}}
`

module.exports = Node;
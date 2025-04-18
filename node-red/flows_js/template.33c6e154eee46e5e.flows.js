const Node = {
  "id": "33c6e154eee46e5e",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "704dc03174bd43e2",
  "name": "Delete",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 545,
  "y": 320,
  "wires": [
    [
      "47554be7fa0c6e02"
    ]
  ],
  "icon": "font-awesome/fa-minus",
  "l": false
}

Node.template = `
DELETE FROM
    transactionsWithNoMatch
WHERE
    transactionID = '{{uid}}'
`

module.exports = Node;
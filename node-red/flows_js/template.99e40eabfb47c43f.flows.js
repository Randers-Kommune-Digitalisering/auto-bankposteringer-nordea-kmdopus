const Node = {
  "id": "99e40eabfb47c43f",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "ebde7a5ec7e3804c",
  "name": "Drop",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 875,
  "y": 500,
  "wires": [
    [
      "3577d2dc22b83335"
    ]
  ],
  "icon": "font-awesome/fa-trash",
  "l": false
}

Node.template = `
DROP TABLE
    runHistory,
    transactionsWithNoMatch,
    accountingRules
`

module.exports = Node;
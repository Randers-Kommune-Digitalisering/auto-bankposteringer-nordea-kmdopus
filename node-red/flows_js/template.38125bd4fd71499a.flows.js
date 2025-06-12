const Node = {
  "id": "38125bd4fd71499a",
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
  "x": 965,
  "y": 560,
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
    accountingRules,
    runHistory,
    transactionsWithNoMatch,
    bankAccounts
`

module.exports = Node;
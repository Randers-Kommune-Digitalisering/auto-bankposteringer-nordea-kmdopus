const Node = {
  "id": "45d3b1fcd85fd363",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "77f345d4689dee38",
  "name": "Delete",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 790,
  "y": 560,
  "wires": [
    [
      "d34b93a4a80c9b97"
    ]
  ],
  "icon": "font-awesome/fa-search-minus"
}

Node.template = `
DELETE FROM
    transactionsWithNoMatch
WHERE
    transactionID = {{uid}}
`

module.exports = Node;
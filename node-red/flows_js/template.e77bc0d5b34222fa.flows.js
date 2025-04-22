const Node = {
  "id": "e77bc0d5b34222fa",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "bae1c13f6f716fe4",
  "name": "Delete",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 545,
  "y": 560,
  "wires": [
    [
      "ef5df748b7523f13"
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
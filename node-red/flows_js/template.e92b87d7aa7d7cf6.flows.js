const Node = {
  "id": "e92b87d7aa7d7cf6",
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
  "x": 115,
  "y": 940,
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
    bookingDate = '{{date}}'
`

module.exports = Node;
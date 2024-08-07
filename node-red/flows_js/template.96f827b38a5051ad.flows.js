const Node = {
  "id": "96f827b38a5051ad",
  "type": "template",
  "z": "202e1898db8daa8b",
  "g": "2677659fd0ff4476",
  "name": "SQL query \"DELETE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 1575,
  "y": 120,
  "wires": [
    [
      "53ab80a1e8bfd5d5",
      "0cdc629dc7806b48"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DELETE FROM bankAccounts
`

module.exports = Node;
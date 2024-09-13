const Node = {
  "id": "1c74f8043e850294",
  "type": "template",
  "z": "32cf2bec698ca424",
  "g": "a6213de5d0ba3b76",
  "name": "SQL query \"DELETE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 975,
  "y": 480,
  "wires": [
    [
      "5bcc7e609fd01baf",
      "5edfef391387157b"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DELETE FROM {{global.configs.names.bankAccounts}}
`

module.exports = Node;
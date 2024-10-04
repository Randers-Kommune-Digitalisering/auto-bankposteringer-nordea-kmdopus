const Node = {
  "id": "1c74f8043e850294",
  "type": "template",
  "z": "32cf2bec698ca424",
  "g": "fd2d20f8e7169b95",
  "name": "SQL query \"DELETE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 335,
  "y": 600,
  "wires": [
    [
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
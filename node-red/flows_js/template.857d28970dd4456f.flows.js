const Node = {
  "id": "857d28970dd4456f",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "2aeaecfc9bd7fe9c",
  "name": "Delete all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 1080,
  "wires": [
    [
      "08f0b8f41f91ba07"
    ]
  ],
  "icon": "font-awesome/fa-minus",
  "l": false
}

Node.template = `
DELETE FROM bankAccounts
`

module.exports = Node;
const Node = {
  "id": "f63ebcf05622cd78",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "79633097bdfca497",
  "name": "Delete all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 1435,
  "y": 280,
  "wires": [
    [
      "9ab006b889dc4ab5"
    ]
  ],
  "icon": "font-awesome/fa-minus",
  "l": false
}

Node.template = `
DELETE FROM bankAccounts
`

module.exports = Node;
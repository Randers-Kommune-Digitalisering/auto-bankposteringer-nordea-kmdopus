const Node = {
  "id": "22e36697e66bda08",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "79633097bdfca497",
  "name": "Select all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 115,
  "y": 840,
  "wires": [
    [
      "ea4f7e41e12a765a"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT * FROM bankAccounts
`

module.exports = Node;
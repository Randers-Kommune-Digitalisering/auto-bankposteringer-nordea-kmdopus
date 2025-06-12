const Node = {
  "id": "11a56ed7cb68c548",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "2aeaecfc9bd7fe9c",
  "name": "Select",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 545,
  "y": 820,
  "wires": [
    [
      "8215383e713f54f1"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT * FROM bankAccounts
`

module.exports = Node;
const Node = {
  "id": "187971070d085741",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "d185a894a0ce7b49",
  "name": "Delete all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 545,
  "y": 960,
  "wires": [
    [
      "d396c5d5ea54de0c"
    ]
  ],
  "icon": "font-awesome/fa-minus",
  "l": false
}

Node.template = `
DELETE FROM typeDescriptions
`

module.exports = Node;
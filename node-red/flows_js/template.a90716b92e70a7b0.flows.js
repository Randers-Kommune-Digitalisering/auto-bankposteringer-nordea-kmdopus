const Node = {
  "id": "a90716b92e70a7b0",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "02fc47417527e1d2",
  "name": "Update",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 525,
  "y": 700,
  "wires": [
    [
      "ec7d3e1c4d9d20fb"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.template = `
UPDATE runHistory SET statusCode = {{statusCode}} WHERE uid = {{uid}}
`

module.exports = Node;
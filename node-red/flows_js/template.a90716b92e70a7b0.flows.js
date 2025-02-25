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
  "x": 160,
  "y": 740,
  "wires": [
    [
      "015d66cd112be473"
    ]
  ],
  "icon": "font-awesome/fa-search-plus"
}

Node.template = `
UPDATE runHistory SET statusCode = {{statusCode}} WHERE uid = {{uid}}
`

module.exports = Node;
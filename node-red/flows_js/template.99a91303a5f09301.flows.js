const Node = {
  "id": "99a91303a5f09301",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "02fc47417527e1d2",
  "name": "Add",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 525,
  "y": 660,
  "wires": [
    [
      "ec7d3e1c4d9d20fb"
    ]
  ],
  "icon": "font-awesome/fa-search-plus",
  "l": false
}

Node.template = `
INSERT INTO runHistory (uid, dato, statusCode) VALUES ({{uid}}, '{{dato}}', {{statusCode}})
`

module.exports = Node;
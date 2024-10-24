const Node = {
  "id": "99a91303a5f09301",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "02fc47417527e1d2",
  "name": "Insert",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 150,
  "y": 920,
  "wires": [
    [
      "015d66cd112be473"
    ]
  ],
  "icon": "font-awesome/fa-search-plus"
}

Node.template = `
INSERT INTO runHistory (uid, dato, statusCode) VALUES ({{uid}}, '{{dato}}', {{statusCode}})
`

module.exports = Node;
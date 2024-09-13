const Node = {
  "id": "87979ca976751599",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "ccdbed98c6151465",
  "name": "SQL query \"SELECT\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 855,
  "y": 320,
  "wires": [
    [
      "0d3f704c1edd5785"
    ]
  ],
  "icon": "font-awesome/fa-search",
  "l": false
}

Node.template = `
SELECT * FROM {{global.configs.names.masterData}}
`

module.exports = Node;
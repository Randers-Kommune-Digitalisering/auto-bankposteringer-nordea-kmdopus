const Node = {
  "id": "2a9446d6e40f06e7",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "769eb9119e1608d5",
  "name": "SQL query \"DELETE\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 405,
  "y": 340,
  "wires": [
    [
      "ebc4d88b187ec0f2"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DELETE FROM {{global.configs.names.masterData}}
`

module.exports = Node;
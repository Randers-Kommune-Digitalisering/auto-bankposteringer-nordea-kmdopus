const Node = {
  "id": "862489a949fd3930",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "15d9bd97e3d242ea",
  "name": "SQL query \"DROP\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 1275,
  "y": 180,
  "wires": [
    [
      "e4be96eea466ba98"
    ]
  ],
  "icon": "font-awesome/fa-search-minus",
  "l": false
}

Node.template = `
DROP TABLE {{global.configs.names.accountingRules}}
`

module.exports = Node;
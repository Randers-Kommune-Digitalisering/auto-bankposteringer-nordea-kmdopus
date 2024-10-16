const Node = {
  "id": "6075313023ba918d",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "a753759636e67186",
  "name": "SQL query \"SELECT\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 835,
  "y": 680,
  "wires": [
    [
      "1731520ad05ebff5"
    ]
  ],
  "icon": "font-awesome/fa-search",
  "l": false
}

Node.template = `
SELECT * FROM runHistory
`

module.exports = Node;
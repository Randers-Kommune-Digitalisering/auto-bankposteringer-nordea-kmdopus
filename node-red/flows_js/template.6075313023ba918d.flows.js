const Node = {
  "id": "6075313023ba918d",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "02fc47417527e1d2",
  "name": "Select all",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 800,
  "y": 360,
  "wires": [
    [
      "9067e342fbc7ac24"
    ]
  ],
  "icon": "font-awesome/fa-search"
}

Node.template = `
SELECT * FROM runHistory
`

module.exports = Node;
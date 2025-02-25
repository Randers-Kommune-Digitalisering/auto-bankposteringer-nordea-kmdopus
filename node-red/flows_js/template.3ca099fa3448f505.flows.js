const Node = {
  "id": "3ca099fa3448f505",
  "type": "template",
  "z": "92c28da6a66fdcb3",
  "g": "02fc47417527e1d2",
  "name": "Select",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 150,
  "y": 680,
  "wires": [
    [
      "428d2010939dee77"
    ]
  ],
  "icon": "font-awesome/fa-search"
}

Node.template = `
SELECT dato FROM runHistory WHERE uid = {{uid}}
`

module.exports = Node;
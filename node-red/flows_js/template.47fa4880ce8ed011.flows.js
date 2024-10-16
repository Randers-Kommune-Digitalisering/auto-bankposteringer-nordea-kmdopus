const Node = {
  "id": "47fa4880ce8ed011",
  "type": "template",
  "z": "32cf2bec698ca424",
  "g": "e2cf63522154167b",
  "name": "",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 525,
  "y": 1460,
  "wires": [
    [
      "2ddf7ae130df4510"
    ]
  ],
  "icon": "font-awesome/fa-search",
  "l": false
}

Node.template = `
SELECT dato FROM runHistory WHERE uid = {{uid}}
`

module.exports = Node;
const Node = {
  "id": "47fa4880ce8ed011",
  "type": "template",
  "z": "b0363dafd369e927",
  "name": "",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 760,
  "y": 860,
  "wires": [
    [
      "2ddf7ae130df4510"
    ]
  ]
}

Node.template = `
SELECT dato FROM runHistory WHERE uid = {{uid}}
`

module.exports = Node;
const Node = {
  "id": "28f99057edfa27a3",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "1d18d99feaaca4c4",
  "name": "Select",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 505,
  "y": 360,
  "wires": [
    [
      "ce63ab2768c7c169"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT dato FROM runHistory WHERE uid = {{uid}}
`

module.exports = Node;
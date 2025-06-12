const Node = {
  "id": "3e44a3ab6e9a3dec",
  "type": "template",
  "z": "47254dd1b3ed3b06",
  "g": "ed2d8f9a9a392f4a",
  "name": "Select",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 545,
  "y": 600,
  "wires": [
    [
      "5405a095deccd401"
    ]
  ],
  "icon": "font-awesome/fa-copy",
  "l": false
}

Node.template = `
SELECT * FROM admSysData
`

module.exports = Node;
const Node = {
  "id": "ee098b3acffc5527",
  "type": "template",
  "z": "9b998b2e60b3c784",
  "g": "45ded2ca44d7d129",
  "name": "SQL query \"SELECT\"",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 865,
  "y": 600,
  "wires": [
    [
      "f6d501aad8f72a0f"
    ]
  ],
  "icon": "font-awesome/fa-search",
  "l": false
}

Node.template = `
SELECT * FROM masterData
`

module.exports = Node;
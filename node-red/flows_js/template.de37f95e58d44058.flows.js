const Node = {
  "id": "de37f95e58d44058",
  "type": "template",
  "z": "b0363dafd369e927",
  "name": "",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 340,
  "y": 620,
  "wires": [
    [
      "4ad1fa717d796399"
    ]
  ]
}

Node.template = `
UPDATE runHistory SET success = {{success}} WHERE uid = {{uid}}
`

module.exports = Node;
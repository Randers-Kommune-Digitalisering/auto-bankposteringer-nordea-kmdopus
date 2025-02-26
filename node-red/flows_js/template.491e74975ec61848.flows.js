const Node = {
  "id": "491e74975ec61848",
  "type": "template",
  "z": "ee0cf4ce372e2d36",
  "g": "20a8bc261e47e665",
  "name": "",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 620,
  "y": 460,
  "wires": [
    [
      "7d5503ff84744612"
    ]
  ]
}

Node.template = `
UPDATE runHistory SET success = {{success}} WHERE uid = '{{global.messageIdentification}}'
`

module.exports = Node;
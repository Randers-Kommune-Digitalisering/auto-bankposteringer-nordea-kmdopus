const Node = {
  "id": "7e6dc21bbc1190eb",
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
  "y": 380,
  "wires": [
    [
      "aca21bcde2943106"
    ]
  ]
}

Node.template = `
INSERT INTO runHistory (dato, success) VALUES ('{{dato}}', {{success}})
`

module.exports = Node;
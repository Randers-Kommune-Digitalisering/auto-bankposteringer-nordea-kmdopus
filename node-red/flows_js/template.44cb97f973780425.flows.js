const Node = {
  "id": "44cb97f973780425",
  "type": "template",
  "z": "VueExample",
  "name": "SQL",
  "field": "payload",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 510,
  "y": 360,
  "wires": [
    [
      "917ce267e21a448a"
    ]
  ]
}

Node.template = `
UPDATE
    konteringsregler
SET
    data = "{{{payload}}}"
WHERE 
    id = {{uid}}
`

module.exports = Node;
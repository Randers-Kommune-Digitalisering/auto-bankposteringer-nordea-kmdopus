const Node = {
  "id": "44cb97f973780425",
  "type": "template",
  "z": "VueExample",
  "name": "SQL",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 1070,
  "y": 380,
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
    data = '{{{payload}}}'
WHERE 
    id = {{uid}}
`

module.exports = Node;
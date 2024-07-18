const Node = {
  "id": "f77ebcca1da1b246",
  "type": "template",
  "z": "VueExample",
  "name": "SQL",
  "field": "sql",
  "fieldType": "msg",
  "format": "handlebars",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 1090,
  "y": 420,
  "wires": [
    [
      "c864e987fb194e2e"
    ]
  ]
}

Node.template = `
DELETE FROM
    konteringsregler
WHERE
    id = {{uid}}
`

module.exports = Node;
const Node = {
  "id": "a42c3f32564d7258",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "1d18d99feaaca4c4",
  "name": "Update",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 545,
  "y": 320,
  "wires": [
    [
      "e1cc4459676fd651"
    ]
  ],
  "icon": "font-awesome/fa-pencil",
  "l": false
}

Node.template = `
UPDATE runHistory SET statusCode = {{statusCode}} WHERE uid = {{uid}}
`

module.exports = Node;
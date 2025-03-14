const Node = {
  "id": "3ae47117afdb4e6e",
  "type": "template",
  "z": "a1dc9966e881ac6b",
  "g": "1d18d99feaaca4c4",
  "name": "Insert",
  "field": "sql",
  "fieldType": "msg",
  "format": "sql",
  "syntax": "mustache",
  "template": "",
  "output": "str",
  "x": 505,
  "y": 280,
  "wires": [
    [
      "e1cc4459676fd651"
    ]
  ],
  "icon": "font-awesome/fa-plus",
  "l": false
}

Node.template = `
INSERT INTO runHistory (uid, originDate, statusCode) VALUES ({{uid}}, {{global.originDate}}, {{statusCode}})
`

module.exports = Node;